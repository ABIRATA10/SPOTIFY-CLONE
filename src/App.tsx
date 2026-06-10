import React from 'react';
import { AuthProvider, useAuth } from './SpotifyAuthContext';
import SpotifyDashboard from './SpotifyDashboard';

// Login Screen Component
function LoginScreen() {
  const { login } = useAuth();

  return (
    <div className="flex flex-col h-screen bg-black items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-8 max-w-lg text-center pl-4 pr-4">
        <svg viewBox="0 0 24 24" className="w-24 h-24 text-white" fill="currentColor">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.001 10.62 18.661 12.9c.42.24.6.84.3 1.26zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.54-1.02.72-1.56.3z" />
        </svg>
        <h1 className="text-4xl font-bold text-white tracking-tight">Spotify Clone</h1>
        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <button 
            onClick={login}
            className="bg-[#1ed760] text-black font-bold text-lg rounded-full py-3.5 px-10 hover:scale-105 transition-transform"
          >
            Log in with Spotify
          </button>
          <button 
            onClick={login}
            className="bg-transparent border-2 border-[#878787] text-white font-bold text-lg rounded-full py-3.5 px-10 hover:border-white hover:scale-105 transition-all"
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}

function MainLayout() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <LoginScreen />;
  return <SpotifyDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
