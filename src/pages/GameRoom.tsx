import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../utils/socket';
import { Socket } from 'socket.io-client';
import { GameState, Player, Question } from './types';

const GameRoom = () => {
  const { roomCode } = useParams();  
  const [currentSocket, setCurrentSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [players, setPlayers] = useState<Player[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionInput, setQuestionInput] = useState('');
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    // Check for existing session data
    const gameState = localStorage.getItem('gameState')
    const currGameState = gameState ? (gameState as GameState): 'waiting'
    const playerId = localStorage.getItem('playerId')
    const playerName = localStorage.getItem('playerName')
    const roomCode = localStorage.getItem('roomCode')
    const isHost = localStorage.getItem('isHost')
    const storedTargets = localStorage.getItem('assignedTargets');
    // this will be [] before submission game state
    const assignedTargets = storedTargets ? JSON.parse(storedTargets) : [];
    

    if (playerId && playerName && roomCode && isHost) {
      setIsHost(JSON.parse(isHost.toLowerCase()))

      const currPlayer: Player = {
        id: playerId,
        name: playerName,
        isHost: Boolean(isHost),
        hasSubmittedQuestions: false,
        assignedTargets,
        receivedQuestions: []
      };
      setCurrentPlayer(currPlayer)
    } else {
      // TODO: emit event to make this player leave the room
      console.log("couldn't find player data in local storage")
    }

    setGameState(currGameState)
    
    // Connect socket if not already connected
    if (!socket.connected) {
      console.log('Connected with ID:', socket.id);
      socket.connect();
    }

    socket.on('connect', () => {
      console.log('Connected to server');
      
      // If we have session data, attempt to rejoin the room
      if (playerId && playerName && roomCode) {
        socket.emit('rejoin_room', {
          playerId: playerId,
          playerName: playerName,
          roomCode: roomCode
        });
      }
      // set the current socket in state
      setCurrentSocket(socket);

      // Get all current players upon new join
      socket.on('rejoin_success', (playerName) => {
        console.log('Successfully rejoined:', playerName);
      });

      // Cleanup function runs when the GameRoom component unmounts
      return () => {
        socket.disconnect();
      };
    });
  }, []);
  
  // Get all current players upon new join
  socket.on('emit_all_players', (currentPlayersInRoom) => {
    console.log('Received event:', currentPlayersInRoom);
    setPlayers(currentPlayersInRoom.players)
  });

  // Set game state to submission phase 
  socket.on('submission_state', (roomObj: Map<string, GameState>) => {
    console.log('Received start game event:', roomObj);
    setGameState(roomObj["room"].gameState)
    const playerId = localStorage.getItem('playerId')
    console.log(playerId)
    const currPlayer = roomObj["room"].players.find(p => p.id === playerId);
    console.log(currPlayer.assignedTargets)

    // To replace the assignedTargets array
    localStorage.setItem('assignedTargets', JSON.stringify(currPlayer.assignedTargets))

    setCurrentPlayer(prevPlayer => {
      if (!prevPlayer) {
        throw new Error("GameRoom: unable to get currentPlayer")
      }
      return {
        ...prevPlayer,
        assignedTargets: currPlayer.assignedTargets
      };
    });

  });

  // Game setup status
  const hasEnoughPlayers = players.length >= 3;

  const startGame = () => {
    // Additional game start logic
    socket.emit('host_start_game', {
      roomCode: roomCode
    });
  };

  const submitQuestion = () => {
    if (!questionInput.trim()) return;
    
    // Add question to the list
    const newQuestion: Question = {
      id: Math.random().toString(),
      text: questionInput,
      askedById: currentPlayer?.id || '',
      targetPlayerId: '', // Would be set based on assignments
      isAnswered: false
    };
    
    setQuestions([...questions, newQuestion]);
    setQuestionInput('');
    
    // Update player status
    if (currentPlayer) {
      const updatedPlayers = players.map(p =>
        p.id === currentPlayer.id ? { ...p, hasSubmittedQuestions: true } : p
      );
      setPlayers(updatedPlayers);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Room Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Room: {roomCode}</h2>
              <p className="text-gray-600">Current Player: {currentPlayer?.name}</p>
              <p className="text-gray-600">Game State: {gameState}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Players: {players.length}</p>
              {isHost && gameState === 'waiting' && (
                <button
                  onClick={startGame}
                  disabled={!hasEnoughPlayers}
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400"
                >
                  Start Game
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Game Content */}
        {gameState === 'waiting' && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">Waiting for Players</h3>
            <div className="space-y-2">
              {players.map(player => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                >
                  <span>{player.name} {player.isHost && '(Host)'}</span>
                  {/* <span className={player.hasSubmittedQuestions ? 'text-green-600' : 'text-red-600'}>
                    {player.hasSubmittedQuestions ? 'Ready' : 'Not Ready'}
                  </span> */}
                </div>
              ))}
            </div>
          </div>
        )}

        {gameState === 'submitting' && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">Submit Your Questions</h3>
            <div className="space-y-4">
              {currentPlayer?.assignedTargets.map(assignedTarget => (
                <div
                  key={assignedTarget.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                >
                  <span>{assignedTarget.name}</span>
                </div>
              ))}
              <textarea
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                placeholder="Type your question here..."
                className="w-full p-2 border rounded-md"
                rows={3}
              />
              <button
                onClick={submitQuestion}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md"
              >
                Submit Question
              </button>
            </div>
          </div>
        )}

        {gameState === 'playing' && currentQuestion && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">Current Question</h3>
            <div className="mb-4 p-4 bg-gray-50 rounded-md">
              <p className="text-lg">{currentQuestion.text}</p>
              <p className="text-sm text-gray-600 mt-2">
                For: {players.find(p => p.id === currentQuestion.targetPlayerId)?.name}
              </p>
            </div>
            {/* Answer/Guess UI would go here */}
          </div>
        )}

        {gameState === 'finished' && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">Game Finished!</h3>
            {/* Game summary would go here */}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameRoom;
