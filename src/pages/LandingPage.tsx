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

        {/* Bio Section */}
        <div className="mt-12 pt-8 border-t border-white/20 text-white/80">
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
            <span className="text-sm">Built with ♥</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;