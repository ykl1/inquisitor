import React, { useState } from 'react';
import { useCreateRoom } from '../hooks/useRoom';

const CreateRoom = () => {
  const { createRoom, isLoading, error } = useCreateRoom();
  const [formData, setFormData] = useState({
    playerName: '',
    rounds: 2,
    enableGuessing: true,
  });

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    // TODO: Implement room creation logic with backend
    await createRoom(
      formData.playerName,
      formData.rounds,
      formData.enableGuessing
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Create Room</h2>
          <p className="mt-2 text-gray-600">Set up your game room and invite friends</p>
        </div>
        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">
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
            <label htmlFor="rounds" className="block text-sm font-medium text-gray-700">
              Number of Rounds
            </label>
            <select
              id="rounds"
              value={formData.rounds}
              onChange={(e) => setFormData({ ...formData, rounds: Number(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {[2, 3, 4, 5].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Round' : 'Rounds'}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isLoading ? 'Creating Room...' : 'Create Room'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRoom;