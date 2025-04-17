import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { roomManager } from './roomManager';
import { Player, Question, Room } from './types';

const app = express();
const MAX_PLAYER_LIMIT = 15;
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

      if (room.players.length == MAX_PLAYER_LIMIT) throw new Error(`Cannot join room ${roomCode}. The room reached its max capacity of ${MAX_PLAYER_LIMIT} players`)
      if (room.gameState != "waiting") throw new Error(`Cannot join room ${roomCode}. The room is currently playing a game`)

      const player = roomManager.addPlayer(roomCode, playerName, socket.id);
      socket.join(roomCode);

      console.log(`Room ${roomCode} has sockets:`, 
        Array.from(io.sockets.adapter.rooms.get(roomCode) || []));

      callback({ success: true, room, player });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  socket.on('rejoin_room', ({ playerId, playerName, roomCode }) => {
    try {
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
    } catch (error) {
      emitServerError(roomCode, error.message)
    }
  });

  socket.on('host_start_submission_state', ({ roomCode }) => {
    try {
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
    } catch (error) {
      emitServerError(roomCode, error.message)
    }
  });


  socket.on('submit_questions', ({ player, roomCode, questions }: { player: Player, roomCode: string, questions: Question[] }) => {
    try {
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
      // then notify host that they can start the game
      if (room.players.length === room.totalPlayersThatSubmittedQuestions) {
        console.log(`All players in room ${room.code} have submitted their questions.`)
        
        const host = room.players.find(p => p.id === room.hostId);
        if (!host) throw new Error('Host not found');

        io.to(host.socketId).emit('all_players_have_submitted', {
          all_submitted: true,
        });
      }
    } catch (error) {
      emitServerError(roomCode, error.message)
    }
  });

  socket.on('host_start_playing_state', ({ roomCode }) => {
    try {
      const room = roomManager.getRoom(roomCode);
      if (!room) throw new Error('Room not found');
  
      // Update player to indicate they have submitted questions
      room.gameState = "playing"
  
      // Sort the current room players once prior to selecting the first player + question
      room.players.sort(() => Math.random() - 0.5);
  
      // Initialize the current round and current player index
      room.currentRound = 1;
      room.currentPlayerIdx = 0;
      
      // Get current player and one unanswered question from their received questions:
      emitCurrentPQToAllPlayers(room)
    } catch (error) {
      emitServerError(roomCode, error.message)
    }
  });

  socket.on('answered_question', ({ roomCode, question }) => {
    try {
      const room = roomManager.getRoom(roomCode);
      if (!room) throw new Error('Room not found');
  
      // Set the current asked question of the current player as answered
      const currentPlayer = room.players[room.currentPlayerIdx]
      const currentQuestion = currentPlayer.receivedQuestions.find(q => q.id === question.id);
      if (!currentQuestion) throw new Error('Current Question not found');
      currentQuestion.isAnswered = true
  
      // Select the next player and question to be displayed to all users
      room.currentPlayerIdx += 1;
  
      // Once we reach the last player in the room for given round
      // increment currentRound and compare it with room.rounds
      if (room.currentPlayerIdx === room.players.length) {
        room.currentRound += 1
        if (room.currentRound > room.rounds) {
          console.log("Finish the game here for room: ", room.code)
          // Emit finish game event to all users
          room.gameState = "finished"
          io.to(room.code).emit('finished_game_state', { room });
          cleanUpRoom(room)
        } else {
          room.currentPlayerIdx = 0
        }
      }
      // Get current player and one unanswered question from their received questions
      // Send it to all users
      if (room.currentRound <= room.rounds) {
        emitCurrentPQToAllPlayers(room)
      }
    } catch (error) {
      emitServerError(roomCode, error.message)
    }
  });

  // emit all players to each player in room
  socket.on('get_current_players', ({ roomCode }) => {
    try {
      const room = roomManager.getRoom(roomCode);
      if (!room) throw new Error('Room not found');
      emitAllPlayers(room.code, room.players)
    } catch (error) {
      emitServerError(roomCode, error.message)
    }
  });
  
  const cleanUpRoom = (room: Room) => {
    try {
      console.log(`Start cleaning up room: ${room.code}`)
      roomManager.deleteRoom(room.code)
      console.log(`Cleaned Up Room: ${room.code}`)
    } catch (error) {
      emitServerError(room.code, error.message)
    }
  }

  const emitCurrentPQToAllPlayers = (room: Room) => {
    const currentPlayer = room.players[room.currentPlayerIdx]
    const currentPlayerName = currentPlayer.name
    const currentPlayerId = currentPlayer.id

    const availableQuestions = currentPlayer.receivedQuestions.filter(q => !q.isAnswered);
    if (availableQuestions.length === 0) {
      // TODO: For this edge case, perhaps skip this player instead?
      throw new Error('Player has no unanswered questions');
    }
    const currentQuestion = availableQuestions[0];
    const currentQuestionText = currentQuestion.text
    const currentQuestionId = currentQuestion.id
    io.to(room.code).emit('current_player_and_question', { room, 
                                                           currentPlayerId,
                                                           currentPlayerName,
                                                           currentQuestionId, 
                                                           currentQuestionText });
  }

  const emitAllPlayers = (roomCode: string, players: Player[]) => {
    io.to(roomCode).emit('emit_all_players', { players });
  }

  const emitServerError = (roomCode: string, error: string) => {
    // Get room and update its state if it exists
    const room = roomManager.getRoom(roomCode);
    if (room) {
      room.gameState = "error";
    }
    // Emit both the game state and the error message to all clients in the room
    io.to(roomCode).emit('server_error', {
      gameState: "error",
      errorMessage: error 
    });
  }

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
