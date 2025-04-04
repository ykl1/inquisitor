import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { roomManager } from './roomManager';
import { Player } from './types';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // Your Vite dev server
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('create_room', ({ playerName, rounds, enableGuessing }, callback) => {
    try {
      const room = roomManager.createRoom(playerName, rounds, enableGuessing);
      socket.join(room.code);
      callback({ success: true, room });

      // Notify all players in the room of all current players
      const players = room.players
      emitAllPlayers(room.code, players)
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  socket.on('join_room', ({ roomCode, playerName }, callback) => {
    try {
      const room = roomManager.getRoom(roomCode);
      if (!room) throw new Error('Room not found');

      const player = roomManager.addPlayer(roomCode, playerName);
      socket.join(roomCode);

      console.log(`Room ${roomCode} has sockets:`, 
        Array.from(io.sockets.adapter.rooms.get(roomCode) || []));

      callback({ success: true, room, player });

      // Notify all players in the room of all current players
      const players = room.players
      emitAllPlayers(roomCode, players)      
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  const emitAllPlayers = (roomCode: string, players: Player[]) => {
    io.to(roomCode).emit('emit_all_players', { players });
  }

  socket.on('leave_room', ({ roomCode, playerId }) => {
    roomManager.removePlayer(roomCode, playerId);
    socket.leave(roomCode);
    io.to(roomCode).emit('player_left', { playerId });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
