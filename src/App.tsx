import React from 'react';
import { AuthProvider, useAuth } from './SpotifyAuthContext';
import SpotifyDashboard from './SpotifyDashboard';

// Login Screen Component
function LoginScreen() {
  const { login } = useAuth();
  const [redirectUri, setRedirectUri] = React.useState('');

  React.useEffect(() => {
    setRedirectUri(window.location.origin + '/api/callback');
  }, []);

  return (
    <div className="flex flex-col h-screen bg-black items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-8 max-w-lg text-center pl-4 pr-4">
        <svg viewBox="0 0 24 24" className="w-24 h-24 text-white" fill="currentColor">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.001 10.62 18.661 12.9c.42.24.6.84.3 1.26zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.54-1.02.72-1.56.3z" />
        </svg>
        <h1 className="text-4xl font-bold text-white tracking-tight">Spotify Clone</h1>
        <button 
          onClick={login}
          className="bg-[#1ed760] text-black font-bold text-lg rounded-full py-4 px-12 hover:scale-105 transition-transform"
        >
          Log in with Spotify
        </button>
        
        <div className="mt-8 p-6 bg-[#121212] rounded-lg border border-[#282828] max-w-md text-left shadow-lg">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-lg">
            <span className="bg-[#1ed760] text-black w-6 h-6 rounded-full inline-flex items-center justify-center text-sm">!</span>
            Action Required
          </h3>
          <p className="text-[#b3b3b3] text-sm mb-4">
            You must add the exact Redirect URI below to your Spotify Developer App settings, otherwise login will fail with an error.
          </p>
          <ol className="text-sm text-[#b3b3b3] list-decimal pl-4 space-y-3">
            <li>Open the <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer" className="text-white underline hover:text-[#1ed760]">Spotify Dashboard</a>.</li>
            <li>Go to your App settings and scroll to <strong>Redirect URIs</strong>.</li>
            <li>Copy & Paste this exact URL:
                <code className="block bg-black p-3 mt-2 rounded border border-[#333] text-[#1ed760] text-xs break-all select-all font-mono">
                  {redirectUri}
                </code>
            </li>
            <li>Click Save, then try logging in again.</li>
          </ol>
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
