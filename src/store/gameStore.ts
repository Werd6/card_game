import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { GameState, Card, Character, Position, CombatCard, AttackInProgress, CombatResult, Player } from '../types/game';
import type { MapDefinition, TerrainType } from '../types/maps';
import { presetMaps } from '../types/maps';
import isEqual from 'lodash.isequal';
import { supabase } from '../supabaseClient';

interface PlayLogEntry {
  playerId: string;
  playerName: string;
  card?: Card;
  message?: string;
  timestamp: number;
}

interface GameStore extends GameState {
  // Map state
  currentMap: MapDefinition | null;
  setMap: (mapId: string) => void;
  changeMap: (mapId: string, gameId: string, channel: RealtimeChannel) => Promise<void>;
  
  // Actions
  setPlayers: (players: Player[], characters: Character[]) => void;
  selectCard: (card: Card | null) => void;
  selectCharacter: (character: Character | null) => void;
  moveCharacter: (characterId: string, newPosition: Position, gameId: string, channel: RealtimeChannel) => Promise<void>;
  playCard: (playerId: string, cardId: number, gameId: string, channel: RealtimeChannel) => Promise<void>;
  drawCard: (playerId: string, gameId: string, channel: RealtimeChannel, characterId?: string) => Promise<void>;
  shuffleDeck: (playerId: string) => void;
  drawInitialHand: (handSize: number) => void;
  log: PlayLogEntry[];
  clearLog: () => void;
  setStateFromServer: (newState: GameState) => void;
  updateCharacterHealth: (characterId: string, newHealth: number, gameId: string, channel: RealtimeChannel) => Promise<void>;
  beginAttack: (attackerId: string, defenderId: string, card: CombatCard, gameId: string, channel: RealtimeChannel) => Promise<void>;
  resolveAttack: (defendingCard: CombatCard | null, gameId: string, channel: RealtimeChannel) => Promise<void>;
  clearLastAttack: () => void;
  inspectDeck: (inspectorId: string, targetPlayerId: string, count: number, gameId: string, channel: RealtimeChannel) => Promise<void>;
  resolveDeckInspection: (cardsToTop: Card[], cardsToBottom: Card[], gameId: string, channel: RealtimeChannel) => Promise<void>;
  addTokenCharacter: (token: Omit<Character, 'id'>, gameId: string, channel: RealtimeChannel) => Promise<void>;
  updateCharacterConditions: (characterId: string, conditions: string[], gameId: string, channel: RealtimeChannel) => Promise<void>;
  rollDice: (playerId: string, sides: number, gameId: string, channel: RealtimeChannel) => Promise<void>;
  discardCard: (playerId: string, cardId: number, gameId: string, channel: RealtimeChannel) => Promise<void>;
}

const initialGameState: GameState = {
  players: [],
  characters: [],
  gridSize: {
    width: 8,  // Changed from 8 to 8
    height: 6, // Changed from 5 to 6
  },
  mapId: 'plains',
  selectedCard: null,
  selectedCharacter: null,
  log: [],
  attackInProgress: null,
  lastAttack: null,
  deckInspection: {
    isOpen: false,
    inspectorId: null,
    targetPlayerId: null,
    cards: [],
  },
};

