import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../utils/socket';
import { Socket } from 'socket.io-client';
import { CurrentAnsweringPlayer, CurrentQuestionBeingAnswered, GameState, Player, Question } from './types';
import { useNavigate } from 'react-router-dom';

const GameRoom = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const handleHomeClick = () => {
    navigate("/");
  };
  const [currentSocket, setCurrentSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [players, setPlayers] = useState<Player[]>([]);
  // key = userId, value = question being sent to userId
  const [questionsMap, setQuestionsMap] = useState<Record<string, string>>({});
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [currentAnsweringPlayer, setCurrentAnsweringPlayer] = useState<CurrentAnsweringPlayer | null>(null);
  const [currentQuestionBeingAnswered, setCurrentQuestionBeingAnswered] = useState<CurrentQuestionBeingAnswered | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [hasEveryoneSubmitted, setHasEveryoneSubmitted] = useState(false);
  // Minimum number of players in room is 3
  const hasEnoughPlayers = players.length >= 3;

  useEffect(() => {
    // Check for existing session data
    const gameState = localStorage.getItem('gameState')
    const currGameState = gameState ? (gameState as GameState): 'waiting'
    const playerId = localStorage.getItem('playerId')
    const playerName = localStorage.getItem('playerName')
    const roomCode = localStorage.getItem('roomCode')
    const isHost = localStorage.getItem('isHost')
    const storedTargets = localStorage.getItem('assignedTargets');
    const getHasSubmittedQuestions = localStorage.getItem('hasSubmittedQuestions')
    const hasSubmittedQuestions = toBoolean(getHasSubmittedQuestions)
    const allSubmitted = localStorage.getItem('all_submitted')
    // this will be [] before submission game state
    const assignedTargets = storedTargets ? JSON.parse(storedTargets) : [];
    const currAnsweringPlayerId = localStorage.getItem('currentAnsweringPlayerId');
    const currAnsweringPlayerName = localStorage.getItem('currentAnsweringPlayerName');
    const currQuestionBeingAnsweredId = localStorage.getItem('currentQuestionBeingAnsweredId');
    const currQuestionBeingAnsweredName = localStorage.getItem('currentQuestionBeingAnsweredName');
    
    if (playerId && playerName && roomCode && isHost) {
      setIsHost(JSON.parse(isHost.toLowerCase()))

      const currPlayer: Player = {
        id: playerId,
        name: playerName,
        isHost: Boolean(isHost),
        hasSubmittedQuestions,
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

    // In case host refreshes when all players have submitted. So they can click on start playing button.
    if (gameState === "submitting" && allSubmitted) {
      setHasEveryoneSubmitted(toBoolean(allSubmitted))
    }
    // In case player refreshes page during playing state, the current question being answered
    // and current player answering the question persists in display.
    if (gameState === "playing" && 
        currAnsweringPlayerId && 
        currAnsweringPlayerName && 
        currQuestionBeingAnsweredId && 
        currQuestionBeingAnsweredName) {
      const currentAnsweringPlayer: CurrentAnsweringPlayer = {
        id: currAnsweringPlayerId,
        name: currAnsweringPlayerName
      };
      setCurrentAnsweringPlayer(currentAnsweringPlayer)

      const currentQuestionBeingAnswered: CurrentQuestionBeingAnswered = {
        id: currQuestionBeingAnsweredId,
        text: currQuestionBeingAnsweredName,
      };
      setCurrentQuestionBeingAnswered(currentQuestionBeingAnswered)
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
    console.log('Received submission game event:', roomObj);
    // Update gameState in useState and local storage to 'submitting'
    setGameState(roomObj["room"].gameState)
    localStorage.setItem('gameState', roomObj["room"].gameState);
    
    // Get the currentPlayer's assignedTargets and update 
    // local storage and currentPlayer useState
    const playerId = localStorage.getItem('playerId')
    const currPlayer = roomObj["room"].players.find(p => p.id === playerId);
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

  socket.on('current_player_and_question', (returnObj) => {
    console.log("current_player_and_question: ", returnObj)
    setGameState(returnObj["room"].gameState)
    localStorage.setItem('gameState', returnObj["room"].gameState);

    console.log('Current player:', returnObj["currentPlayerId"], returnObj["currentPlayerName"]);
    const currentAnsweringPlayer: CurrentAnsweringPlayer = {
      id: returnObj["currentPlayerId"],
      name: returnObj["currentPlayerName"],
    };
    setCurrentAnsweringPlayer(currentAnsweringPlayer)
    localStorage.setItem('currentAnsweringPlayerId', returnObj["currentPlayerId"]);
    localStorage.setItem('currentAnsweringPlayerName', returnObj["currentPlayerName"]);

    console.log('Current question:', returnObj["currentQuestionId"], returnObj["currentQuestionText"]);
    const currentQuestionBeingAnswered: CurrentQuestionBeingAnswered = {
      id: returnObj["currentQuestionId"],
      text: returnObj["currentQuestionText"],
    };
    setCurrentQuestionBeingAnswered(currentQuestionBeingAnswered)
    localStorage.setItem('currentQuestionBeingAnsweredId', returnObj["currentQuestionId"]);
    localStorage.setItem('currentQuestionBeingAnsweredName', returnObj["currentQuestionText"]);
  });

  // Once all players have submitted questions, server will send event to host
  // notifying all players have submitted questions
  socket.on('all_players_have_submitted', (returnObj) => {
    console.log(returnObj["all_submitted"])
    setHasEveryoneSubmitted(returnObj["all_submitted"])
    localStorage.setItem('all_submitted', returnObj["all_submitted"].toString());
  });

  // Set Game State to finished
  socket.on('finished_game_state', (returnObj) => {
    console.log(returnObj["room"])
    setGameState(returnObj["room"].gameState)
    localStorage.setItem('gameState', returnObj["room"].gameState);
  });

  const startSubmissionState = () => {
    socket.emit('host_start_submission_state', {
      roomCode: roomCode
    });
  };

  const startPlayingState = () => {
    socket.emit('host_start_playing_state', {
      roomCode: roomCode
    });
  };

  const toBoolean = (value: string | null) => {
    if (value) {
      return value.toLowerCase() === "true";
    } else {
      return false
    }
  }

  // Send questions to the backend server. 
  const submitQuestions = (questionsMap) => {
    console.log("Sending questions to server: ", questionsMap)
    // update currentPlayer to have hasSubmittedQuestions field set to true
    setCurrentPlayer(prevPlayer => {
      if (!prevPlayer) {
        throw new Error("GameRoom: unable to get currentPlayer")
      }
      return {
        ...prevPlayer,
        hasSubmittedQuestions: true
      };
    });
    // store hasSubmittedQuestions variable in localStorage as true
    localStorage.setItem('hasSubmittedQuestions', 'true')
    // Convert questionsMap to Questions array
    const questions: Question[] = Object.entries(questionsMap).map(([targetPlayerId, questionText]) => ({
      id: Math.random().toString(),
      text: questionText as string,
      askedById: currentPlayer?.id || '',
      targetPlayerId: targetPlayerId,
      isAnswered: false
    }));
    socket.emit('submit_questions', {
      player: currentPlayer,
      roomCode: roomCode,
      questions: questions
    });
  };

  // Send questions to the backend server. 
  const answeredQuestion = () => {
    console.log("Notifying server current player has answered their question")
    socket.emit('answered_question', {
      roomCode: roomCode,
      question: currentQuestionBeingAnswered
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Room Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Room: {roomCode}</h2>
              <p className="text-gray-600">Player: {currentPlayer?.name}</p>
              <p className="text-gray-600">Game State: {gameState}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Players: {players.length}</p>
              {isHost && gameState === 'waiting' && (
                <button
                  onClick={startSubmissionState}
                  disabled={!hasEnoughPlayers}
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400"
                >
                  Start Submitting Questions~
                </button>
              )}
              {isHost && gameState === 'submitting' && (
                <button
                  onClick={startPlayingState}
                  disabled={!hasEveryoneSubmitted}
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400"
                >
                  Start Playing~
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
                </div>
              ))}
            </div>
          </div>
        )}

        {gameState === 'submitting' && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">Submit Your Questions</h3>
            <div className="space-y-4">
              {currentPlayer?.assignedTargets.map(assignedTarget => {
                const questionText = questionsMap[assignedTarget.id] || '';
                const isValid = questionText.trim().length >= 3;
                return (
                  <div
                    key={assignedTarget.id}
                    className="flex flex-col p-3 bg-gray-50 rounded-md gap-2"
                  >
                    <span className="font-medium">{assignedTarget.name}</span>
                    <textarea
                      value={questionText}
                      onChange={(e) => setQuestionsMap(prev => ({
                        ...prev,
                        [assignedTarget.id]: e.target.value
                      }))}
                      placeholder="Type your question here (minimum 3 characters)..."
                      className={`w-full p-2 border rounded-md ${
                        currentPlayer.hasSubmittedQuestions 
                          ? 'bg-gray-100 text-gray-500' 
                          : !isValid && questionText.length > 0 
                            ? 'border-red-500' 
                            : ''
                      }`}
                      rows={3}
                      disabled={currentPlayer.hasSubmittedQuestions}
                    />
                    {!isValid && questionText.length > 0 && (
                      <p className="text-red-500 text-sm mt-1">
                        Please enter at least 3 characters
                      </p>
                    )}
                  </div>
                );
              })}
              <button
                onClick={() => submitQuestions(questionsMap)}
                className={`px-4 py-2 text-white rounded-md transition-colors ${
                  currentPlayer?.hasSubmittedQuestions || !currentPlayer?.assignedTargets.every(target => {
                    const text = questionsMap[target.id] || '';
                    return text.trim().length >= 3;
                  })
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
                disabled={currentPlayer?.hasSubmittedQuestions || !currentPlayer?.assignedTargets.every(target => {
                  const text = questionsMap[target.id] || '';
                  return text.trim().length >= 3;
                })}
              >
                {currentPlayer?.hasSubmittedQuestions
                  ? 'Questions Submitted'
                  : 'Submit Questions'}
              </button>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            {currentAnsweringPlayer != null && (
              <h3 className="text-xl font-semibold mb-4">Someone in this room asked {currentAnsweringPlayer.name},</h3>
            )}
            {/* Display Current Selected Player and their current question here */}
            {currentQuestionBeingAnswered != null && (
              <div key={currentQuestionBeingAnswered.id} className="text-xl font-semibold mb-4">
                {currentQuestionBeingAnswered.text}
              </div>
            )}
            {currentPlayer?.id == currentAnsweringPlayer?.id && (
              <button
                onClick={answeredQuestion}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400"
              >
                Click Once Answered
              </button>
            )}
          </div>
        )}

        {gameState === 'finished' && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">Game Over</h3>
              <button
                onClick={handleHomeClick}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400"
              >
                Home
              </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameRoom;
