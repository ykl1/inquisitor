// src/hooks/useRoom.ts
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../utils/socket';

export const useCreateRoom = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRoom = async (playerName: string, rounds: number, enableGuessing: boolean) => {
    setIsLoading(true);
    setError(null);

    // Connect socket if not already connected
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('create_room', 
      { playerName, rounds, enableGuessing }, 
      (response: { success: boolean; room?: any; error?: string }) => {
        setIsLoading(false);
        if (response.success && response.room) {
          localStorage.setItem('playerId', response.room.hostId);
          localStorage.setItem('playerName', playerName);
          localStorage.setItem('roomCode', response.room.code);
          localStorage.setItem('gameState', response.room.gameState);
          localStorage.setItem('isHost', response.room.players[0].isHost);
          localStorage.setItem('hasSubmittedQuestions', "false");
          localStorage.setItem('currentAnsweringPlayerId', "");
          localStorage.setItem('currentAnsweringPlayerName', "");
          localStorage.setItem('currentQuestionBeingAnsweredId', "");
          localStorage.setItem('currentQuestionBeingAnsweredName', "");
          localStorage.setItem('numberOfRounds', response.room.rounds.toString());
          // Field only applies to host
          localStorage.setItem('all_submitted', "false");
          
          navigate(`/room/${response.room.code}`);
        } else {
          setError(response.error || 'Failed to create room');
        }
      }
    );
  };

  return { createRoom, isLoading, error };
};

export const useJoinRoom = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinRoom = async (playerName: string, roomCode: string) => {
    setIsLoading(true);
    setError(null);

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('join_room', 
      { roomCode, playerName }, 
      (response: { success: boolean; room?: any; player?: any; error?: string }) => {
        setIsLoading(false);
        if (response.success && response.room && response.player) {
          localStorage.setItem('playerId', response.player.id);
          localStorage.setItem('playerName', playerName);
          localStorage.setItem('roomCode', roomCode);
          localStorage.setItem('gameState', response.room.gameState);
          localStorage.setItem('isHost', response.player.isHost);
          localStorage.setItem('hasSubmittedQuestions', "false");
          localStorage.setItem('currentAnsweringPlayerId', "");
          localStorage.setItem('currentAnsweringPlayerName', "");
          localStorage.setItem('currentQuestionBeingAnsweredId', "");
          localStorage.setItem('currentQuestionBeingAnsweredName', "");
          localStorage.setItem('numberOfRounds', response.room.rounds.toString());
          
          navigate(`/room/${roomCode}`);
        } else {
          setError(response.error || 'Failed to join room');
        }
      }
    );
  };

  return { joinRoom, isLoading, error };
};