// Fisher-Yates shuffle
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function shallowEqual(objA: any, objB: any) {
  if (objA === objB) return true;
  if (!objA || !objB) return false;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  for (let key of keysA) {
    if (objA[key] !== objB[key]) return false;
  }
  return true;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialGameState,
  log: [],
  currentMap: null,

  clearLastAttack: () => set({ lastAttack: null }),

  setMap: (mapId: string) => {
    const map = presetMaps.find(m => m.id === mapId) || presetMaps[0];
    set({ currentMap: map });
  },

  setPlayers: (players, characters) => set({ players, characters }),

  shuffleDeck: (playerId) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId
          ? { ...p, deck: shuffle(p.deck) }
          : p
      ),
    }));
  },

  drawInitialHand: (handSize) => {
    set((state) => ({
      players: state.players.map((p) => {
        let deck = shuffle(p.deck);
        const hand = deck.slice(0, handSize);
        deck = deck.slice(handSize);
        return { ...p, hand, deck };
      }),
    }));
  },

  selectCard: (card) => set({ selectedCard: card }),
  
  selectCharacter: (character) => set({ selectedCharacter: character }),
  
  moveCharacter: async (characterId, newPosition, gameId, channel) => {
    const currentState = get();

    const nextCharacters = currentState.characters.map((char) =>
      char.id === characterId
        ? { ...char, position: newPosition }
        : char
    );
    
    const payload: GameState = {
      ...currentState,
      characters: nextCharacters,
      mapId: currentState.currentMap?.id || 'plains',
    };

    try {
      // We can "fire-and-forget" the broadcast for snappy UI,
      // and let the database update happen in the background.
      channel.send({
        type: 'broadcast',
        event: 'game_state_update',
        payload,
      });
      await supabase.from('games').update({ state: payload }).eq('id', gameId);
      console.log('Successfully moved character and broadcasted state.');
    } catch (error) {
      console.error('Error moving character:', error);
    }
  },

  updateCharacterHealth: async (characterId, newHealth, gameId, channel) => {
    const currentState = get();
    const character = currentState.characters.find(c => c.id === characterId);
    
    if (!character) {
      console.error('Character not found for health update:', characterId);
      return;
    }

    let nextCharacters: Character[];
    
    // Check if character health is 0 or below - destroy any character
    if (newHealth <= 0) {
      // Remove the character from the game
      nextCharacters = currentState.characters.filter(c => c.id !== characterId);
      
      // Add a log entry for character destruction
      const nextLog = [
        ...currentState.log,
        {
          playerId: character.playerId,
          playerName: character.name,
          message: `${character.name} was destroyed!`,
          timestamp: Date.now(),
        },
      ];
      
      const payload: GameState = {
        ...currentState,
        characters: nextCharacters,
        log: nextLog,
        mapId: currentState.currentMap?.id || 'plains',
      };

      try {
        channel.send({
          type: 'broadcast',
          event: 'game_state_update',
          payload,
        });
        await supabase.from('games').update({ state: payload }).eq('id', gameId);
        console.log('Successfully destroyed character and broadcasted state.');
      } catch (error) {
        console.error('Error destroying character:', error);
      }
    } else {
      // Regular health update for characters that aren't at 0 HP
      nextCharacters = currentState.characters.map((char) =>
        char.id === characterId
          ? { ...char, health: newHealth }
          : char
      );
      
      const payload: GameState = {
        ...currentState,
        characters: nextCharacters,
        mapId: currentState.currentMap?.id || 'plains',
      };

      try {
        channel.send({
          type: 'broadcast',
          event: 'game_state_update',
          payload,
        });
        await supabase.from('games').update({ state: payload }).eq('id', gameId);
        console.log('Successfully updated character health and broadcasted state.');
      } catch (error) {
        console.error('Error updating character health:', error);
      }
    }
  },

  beginAttack: async (attackerId, defenderId, card, gameId, channel) => {
    console.log('beginAttack called with:', { attackerId, defenderId, cardId: card.id, gameId });
    
    const currentState = get();
    const attackerCharacter = currentState.characters.find((c) => c.id === attackerId);
    if (!attackerCharacter) {
      console.error('Attacker character not found for beginAttack action.');
      return;
    }
    const attackerPlayer = currentState.players.find(p => p.id === attackerCharacter.playerId);

    if (!attackerPlayer) {
      console.error('Attacker player not found for beginAttack action.');
      return;
    }

    // Allow if attackerId endsWith card.owner (or strict equal)
    if (card.owner && !attackerId.endsWith(card.owner)) {
      console.error('Cannot attack: card does not belong to this character.', { 
        cardOwner: card.owner, 
        attackerId 
      });
      return;
    }

    console.log('beginAttack validation passed, proceeding with attack...');

    // 1. Calculate the next state.
    const nextPlayers = currentState.players.map((p) =>
      p.id === attackerPlayer.id
        ? {
            ...p,
            hand: p.hand.filter((c) => c.id !== card.id),
          }
        : p
    );
    
    const attackInProgress: AttackInProgress = {
      attackerId,
      defenderId,
      card,
    };

    // 2. Build the complete, serializable game state payload.
    const payload: GameState = {
      ...currentState,
      players: nextPlayers,
      attackInProgress,
      mapId: currentState.currentMap?.id || 'plains',
    };

    console.log('beginAttack payload prepared:', payload);

    // 3. Persist and broadcast the new state.
    try {
      await supabase.from('games').update({ state: payload }).eq('id', gameId);
      const status = await channel.send({
        type: 'broadcast',
        event: 'game_state_update',
        payload,
      });
      if (status !== 'ok') {
        throw new Error(`Broadcast failed with status: ${status}`);
      }
      console.log('Successfully began attack and broadcasted state.');
    } catch (error) {
      console.error('Error beginning attack:', error);
    }
  },

  resolveAttack: async (defendingCard, gameId, channel) => {
    const currentState = get();
    const { attackInProgress } = currentState;

    if (!attackInProgress) {
      console.error('resolveAttack called with no attack in progress.');
      return;
    }

    const { attackerId, defenderId, card: attackingCard } = attackInProgress;

    const attackerCharacter = currentState.characters.find(c => c.id === attackerId);
    const defenderCharacter = currentState.characters.find(c => c.id === defenderId);

    if (!attackerCharacter || !defenderCharacter) {
      console.error('Attacker or defender character not found for resolveAttack');
      return;
    }

    // Allow if defenderId endsWith card.owner (or strict equal)
    if (defendingCard && defendingCard.owner && !defenderId.endsWith(defendingCard.owner)) {
      console.error('Cannot defend: card does not belong to this character.', { 
        cardOwner: defendingCard.owner, 
        defenderId 
      });
      return;
    }

    // 1. Calculate the next state.
    const nextPlayers = currentState.players.map((p) => {
      // Attacker discards card
      if (p.id === attackerCharacter.playerId) {
        return {
          ...p,
          discardPile: [...p.discardPile, attackingCard],
        };
      }
      // Defender discards card
      if (p.id === defenderCharacter.playerId && defendingCard) {
        return {
          ...p,
          hand: p.hand.filter((c) => c.id !== defendingCard.id),
          discardPile: [...p.discardPile, defendingCard],
        };
      }
      return p;
    });

    const attacker = currentState.characters.find(c => c.id === attackerId);
    const defender = currentState.characters.find(c => c.id === defenderId);

    const combatResult: CombatResult = {
      attackerId,
      defenderId,
      attackingCard,
      defendingCard,
    };

    let logMessage = `${attacker?.name || 'A player'} attacked ${defender?.name || 'another player'} with a ${attackingCard.attack} ATK card.`;
    if (defendingCard) {
      logMessage += ` ${defender?.name || 'The defender'} defended with a ${defendingCard.defense} DEF card.`;
    } else {
      logMessage += ` ${defender?.name || 'The defender'} did not block.`;
    }

    const nextLog = [
      ...currentState.log,
      {
        playerId: attackerId,
        playerName: attacker?.name || 'Attacker',
        card: attackingCard,
        message: logMessage,
        timestamp: Date.now(),
      },
    ];

    // 2. Build the complete, serializable game state payload.
    const payload: GameState = {
      ...currentState,
      players: nextPlayers,
      attackInProgress: null,
      lastAttack: combatResult,
      log: nextLog,
      mapId: currentState.currentMap?.id || 'plains',
    };

    // 3. Persist and broadcast the new state.
    try {
      await supabase.from('games').update({ state: payload }).eq('id', gameId);
      const status = await channel.send({
        type: 'broadcast',
        event: 'game_state_update',
        payload,
      });
      if (status !== 'ok') {
        throw new Error(`Broadcast failed with status: ${status}`);
      }
      console.log('Successfully resolved attack and broadcasted state.');
    } catch (error) {
      console.error('Error resolving attack:', error);
    }
  },

  playCard: async (playerId, cardId, gameId, channel) => {
    const currentState = get();
    const player = currentState.players.find((p) => p.id === playerId);
    const card = player?.hand.find((c) => c.id === cardId);

    if (!player || !card) {
      console.error('Player or card not found for playCard action.');
      return;
    }

    // 1. Calculate the next state after the card is played.
    const nextPlayers = currentState.players.map((p) =>
      p.id === playerId
        ? {
            ...p,
            hand: p.hand.filter((c) => c.id !== cardId),
            discardPile: [...p.discardPile, card],
          }
        : p
    );

    const nextLog = [
      ...currentState.log,
      {
        playerId: player.id,
        playerName: player.name,
        card,
        timestamp: Date.now(),
      },
    ];

    // 2. Build the complete, serializable game state payload.
    const payload: GameState = {
      ...currentState,
      players: nextPlayers,
      log: nextLog,
      mapId: currentState.currentMap?.id || 'plains',
    };
    
    // 3. Persist and broadcast the new state.
    try {
      await supabase.from('games').update({ state: payload }).eq('id', gameId);
      const status = await channel.send({
        type: 'broadcast',
        event: 'game_state_update',
        payload,
      });
      if (status !== 'ok') {
        throw new Error(`Broadcast failed with status: ${status}`);
      }
      console.log('Successfully played card and broadcasted state.');
    } catch (error) {
      console.error('Error playing card:', error);
    }
  },

  drawCard: async (playerId, gameId, channel, characterId) => {
    const currentState = get();
    const player = currentState.players.find((p) => p.id === playerId);
    if (!player) {
      console.error('Player not found for drawCard action.');
      return;
    }

    let { deck, hand, discardPile } = player;
    // If deck is empty, reshuffle discard pile into deck
    if (deck.length === 0 && discardPile.length > 0) {
      deck = shuffle(discardPile);
      discardPile = [];
    }
    if (deck.length === 0) {
      console.log('Cannot draw card - deck is empty and discard pile is empty.');
      return;
    }

    let [drawnCard, ...remainingDeck] = deck;
    // If it's a combat card, set its owner to the selected character
    if (drawnCard.type === 'combat' && characterId) {
      drawnCard = { ...drawnCard, owner: characterId };
    }
    const nextPlayers = currentState.players.map((p) =>
      p.id === playerId
        ? {
            ...p,
            deck: remainingDeck,
            hand: [...p.hand, drawnCard],
            discardPile,
          }
        : p
    );

    const nextLog = [
      ...currentState.log,
      {
        playerId: player.id,
        playerName: player.name,
        message: `${player.name} drew a card.`,
        timestamp: Date.now(),
      },
    ];

    const payload: GameState = {
      ...currentState,
      players: nextPlayers,
      log: nextLog,
      mapId: currentState.currentMap?.id || 'plains',
    };

    try {
      await supabase.from('games').update({ state: payload }).eq('id', gameId);
      const status = await channel.send({
        type: 'broadcast',
        event: 'game_state_update',
        payload,
      });
      if (status !== 'ok') {
        throw new Error(`Broadcast failed with status: ${status}`);
      }
      console.log('Successfully drew card and broadcasted state.');
    } catch (error) {
      console.error('Error drawing card:', error);
    }
  },

  discardCard: async (playerId: string, cardId: number, gameId: string, channel: RealtimeChannel) => {
    const currentState = get();
    const player = currentState.players.find((p) => p.id === playerId);
    const card = player?.hand.find((c) => c.id === cardId);

    if (!player || !card) {
      console.error('Player or card not found for discardCard action.');
      return;
    }

    // Remove card from hand, add to discard pile
    const nextPlayers = currentState.players.map((p) =>
      p.id === playerId
        ? {
            ...p,
            hand: p.hand.filter((c) => c.id !== cardId),
            discardPile: [...p.discardPile, card],
          }
        : p
    );

    let cardLabel = '';
    if ('name' in card && typeof card.name === 'string') {
      cardLabel = card.name;
    } else if ('type' in card && card.type === 'combat') {
      cardLabel = 'Combat Card';
    } else if ('type' in card && card.type === 'special') {
      cardLabel = 'Special Card';
    } else {
      cardLabel = 'a card';
    }
    const nextLog = [
      ...currentState.log,
      {
        playerId: player.id,
        playerName: player.name,
        card,
        message: `${player.name} discarded ${cardLabel}.`,
        timestamp: Date.now(),
      },
    ];

    const payload: GameState = {
      ...currentState,
      players: nextPlayers,
      log: nextLog,
      mapId: currentState.currentMap?.id || 'plains',
    };

    try {
      await supabase.from('games').update({ state: payload }).eq('id', gameId);
      const status = await channel.send({
        type: 'broadcast',
        event: 'game_state_update',
        payload,
      });
      if (status !== 'ok') {
        throw new Error(`Broadcast failed with status: ${status}`);
      }
      console.log('Successfully discarded card and broadcasted state.');
    } catch (error) {
      console.error('Error discarding card:', error);
    }
  },

  clearLog: () => set({ log: [] }),

  setStateFromServer: (newState) => {
    set((current) => {
      console.log('Received new state from server. Merging now.');
      const newMap = newState.mapId ? presetMaps.find(m => m.id === newState.mapId) : current.currentMap;
      
      // A simple, direct merge of the new state.
      return {
        ...current,
        ...newState,
        currentMap: newMap || current.currentMap,
      };
    });
  },

  inspectDeck: async (inspectorId, targetPlayerId, count, gameId, channel) => {
    const currentState = get();
    const inspector = currentState.players.find(p => p.id === inspectorId);
    const targetPlayer = currentState.players.find(p => p.id === targetPlayerId);

    if (!inspector || !targetPlayer) {
      console.error('Player not found for deck inspection');
      return;
    }

    const cardsToInspect = targetPlayer.deck.slice(0, count);

    const logMessage = `${inspector.name} is inspecting the top ${count} cards of ${targetPlayer.name}'s deck.`;
    
    const payload: GameState = {
      ...currentState,
      deckInspection: {
        isOpen: true,
        inspectorId,
        targetPlayerId,
        cards: cardsToInspect,
      },
      log: [
        ...currentState.log,
        {
          playerId: inspectorId,
          playerName: inspector.name,
          message: logMessage,
          timestamp: Date.now(),
        },
      ],
      mapId: currentState.currentMap?.id || 'plains',
    };
    
    try {
      await supabase.from('games').update({ state: payload }).eq('id', gameId);
      const status = await channel.send({
        type: 'broadcast',
        event: 'game_state_update',
        payload,
      });
      if (status !== 'ok') {
        throw new Error(`Broadcast failed with status: ${status}`);
      }
    } catch (error) {
      console.error('Error inspecting deck:', error);
    }
  },

  resolveDeckInspection: async (cardsToTop, cardsToBottom, gameId, channel) => {
    const currentState = get();
    const { deckInspection } = currentState;
    
    if (!deckInspection.isOpen || !deckInspection.targetPlayerId) {
      console.error('No deck inspection in progress to resolve.');
      return;
    }

    const nextPlayers = currentState.players.map(p => {
      if (p.id === deckInspection.targetPlayerId) {
        // Remove the inspected cards from the deck first
        const inspectedIds = new Set(deckInspection.cards.map(c => c.id));
        const remainingDeck = p.deck.filter(c => !inspectedIds.has(c.id));
        
        return {
          ...p,
          deck: [...cardsToTop, ...remainingDeck, ...cardsToBottom],
        };
      }
      return p;
    });

    const payload: GameState = {
      ...currentState,
      players: nextPlayers,
      deckInspection: {
        isOpen: false,
        inspectorId: null,
        targetPlayerId: null,
        cards: [],
      },
      mapId: currentState.currentMap?.id || 'plains',
    };

    try {
      await supabase.from('games').update({ state: payload }).eq('id', gameId);
      const status = await channel.send({
        type: 'broadcast',
        event: 'game_state_update',
        payload,
      });
      if (status !== 'ok') {
        throw new Error(`Broadcast failed with status: ${status}`);
      }
    } catch (error) {
      console.error('Error resolving deck inspection:', error);
    }
  },

  addTokenCharacter: async (token, gameId, channel) => {
    const currentState = get();
    const newToken: Character = {
      ...token,
      id: `token-${Date.now()}-${Math.random()}`, // A simple unique ID for the token
    };

    const payload: GameState = {
      ...currentState,
      characters: [...currentState.characters, newToken],
      mapId: currentState.currentMap?.id || 'plains',
    };

    try {
      await supabase.from('games').update({ state: payload }).eq('id', gameId);
      const status = await channel.send({
        type: 'broadcast',
        event: 'game_state_update',
        payload,
      });
      if (status !== 'ok') {
        throw new Error(`Broadcast failed with status: ${status}`);
      }
    } catch (error) {
      console.error('Error adding token character:', error);
    }
  },

  updateCharacterConditions: async (characterId, conditions, gameId, channel) => {
    const currentState = get();
    const nextCharacters = currentState.characters.map((char) =>
      char.id === characterId
        ? { ...char, conditions }
        : char
    );

    const payload: GameState = {
      ...currentState,
      characters: nextCharacters,
      mapId: currentState.currentMap?.id || 'plains',
    };

    try {
      await supabase.from('games').update({ state: payload }).eq('id', gameId);
      const status = await channel.send({
        type: 'broadcast',
        event: 'game_state_update',
        payload,
      });
      if (status !== 'ok') {
        throw new Error(`Broadcast failed with status: ${status}`);
      }
    } catch (error) {
      console.error('Error updating character conditions:', error);
    }
  },

  rollDice: async (playerId, sides, gameId, channel) => {
    const currentState = get();
    const player = currentState.players.find(p => p.id === playerId);

    if (!player) {
      console.error('Player not found for rollDice action.');
      return;
    }

    // Custom movement die with specific values
    const movementDieValues = [
      'ALL 2',
      'ALL 3', 
      'ALL 4',
      'ONE 3',
      'ONE 4',
      'ONE 5'
    ];

    const roll = Math.floor(Math.random() * movementDieValues.length);
    const result = movementDieValues[roll];

    const logMessage = `${player.name} rolled: ${result}`;
    
    const payload: GameState = {
      ...currentState,
      log: [
        ...currentState.log,
        {
          playerId: player.id,
          playerName: player.name,
          message: logMessage,
          timestamp: Date.now(),
        },
      ],
      mapId: currentState.currentMap?.id || 'plains',
    };
    
    try {
      await supabase.from('games').update({ state: payload }).eq('id', gameId);
      const status = await channel.send({
        type: 'broadcast',
        event: 'game_state_update',
        payload,
      });
      if (status !== 'ok') {
        throw new Error(`Broadcast failed with status: ${status}`);
      }
    } catch (error) {
      console.error('Error rolling dice:', error);
    }
  },

  changeMap: async (mapId, gameId, channel) => {
    const currentState = get();
    const map = presetMaps.find(m => m.id === mapId) || presetMaps[0];

    // Update local state
    set({ currentMap: map, mapId: map.id });

    const payload: GameState = {
      ...currentState,
      mapId: map.id,
    };

    try {
      await supabase.from('games').update({ state: payload }).eq('id', gameId);
      const status = await channel.send({
        type: 'broadcast',
        event: 'game_state_update',
        payload,
      });
      if (status !== 'ok') {
        throw new Error(`Broadcast failed with status: ${status}`);
      }
      console.log('Successfully changed map and broadcasted state.');
    } catch (error) {
      console.error('Error changing map:', error);
    }
  },
})); 