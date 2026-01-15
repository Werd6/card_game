import { useEffect, useRef, useState, useMemo } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Box, Container, CssBaseline, ThemeProvider, createTheme, Tabs, Tab, Button, FormControl, InputLabel, MenuItem, Select, Typography, IconButton } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import type { SelectChangeEvent } from '@mui/material';
import { GameBoard } from './components/GameBoard';
import { Hand } from './components/Hand';
import { DeckManager } from './components/DeckManager';
import { CharacterStatsPanel } from './components/CharacterStatsPanel';
import { useGameStore } from './store/gameStore';
import { useDeckStore } from './store/deckStore';
import type { Card, Character, CombatCard, Player } from './types/game';
import { presetMaps } from './types/maps';
import { SupaGameLobby } from './components/SupaGameLobby';
import { supabase } from './supabaseClient';
import { DefendModal } from './components/DefendModal';
import { CombatResolutionModal } from './components/CombatResolutionModal';
import { DeckInspectionModal } from './components/DeckInspectionModal';

// Helper function to shuffle an array in place
function shuffle(array: any[]) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex > 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

interface GameInfo {
  gameId: string;
  playerId: string;
  isHost: boolean;
  isSpectator?: boolean;
  roomCode?: string;
}

interface LobbyPlayer {
  id: string;
  name: string;
  selected_deck?: string;
}

