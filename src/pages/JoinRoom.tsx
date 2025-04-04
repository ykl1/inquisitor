import React, { useState } from 'react';
import { useJoinRoom } from '../hooks/useRoom';

const JoinRoom = () => {
  const { joinRoom, isLoading, error } = useJoinRoom();
  const [formData, setFormData] = useState({
    playerName: '',
    roomCode: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await joinRoom(formData.playerName, formData.roomCode);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Join Room</h2>
          <p className="mt-2 text-gray-600">Enter the room code to join the game</p>
        </div>

        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-700">
              Your Name
            </label>
            <input
              type="text"
              id="playerName"
              value={formData.playerName}
              onChange={(e) => setFormData({ ...formData, playerName: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700">
              Room Code
            </label>
            <input
              type="text"
              id="roomCode"
              value={formData.roomCode}
              onChange={(e) => setFormData({ ...formData, roomCode: e.target.value.toUpperCase() })}
              placeholder="Enter 6-digit code"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 uppercase"
              maxLength={6}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isLoading ? 'Joining Room...' : 'Join Room'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinRoom;