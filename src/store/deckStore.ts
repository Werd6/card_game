import { create } from 'zustand';
import type { Card, CombatCard, SpecialCard } from '../types/game';
import type { DeckConfig, DeckCollection, DeckLoadResult } from '../types/deck';

interface DeckStore {
  decks: DeckCollection;
  activeDeckId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadDeck: (deckConfig: DeckConfig) => Promise<DeckLoadResult>;
  loadDeckFromFile: (file: File) => Promise<DeckLoadResult>;
  setActiveDeck: (deckId: string | null) => void;
  removeDeck: (deckId: string) => void;
  clearDecks: () => void;
}

const isCombatCard = (card: Card): card is CombatCard => card.type === 'combat';
const isSpecialCard = (card: Card): card is SpecialCard => card.type === 'special';

interface CardArtAssets {
  cardArt: string;
  thumbnail?: string;
}

const validateCard = (card: Card): boolean => {
  // Validate base properties
  if (!card.id || typeof card.id !== 'number' || card.id < 1 || card.id > 30) {
    return false;
  }

  // Validate type-specific properties
  if (isCombatCard(card)) {
    return (
      typeof card.attack === 'number' &&
      card.attack >= 0 &&
      typeof card.defense === 'number' &&
      card.defense >= 0
    );
  } else if (isSpecialCard(card)) {
    return (
      typeof card.name === 'string' &&
      card.name.length > 0 &&
      typeof card.rulesText === 'string' &&
      card.rulesText.length > 0
    );
  }

  return false;
};

const validateDeckConfig = (config: DeckConfig): boolean => {
  // Check required fields
  if (!config.id || !config.name || !config.author || !config.version) {
    return false;
  }

  // Validate cards array
  if (!Array.isArray(config.cards) || config.cards.length !== 30) {
    return false;
  }

  // Check for duplicate card IDs
  const cardIds = new Set(config.cards.map(card => card.id));
  if (cardIds.size !== config.cards.length) {
    return false;
  }

  // Validate each card
  return config.cards.every(card => validateCard(card));
};

// Auto-import all deck JSON files from the characters folder
const deckModules = import.meta.glob('../../characters/*.json', { eager: true });

const allDecks = Object.values(deckModules)
  .map((mod: any) => mod.default || mod)
  .filter(Boolean);

const initialDecks: DeckCollection = allDecks.reduce((acc, deck) => {
  if (deck && deck.id) acc[deck.id] = deck;
  return acc;
}, {} as DeckCollection);

export const useDeckStore = create<DeckStore>((set, get) => ({
  decks: initialDecks,
  activeDeckId: null,
  isLoading: false,
  error: null,

  loadDeck: async (deckConfig: DeckConfig) => {
    try {
      set({ isLoading: true, error: null });
      
      const validatedDeck = validateDeckConfig(deckConfig);
      if (!validatedDeck) {
        throw new Error('Invalid deck configuration');
      }

      // Load and validate art assets if present
      if (deckConfig.artAssets) {
        for (const [cardId, assets] of Object.entries(deckConfig.artAssets)) {
          // Convert cardId to number for comparison since card.id is now a number
          const numericCardId = parseInt(cardId, 10);
          if (isNaN(numericCardId)) {
            throw new Error(`Invalid card ID in art assets: ${cardId}`);
          }
          // Verify the card exists
          if (!deckConfig.cards.find(card => card.id === numericCardId)) {
            throw new Error(`Art asset found for non-existent card: ${cardId}`);
          }
          
          // Verify the art URL is valid
          if (assets.cardArt) {
            try {
              // If it's a URL, verify it's accessible
              if (assets.cardArt.startsWith('http')) {
                const response = await fetch(assets.cardArt, { method: 'HEAD' });
                if (!response.ok) {
                  throw new Error(`Failed to load art for card ${cardId}`);
                }
              }
              // If it's base64, verify it's valid
              else if (assets.cardArt.startsWith('data:image')) {
                // Basic validation of base64 image data
                if (!assets.cardArt.match(/^data:image\/[a-zA-Z]+;base64,/)) {
                  throw new Error(`Invalid base64 image data for card ${cardId}`);
                }
              }
            } catch (error) {
              throw new Error(`Failed to validate art for card ${cardId}: ${error}`);
            }
          }
        }
      }

      set((state) => ({
        decks: {
          ...state.decks,
          [deckConfig.id]: deckConfig,
        },
        isLoading: false,
      }));

      return { success: true, deck: deckConfig };
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : 'Unknown error' });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  loadDeckFromFile: async (file: File) => {
    try {
      set({ isLoading: true, error: null });

      const text = await file.text();
      const config = JSON.parse(text);
      
      return await get().loadDeck(config);
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : 'Failed to load deck file' });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to load deck file' 
      };
    }
  },

  setActiveDeck: (deckId) => {
    if (deckId && !get().decks[deckId]) {
      set({ error: 'Deck not found' });
      return;
    }
    set({ activeDeckId: deckId, error: null });
  },

  removeDeck: (deckId) => {
    set((state) => {
      const { [deckId]: removed, ...remainingDecks } = state.decks;
      return {
        decks: remainingDecks,
        activeDeckId: state.activeDeckId === deckId ? null : state.activeDeckId,
      };
    });
  },

  clearDecks: () => {
    set({ decks: {}, activeDeckId: null, error: null });
  },
})); 