function App() {
  const { players, characters, setPlayers, drawInitialHand, shuffleDeck, setMap, setStateFromServer, attackInProgress, resolveAttack, lastAttack, clearLastAttack, deckInspection } = useGameStore();
  const { decks } = useDeckStore();
  const [activeTab, setActiveTab] = useState(0);
  const deckList = useMemo(() => Object.values(decks), [decks]);
  const [selectedDecks, setSelectedDecks] = useState<string[]>([]);
  const [selectedMap, setSelectedMap] = useState<string>('plains');
  const [inGame, setInGame] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [hostId, setHostId] = useState<string | null>(null);
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [lobbyPlayers, setLobbyPlayers] = useState<LobbyPlayer[]>([]);
  const [lobbyReady, setLobbyReady] = useState(false);
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          window.localStorage.setItem('themeMode', newMode);
          return newMode;
        });
      },
    }),
    [],
  );

  useEffect(() => {
    try {
      const savedMode = window.localStorage.getItem('themeMode');
      if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
        setMode(savedMode);
      }
    } catch (error) {
      console.error("Could not read theme mode from local storage", error);
    }
  }, []);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light'
            ? {
                primary: { main: '#1976d2' },
                background: { default: '#f5f5f5', paper: '#ffffff' },
              }
            : {
                primary: { main: '#90caf9' },
                background: { default: '#121212', paper: '#1e1e1e' },
              }),
        },
      }),
    [mode],
  );

  // Fetch initial game state if rejoining
  useEffect(() => {
    if (!gameInfo?.gameId || inGame) return;

    const fetchGameState = async () => {
      const { data: game, error } = await supabase
        .from('games')
        .select('state')
        .eq('id', gameInfo.gameId)
        .single();

      if (error) {
        console.error('Error fetching game state on rejoin:', error);
        return;
      }

      if (game && game.state && typeof game.state === 'object') {
        console.log('Rejoining game, setting state from server:', game.state);
        setStateFromServer(game.state);
        // Check if game has actually started (has players array with data)
        if (game.state.players && Array.isArray(game.state.players) && game.state.players.length > 0) {
          setInGame(true);
        } else if (game.state === 'lobby') {
          // Still in lobby, don't transition
          setInGame(false);
        }
      }
    };

    fetchGameState();
  }, [gameInfo, inGame, setStateFromServer]);

  // Fetch lobby players when game info is set
  useEffect(() => {
    if (!gameInfo?.gameId) return;

    const fetchLobbyPlayers = async () => {
      const { data: players, error } = await supabase
        .from('players')
        .select('id, name, selected_deck')
        .eq('game_id', gameInfo.gameId);

      if (error) {
        console.error('Failed to fetch lobby players:', error);
        return;
      }

      // Transform the data to match our interface
      const transformedPlayers = (players || []).map(p => ({
        id: p.id,
        name: p.name || `Player ${p.id}`,
        selected_deck: p.selected_deck
      }));

      setLobbyPlayers(transformedPlayers);
    };

    fetchLobbyPlayers();
    
    // Set up polling to refresh lobby players every 2 seconds
    const interval = setInterval(fetchLobbyPlayers, 2000);
    
    return () => clearInterval(interval);
  }, [gameInfo?.gameId]);

  // Update selectedDecks when lobby players change
  useEffect(() => {
    setSelectedDecks((prev) => {
      const arr = [...prev];
      while (arr.length < lobbyPlayers.length) arr.push(deckList[0]?.id || '');
      return arr.slice(0, lobbyPlayers.length);
    });
  }, [lobbyPlayers.length, deckList]);

  // Subscribe to game state changes from Supabase
  useEffect(() => {
    if (!gameInfo?.gameId) return;

    const newChannel = supabase.channel('game-room-' + gameInfo.gameId, {
      config: {
        broadcast: {
          self: true, // The host will also receive their own broadcast
        },
      },
    });

      newChannel
      .on('broadcast', { event: 'game_state_update' }, (message) => {
        console.log('Received game state broadcast:', message.payload);
        setStateFromServer(message.payload);
        // Spectators and regular players auto-transition when game state is broadcast (game started)
        // Check if the payload contains actual game state (not just 'lobby')
        if (message.payload?.players && Array.isArray(message.payload.players) && message.payload.players.length > 0) {
          setInGame(true);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to broadcast channel!');
          setChannel(newChannel);
        }
      });

    return () => {
      supabase.removeChannel(newChannel);
      setChannel(null);
    };
  }, [gameInfo?.gameId, setStateFromServer]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleDeckChange = (playerIdx: number, deckId: string) => {
    setSelectedDecks((prev) => {
      const arr = [...prev];
      arr[playerIdx] = deckId;
      return arr;
    });
  };

  const handleMapChange = (event: SelectChangeEvent<string>) => {
    const mapId = event.target.value;
    setSelectedMap(mapId);
    setMap(mapId);
  };

  const handleGameReady = (info: GameInfo) => {
    setGameInfo(info);
    setLobbyReady(true);
  };

  // Host: setup and emit initial state
  const handleBeginGame = async () => {
    if (!gameInfo || isStarting || !channel) {
      console.error("Game info is not available, game is already starting, or channel is not ready.");
      return;
    }
    setIsStarting(true);

    // 1. Fetch players who have joined the lobby
    const { data: fetchedLobbyPlayers, error: playersError } = await supabase
      .from('players')
      .select('id, name, selected_deck')
      .eq('game_id', gameInfo.gameId);

    if (playersError || !fetchedLobbyPlayers) {
      console.error("Failed to fetch players for the game.", playersError);
      setIsStarting(false);
      return;
    }

    // 2. Create the initial players and characters
    const mapId = selectedMap;
    const initialPlayers: Player[] = [];
    const initialCharacters: Character[] = [];
    
    // For each player in the lobby, create a Player object and their characters
    fetchedLobbyPlayers.forEach((lobbyPlayer, playerIndex) => {
      const deckId = lobbyPlayer.selected_deck || deckList[0]?.id;
      const deckData = deckId ? decks[deckId] : undefined;
      
      if (!deckData) {
        console.error(`No deck data found for player ${lobbyPlayer.name} with deck ID ${deckId}`);
        return;
      }

      // Create the Player
      const player: Player = {
        id: lobbyPlayer.id,
        name: lobbyPlayer.name,
        deck: shuffle([...(deckData.cards || []), ...(deckData.cards || [])]),
        hand: [],
        discardPile: [],
      };

      // Draw initial hand
      const handSize = 4;
      for (let i = 0; i < handSize && player.deck.length > 0; i++) {
        const card = player.deck.pop();
        if (card) player.hand.push(card);
      }
      initialPlayers.push(player);

      // Create Characters for this player
      if (deckData.characters) {
        deckData.characters.forEach((deckCharacter) => {
          // Check if this character should have multiple instances (minions)
          const minionCount = deckCharacter.minionCount || 1;
          
          for (let i = 0; i < minionCount; i++) {
            const gameCharacter: Character = {
              id: `${player.id}-${deckCharacter.id}${minionCount > 1 ? `-${i + 1}` : ''}`,
              playerId: player.id,
              name: minionCount > 1 ? `${deckCharacter.name} ${i + 1}` : deckCharacter.name,
              imageUrl: deckCharacter.imageUrl,
              position: { 
                x: 2 + (playerIndex * 1 + i) * 30, // Adjusted for 5x5 grid - reduced spacing
                y: 2 + playerIndex * 30 
              },
              health: deckCharacter.hp,
              maxHealth: deckCharacter.hp,
              size: deckCharacter.size,
              conditions: [],
              ranged: deckCharacter.ranged ?? false,
            };
            initialCharacters.push(gameCharacter);
          }
        });
      }
    });

    // 3. Persist state to DB and then broadcast it to all clients.
    try {
      const initialGameState = {
        players: initialPlayers,
        characters: initialCharacters,
        gridSize: { width: 8, height: 6 }, // Changed from 8x5 to 8x6
        mapId: mapId,
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

      // First, save the state for persistence.
      const { error: updateError } = await supabase
        .from('games')
        .update({ state: initialGameState })
        .eq('id', gameInfo.gameId);
      
      if (updateError) throw updateError;

      // Second, broadcast the state to all connected clients.
      const broadcastStatus = await channel.send({
        type: 'broadcast',
        event: 'game_state_update',
        payload: initialGameState,
      });

      if (broadcastStatus !== 'ok') {
        console.error('Failed to broadcast game state:', broadcastStatus);
        // Optionally throw an error to be caught below
        throw new Error(`Broadcast failed with status: ${broadcastStatus}`);
      }

      console.log('Successfully started game and broadcasted state.');

      // Also set the state for the host
      setStateFromServer(initialGameState);
      setInGame(true);

    } catch (error) {
      console.error('Error starting game:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleDefend = (defendingCard: CombatCard | null) => {
    if (!gameInfo || !channel) return;
    resolveAttack(defendingCard, gameInfo.gameId, channel);
  };

  const showSetup =
    activeTab === 0 &&
    deckList.length > 0 &&
    (players.length === 0 || players.every((p) => p.hand.length === 0));

  if (!lobbyReady) {
    return <SupaGameLobby onGameReady={handleGameReady} />;
  }

  const isHost = gameInfo?.isHost ?? false;

  // Lobby view after joining/creating a game
  if (!inGame) {
    if (!gameInfo) {
      // This should not happen if lobbyReady is true, but it's a good safeguard
      return <div>Loading...</div>;
    }
    const isSpectator = gameInfo?.isSpectator ?? false;
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container>
          <Typography variant="h4">Lobby</Typography>
          <Typography variant="body1">Room Code: {gameInfo?.roomCode}</Typography>
          {isSpectator && (
            <Typography variant="h6" color="primary" sx={{ mt: 2, mb: 2 }}>
              Viewing as spectator - Couch Party Mode
            </Typography>
          )}
          <Typography variant="h6">Players:</Typography>
          <ul>
            {lobbyPlayers.map((p) => (
              <li key={p.id}>{p.name} {p.id === gameInfo?.playerId && "(You)"}</li>
            ))}
          </ul>
          {isHost && (
            <Box>
              <Typography variant="h6">Game Setup</Typography>
              <FormControl fullWidth margin="normal">
                <InputLabel>Select Map</InputLabel>
                <Select value={selectedMap} onChange={handleMapChange}>
                  {presetMaps.map((map) => (
                    <MenuItem key={map.id} value={map.id}>{map.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button 
                variant="contained" 
                onClick={handleBeginGame} 
                disabled={isStarting || !channel}
              >
                {isStarting ? 'Starting...' : 'Begin Game'}
              </Button>
              {!channel && <Typography variant="caption">Connecting to game server...</Typography>}
            </Box>
          )}
          {!isHost && !isSpectator && (
            <Typography>Waiting for the host to start the game...</Typography>
          )}
          {isSpectator && (
            <Typography>Waiting for the host to start the game. You will automatically transition to spectator view.</Typography>
          )}
        </Container>
      </ThemeProvider>
    );
  }

  const activePlayer = players[0];
  const otherPlayer = players[1];

  if (!activePlayer) {
    // This can happen briefly while the game state is being set.
    return <div>Loading game...</div>;
  }

  const defenderCharacter = attackInProgress ? characters.find(c => c.id === attackInProgress.defenderId) : null;
  const attackerCharacter = attackInProgress ? characters.find(c => c.id === attackInProgress.attackerId) : null;
  const isDefending = defenderCharacter?.playerId === gameInfo?.playerId;

  const combatAttacker = lastAttack ? characters.find(p => p.id === lastAttack.attackerId) : null;
  const combatDefender = lastAttack ? characters.find(p => p.id === lastAttack.defenderId) : null;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {deckInspection.isOpen && gameInfo && channel && (
        <DeckInspectionModal
          gameId={gameInfo.gameId}
          channel={channel}
          gameInfo={gameInfo}
        />
      )}
      {attackInProgress && defenderCharacter && attackerCharacter && isDefending && (
        <DefendModal 
          attack={attackInProgress}
          attacker={attackerCharacter}
          defender={players.find(p => p.id === defenderCharacter.playerId)!}
          defenderCharacterId={defenderCharacter.id}
          characters={characters}
          onDefend={handleDefend}
        />
      )}
      {lastAttack && combatAttacker && combatDefender && (
        <CombatResolutionModal
          result={lastAttack}
          attacker={combatAttacker}
          defender={combatDefender}
          characters={characters}
          onClose={clearLastAttack}
        />
      )}
      <Container maxWidth={false}>
        <Box
          sx={{
            minHeight: '100vh',
            py: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {gameInfo?.roomCode && (
              <Typography variant="h6">Room Code: <b>{gameInfo.roomCode}</b></Typography>
            )}
            <IconButton onClick={colorMode.toggleColorMode} color="inherit">
              {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Box>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Game" />
            {isHost && <Tab label="Deck Manager" />}
          </Tabs>

          {activeTab === 0 ? (
            <>
              {showSetup && isHost && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mb: 2 }}>
                  {/* Map selection dropdown */}
                  <FormControl sx={{ minWidth: 220 }}>
                    <InputLabel id="map-select-label">Map</InputLabel>
                    <Select
                      labelId="map-select-label"
                      value={selectedMap}
                      label="Map"
                      onChange={handleMapChange}
                    >
                      {presetMaps.map((map) => (
                        <MenuItem key={map.id} value={map.id}>
                          {map.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  {/* Map description */}
                  {presetMaps.find(m => m.id === selectedMap) && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 400 }}>
                      {presetMaps.find(m => m.id === selectedMap)?.description}
                    </Typography>
                  )}

                  {/* Lobby players info */}
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Typography variant="h6" color="primary">
                      Players in Lobby ({lobbyPlayers.length})
                    </Typography>
                    {lobbyPlayers.map((player, index) => {
                      const selectedDeck = player.selected_deck ? decks[player.selected_deck] : null;
                      return (
                        <Typography key={player.id} variant="body2" color="text.secondary">
                          {index + 1}. {player.name} 
                          {selectedDeck ? ` - ${selectedDeck.name}` : ' - No deck selected'}
                        </Typography>
                      );
                    })}
                  </Box>
                  
                  <Button 
                    variant="contained" 
                    onClick={handleBeginGame} 
                    disabled={
                      deckList.length === 0 || 
                      isStarting || 
                      lobbyPlayers.length === 0 ||
                      lobbyPlayers.some(player => !player.selected_deck)
                    }
                  >
                    {isStarting ? 'Starting...' : 'Begin Game'}
                  </Button>
                </Box>
              )}
              {showSetup && !isHost && !gameInfo?.isSpectator && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="h6">Waiting for host to start the game...</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Make sure all players have selected their decks.
                  </Typography>
                </Box>
              )}
              {gameInfo?.isSpectator && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                    🎮 Couch Party Mode - Spectator View
                  </Typography>
                </Box>
              )}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 3,
                  flex: 1,
                }}
              >
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ flexGrow: 1, overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
                    <GameBoard gameInfo={gameInfo} channel={channel} />
                  </Box>
                  {!gameInfo?.isSpectator && <Hand gameInfo={gameInfo} channel={channel} />}
                </Box>
                <CharacterStatsPanel gameInfo={gameInfo} channel={channel} />
              </Box>
            </>
          ) : (
            isHost && <DeckManager />
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
