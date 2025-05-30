import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-5xl font-bold text-white mb-8 flex items-center justify-center">
          <span>Inquisitor</span>
          <span className="text-sm align-top ml-2">(beta)</span>
        </h1>
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
          <h2 className="text-xl font-semibold mb-4">How To Play</h2>
          <ul className="text-left space-y-2">
            <li className="flex items-start">
              <span className="mr-2">1.</span>
              <span>Create a room or join one using a code (3–25 players)</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">2.</span>
              <span>The host sets the number of rounds—you’ll be randomly assigned that many players to send a question to</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">3.</span>
              <span>Write your question to each assigned player (they won’t know it’s from you)</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">4.</span>
              <span>Once everyone submits their questions, the host starts the game</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">4.</span>
              <span>Take turns answering the anonymous questions sent to you</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">5.</span>
              <span>The game ends once all questions have been answered</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2"></span>
              <span>🎉 Get real, laugh hard, and uncover fun truths with your friends</span>
            </li>
          </ul>
        </div>
        {/* Bio Section */}
        <div className="mt-12 pt-8 border-t border-white/20 text-white/80">
          <div className="flex items-center justify-center space-x-4">
            <a
              href="https://www.instagram.com/youngkwangleee/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-white hover:text-white/90 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 mr-2"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span>ig</span>
            </a>
            <a
              href="https://www.linkedin.com/in/youngkwanglee/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-white hover:text-white/90 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 mr-2"
              >
                <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 21h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"></path>
              </svg>
              <span>linkedIn</span>
            </a>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLScZ0cSxMSAYNhJxcw757hBjZqvR38eNb3pSI1XQkwHX3DWwmQ/viewform?usp=header"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-white hover:text-white/90 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 mr-2"
              >
                <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"></path>
              </svg>
              <span>give feedback</span>
            </a>
          </div>
          <div className="mt-2">
            <span className="text-md">Built with ♥</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;