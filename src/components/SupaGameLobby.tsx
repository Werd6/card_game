import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { DeckSelection } from './DeckSelection';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Stack,
  Container,
  Divider,
  Alert,
} from '@mui/material';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9' },
    background: { default: '#121212', paper: '#1e1e1e' },
  },
});

interface GameInfo {
  gameId: string;
  playerId: string;
  isHost: boolean;
  roomCode?: string;
}

interface SupaGameLobbyProps {
  onGameReady: (gameInfo: GameInfo) => void;
}

export function SupaGameLobby({ onGameReady }: SupaGameLobbyProps) {
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState('');
  const [showDeckSelection, setShowDeckSelection] = useState(false);
  const [tempGameInfo, setTempGameInfo] = useState<GameInfo | null>(null);

  const handleCreateGame = async () => {
    setError('');
    let gameIdForCleanup: string | null = null;
    let playerIdForCleanup: string | null = null;

    try {
      // Step 1: Create the game record.
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({ state: 'lobby' })
        .select()
        .single();

      if (gameError) throw gameError;
      if (!game) throw new Error('Failed to create game.');
      gameIdForCleanup = game.id;

      // Step 2: Create the player record, now with a valid game_id.
      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({ name: playerName, game_id: game.id })
        .select()
        .single();
      
      if (playerError) throw playerError;
      if (!player) throw new Error('Failed to create player.');
      playerIdForCleanup = player.id;
      
      // Step 3: Update the game with the host player's ID.
      const { error: gameUpdateError } = await supabase
        .from('games')
        .update({ host_id: player.id })
        .eq('id', game.id);
      
      if (gameUpdateError) throw gameUpdateError;

      setPlayerId(player.id);
      setIsHost(true);
      
      const gameInfo = { gameId: game.id, playerId: player.id, isHost: true, roomCode: game.room_code || game.id };
      setTempGameInfo(gameInfo);
      setShowDeckSelection(true);
    } catch (err: any) {
      // If anything fails, try to clean up the created records
      if (playerIdForCleanup) await supabase.from('players').delete().eq('id', playerIdForCleanup);
      if (gameIdForCleanup) await supabase.from('games').delete().eq('id', gameIdForCleanup);
      setError(err.message || 'Failed to create game.');
    }
  };

  const handleJoinGame = async () => {
    setError('');
    try {
      // Step 1: Check if the game exists and what its status is.
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('id, state, host_id, room_code')
        .eq('room_code', roomCode)
        .single();

      if (gameError || !game) {
        throw new Error('Game not found.');
      }

      // Step 2: Check if a player with this name already exists in this game.
      const { data: existingPlayer, error: playerCheckError } = await supabase
        .from('players')
        .select('id, name')
        .eq('game_id', game.id)
        .eq('name', playerName)
        .single();
      
      if (playerCheckError && playerCheckError.code !== 'PGRST116') {
        // PGRST116: "exact-match" error, means 0 rows were found, which is fine.
        // Any other error is a real problem.
        throw playerCheckError;
      }
      
      if (existingPlayer) {
        // Player exists, this is a rejoin attempt.
        console.log('Player found, rejoining game...');
        const gameInfo = { gameId: game.id, playerId: existingPlayer.id, isHost: game.host_id === existingPlayer.id, roomCode: game.room_code };
        onGameReady(gameInfo); // Directly move to game
        return;
      }

      // If we're here, it's a new player joining a lobby.
      if (game.state !== 'lobby') {
        throw new Error('This game has already started and you cannot join as a new player.');
      }

      // Step 3: Create the new player record.
      const { data: newPlayer, error: playerInsertError } = await supabase
        .from('players')
        .insert({ game_id: game.id, name: playerName })
        .select()
        .single();
      
      if (playerInsertError || !newPlayer) throw playerInsertError || new Error('Failed to create new player.');
      
      setPlayerId(newPlayer.id);
      setIsHost(false);
      
      const gameInfo = { gameId: game.id, playerId: newPlayer.id, isHost: false, roomCode: game.room_code };
      setTempGameInfo(gameInfo);
      setShowDeckSelection(true); // Show deck selection for new players
    } catch (err: any) {
      setError(err.message || 'Failed to join game.');
    }
  };

  const handleDeckSelected = async (deckId: string) => {
    if (!tempGameInfo) return;
    try {
      const { error: updateError } = await supabase
        .from('players')
        .update({ selected_deck: deckId })
        .eq('id', tempGameInfo.playerId);
      
      if (updateError) throw updateError;
      onGameReady(tempGameInfo);
    } catch (err: any) {
      setError(err.message || 'Failed to save deck selection.');
    }
  };

  const handleDeckSelectionCancel = () => {
    if (tempGameInfo) {
      supabase.from('players').delete().eq('id', tempGameInfo.playerId).then();
    }
    setShowDeckSelection(false);
    setTempGameInfo(null);
  };

  if (showDeckSelection) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <DeckSelection onDeckSelected={handleDeckSelected} onCancel={handleDeckSelectionCancel} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Container component="main" maxWidth="xs" sx={{ display: 'flex', alignItems: 'center', minHeight: '100vh' }}>
        <Paper elevation={6} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <Typography component="h1" variant="h4" gutterBottom>
            Game Lobby
          </Typography>
          
          {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

          <Stack spacing={2} sx={{ width: '100%', mt: 1 }}>
            <TextField
              required
              fullWidth
              id="playerName"
              label="Your Name"
              name="playerName"
              autoFocus
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
            />
            <Button fullWidth variant="contained" onClick={handleCreateGame} disabled={!playerName} size="large">
              Create Game
            </Button>
            
            <Divider sx={{ my: 2 }}>OR</Divider>
            
            <TextField
              required
              fullWidth
              name="roomCode"
              label="Room Code"
              type="text"
              id="roomCode"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
            />
            <Button fullWidth variant="outlined" onClick={handleJoinGame} disabled={!playerName || !roomCode} size="large">
              Join Game
            </Button>
            <Button
              fullWidth
              variant="outlined"
              href="https://docs.google.com/document/d/1sHcjro0td55FG5cjSgVrwQIDaSR3huxNl2_NuyyCq_0/edit?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              size="large"
            >
              Get prompts
            </Button>
            {roomCode && (
              <Typography sx={{ mt: 2, alignSelf: 'center', color: 'text.secondary' }}>
                Room Code: <b>{roomCode}</b>
              </Typography>
            )}
          </Stack>
        </Paper>
      </Container>
    </ThemeProvider>
  );
} 
