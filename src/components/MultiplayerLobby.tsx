import React, { useState } from 'react';

interface MultiplayerLobbyProps {
  socket: any;
  onJoin?: (playerId: string, roomCode: string, socket: any, hostId?: string) => void;
  onCreate?: (roomCode: string, socket: any) => void;
  onPublicState?: (state: any) => void;
  onPrivateState?: (state: any) => void;
}

export function MultiplayerLobby({ socket, onJoin, onCreate, onPublicState, onPrivateState }: MultiplayerLobbyProps) {
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState<string | null>(null);

  const createGame = () => {
    console.log('Create Game clicked', socket);
    socket?.emit('createGame', (code: string) => {
      setRoomCode(code);
      onCreate && onCreate(code, socket);
    });
  };

  const joinGame = () => {
    socket?.emit('joinGame', { roomCode, playerName }, (res: any) => {
      if (res.error) alert(res.error);
      else {
        setPlayerId(res.playerId);
        onJoin && onJoin(res.playerId, roomCode, socket, res.hostId);
      }
    });
  };

  return (
    <div>
      <h2>Multiplayer Lobby</h2>
      <div>
        <input
          placeholder='Your Name'
          value={playerName}
          onChange={e => setPlayerName(e.target.value)}
        />
      </div>
      <div>
        <button onClick={createGame}>Create Game</button>
        {roomCode && <div>Share this code: <b>{roomCode}</b></div>}
      </div>
      <div>
        <input
          placeholder='Room Code'
          value={roomCode}
          onChange={e => setRoomCode(e.target.value.toUpperCase())}
        />
        <button onClick={joinGame}>Join Game</button>
      </div>
    </div>
  );
} 