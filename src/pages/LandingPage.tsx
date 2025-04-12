import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-5xl font-bold text-white mb-8">Inquisitor</h1>
        <p className="text-xl text-white mb-12">
          The ultimate party game of anonymous questions and daring answers
        </p>

        <div className="space-y-4">
          <Link
            to="/create"
            className="w-full inline-flex justify-center py-3 px-4 border border-transparent shadow-sm text-lg font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create New Room
          </Link>
          
          <Link
            to="/join"
            className="w-full inline-flex justify-center py-3 px-4 border-2 border-white shadow-sm text-lg font-medium rounded-md text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
          >
            Join Room
          </Link>
        </div>

        <div className="mt-12 text-white/80">
          <h2 className="text-xl font-semibold mb-4">How to Play</h2>
          <ul className="text-left space-y-2">
            <li className="flex items-start">
              <span className="mr-2">1.</span>
              <span>Create a room or join with a room code</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">2.</span>
              <span>Submit anonymous questions to other players</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">3.</span>
              <span>Take turns answering questions</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">4.</span>
              <span>Have fun and get to know your friends better!</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;