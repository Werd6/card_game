import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { nanoid } from 'nanoid';

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = 4000;

// In-memory game state (for demo; use a DB for production)
const games = {};

io.on('connection', (socket) => {
  // Create a new game room
  socket.on('createGame', (callback) => {
    const roomCode = nanoid(6).toUpperCase();
    games[roomCode] = { players: {}, publicState: {}, privateState: {}, hostId: socket.id };
    socket.join(roomCode);
    callback(roomCode);
  });

  // Set initial state (host only)
  socket.on('setInitialState', ({ roomCode, initialState }) => {
    if (games[roomCode] && games[roomCode].hostId === socket.id) {
      games[roomCode].publicState = initialState;
      io.to(roomCode).emit('publicState', initialState);
    }
  });

  // Join an existing game room
  socket.on('joinGame', ({ roomCode, playerName }, callback) => {
    if (!games[roomCode]) {
      callback({ error: 'Room not found' });
      return;
    }
    const playerId = nanoid(8);
    games[roomCode].players[playerId] = { name: playerName, socketId: socket.id };
    socket.join(roomCode);
    // Send current publicState to the new player
    socket.emit('publicState', games[roomCode].publicState);
    callback({ playerId, publicState: games[roomCode].publicState, hostId: games[roomCode].hostId });
    // Notify others
    socket.to(roomCode).emit('playerJoined', { playerId, playerName });
  });

  // Example: update public state
  socket.on('updatePublicState', ({ roomCode, newState }) => {
    if (games[roomCode]) {
      games[roomCode].publicState = newState;
      console.log('Emitting publicState to room', roomCode, newState);
      io.to(roomCode).emit('publicState', newState);
    }
  });

  // Example: send private state to a player
  socket.on('updatePrivateState', ({ roomCode, playerId, privateState }) => {
    if (games[roomCode]) {
      games[roomCode].privateState[playerId] = privateState;
      const player = games[roomCode].players[playerId];
      if (player) {
        io.to(player.socketId).emit('privateState', privateState);
      }
    }
  });

  // Become host (first come, first served)
  socket.on('becomeHost', ({ roomCode }, callback) => {
    if (!games[roomCode]) return;
    if (!games[roomCode].hostId) {
      games[roomCode].hostId = socket.id;
      io.to(roomCode).emit('hostId', socket.id);
      if (callback) callback({ success: true, hostId: socket.id });
    } else {
      if (callback) callback({ success: false, hostId: games[roomCode].hostId });
    }
  });

  // Handle disconnects, etc.
});

server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
}); 