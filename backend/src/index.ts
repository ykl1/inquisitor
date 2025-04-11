import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { roomManager } from './roomManager';
import { Player, GameState, Room, Question } from './types';

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
      const room = roomManager.createRoom(playerName, rounds, enableGuessing, socket.id);
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

      const player = roomManager.addPlayer(roomCode, playerName, socket.id);
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

  socket.on('rejoin_room', ({ playerId, playerName, roomCode }) => {
    // Validate room exists
    const room = roomManager.getRoom(roomCode);
    if (!room) {
      socket.emit('error', { message: 'Room no longer exists' });
      return;
    }

    // Check if player was actually in this room before
    const existingPlayer = room.players.find(p => p.id === playerId);
    if (existingPlayer) {
      console.log("exist")
      // Update the socket id for this user
      existingPlayer.socketId = socket.id;
      
      // Join the socket to the room
      socket.join(roomCode);

      // Notify user of successful rejoin
      socket.emit('rejoin_success', { playerName });
      
      // Notify all players in the room of all current players
      const players = room.players
      emitAllPlayers(roomCode, players) 
    } else {
      console.log("player does not exist")
    }
  });

  socket.on('host_start_game', ({ roomCode }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) throw new Error('Room not found');
    room.gameState = "submitting"

    // Retry assignBalancedTargets 3 times if it fails
    let success = false;
    let attempts = 0;
    const maxRetries = 3;
    while (!success && attempts <= maxRetries) {
      try {
        roomManager.assignBalancedTargets(roomCode);
        success = true;
      } catch (error) {
        attempts++;
        if (attempts > maxRetries) {
          console.error(`Failed to assign targets after ${maxRetries} attempts:`, error);
        } else {
          console.log(`Attempt ${attempts} failed, retrying...`);
        }
      }
    }

    io.to(roomCode).emit('submission_state', { room });
  });


  socket.on('submit_questions', ({ player, roomCode, questions }: { player: Player, roomCode: string, questions: Question[] }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) throw new Error('Room not found');

    // Update player to indicate they have submitted questions
    const asker = room.players.find(p => p.id === player.id);
    if (!asker) throw new Error('Asker not found');
    asker.hasSubmittedQuestions = true

    // Increment totalPlayersThatSubmittedQuestions for the given room
    room.totalPlayersThatSubmittedQuestions += 1
  
    // Iterate over the sent questions and add them to the targetPlayers' receivedQuestions field
    questions.forEach(question => {
      console.log(question)
      const player = room.players.find(p => p.id === question.targetPlayerId);
      if (player) {
        console.log(`Found player ${player.id}: ${player.name}`)
        player.receivedQuestions.push(question)
      } else {
        console.log(`No player found for ${question.targetPlayerId}`);
      }
    })

    // Check if totalPlayersThatSubmittedQuestions == total players in room
    // then emit the questions to each player
    if (room.players.length === room.totalPlayersThatSubmittedQuestions) {
      room.gameState = "playing"
      console.log(`All players in room ${room.code} have submitted their questions. Now distributing questions to each player`)
      room.players.forEach(player => {
        // Check if the player has any received questions
        if (player.receivedQuestions.length > 0) {
          // Emit the questions to the specific player using their socket ID
          io.to(player.socketId).emit('received_questions', {
            room: room,
            questions: player.receivedQuestions
          });
        } else {
          console.log(`Player ${player.id} did not receive any questions.`)
        }
      });
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
