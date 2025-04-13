import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { roomManager } from './roomManager';
import { Player, Question, Room } from './types';

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

  socket.on('host_start_submission_state', ({ roomCode }) => {
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
    // then notify host that they can start the game
    if (room.players.length === room.totalPlayersThatSubmittedQuestions) {
      console.log(`All players in room ${room.code} have submitted their questions.`)
      
      const host = room.players.find(p => p.id === room.hostId);
      if (!host) throw new Error('Host not found');

      io.to(host.socketId).emit('all_players_have_submitted', {
        all_submitted: true,
      });
    }
  });

  socket.on('host_start_playing_state', ({ roomCode }) => {
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

    /*
    TODO:
      When host clicks start game on the client side, it'll send a socket event to
      server. When server receives this event
        - Sort the order of room.players
            - Do this only this time, so that for each round the ordering is consistent
        - In room, we will need to have a field for currentRound. Initialized to 1
        - In room, we will need to have a field for currentPlayerIdx. Initialized to 0
        - Get the currentPlayer from room.players[currentPlayerIdx]
        - A question amongst currentPlayer.receivedQuestions where isAnswered=false is retrieved
        - We emit this question + currentPlayer to all players in the room, so it can be displayed
        - Send room state as well to update the state to playing.

      After player clicks on answer button on client-side (indicating they answered the question), 
      it'll send a socket event to server. When server receives this event:
        - The current question that player answered will have the isAnswered field updated to true
        - The currentPlayerIdx will increment.
            - The next player will be retrieved from room.players[currentPlayerIdx]
            - A question amongst player.receivedQuestions where isAnswered=false is retrieved
            - We emit this question + currentPlayer to all players in the room, so it can be displayed

        - Once last player in round answers, the currentPlayerIdx will increment and equal rooms.players.length.
          At this point, we will increment currentRound.
          - if currentRound > rounds we finish game + send a finished game event to room players
          - if currentRound <= rounds, we reset the currentPlayerIdx to 0.
            - We follow the same flow of getting the player, their available question, then emit that to the room.
      
      Implement persistence of current answering player and current question being asked.
    */
  });

  socket.on('answered_question', ({ roomCode, question }: { roomCode: string, player: Player, question: Question }) => {
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
      } else {
        room.currentPlayerIdx = 0
      }
    }
    // Get current player and one unanswered question from their received questions
    // Send it to all users
    if (room.currentRound <= room.rounds) {
      emitCurrentPQToAllPlayers(room)
    }
  });

  const emitCurrentPQToAllPlayers = (room: Room) => {
    const currentPlayer = room.players[room.currentPlayerIdx]
    const availableQuestions = currentPlayer.receivedQuestions.filter(q => !q.isAnswered);
    if (availableQuestions.length === 0) {
      // TODO: For this edge case, perhaps skip this player instead?
      throw new Error('Player has no unanswered questions');
    }
    const currentQuestion = availableQuestions[0];
    io.to(room.code).emit('current_player_and_question', { room, currentPlayer, currentQuestion });
  }

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
