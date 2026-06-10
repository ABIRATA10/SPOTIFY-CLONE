import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  accessToken: string | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('spotify_access_token'));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('spotify_refresh_token'));
  const [expiresAt, setExpiresAt] = useState<number | null>(
    localStorage.getItem('spotify_expires_at') ? Number(localStorage.getItem('spotify_expires_at')) : null
  );

  useEffect(() => {
    // Listen for messages from the OAuth popup
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SPOTIFY_AUTH_SUCCESS') {
        const { access_token, refresh_token, expires_in } = event.data;
        const expires_at = Date.now() + expires_in * 1000;
        
        setAccessToken(access_token);
        setRefreshToken(refresh_token);
        setExpiresAt(expires_at);

        localStorage.setItem('spotify_access_token', access_token);
        if (refresh_token) {
          localStorage.setItem('spotify_refresh_token', refresh_token);
        }
        localStorage.setItem('spotify_expires_at', expires_at.toString());
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Token refresh logic
  useEffect(() => {
    if (!refreshToken || !expiresAt) return;

    const checkToken = async () => {
      const isExpired = Date.now() > expiresAt - 60000; // Refresh 1 minute early
      if (isExpired) {
        try {
          const res = await fetch('/api/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
          });
          const data = await res.json();
          if (data.access_token) {
            setAccessToken(data.access_token);
            localStorage.setItem('spotify_access_token', data.access_token);
            if (data.refresh_token) {
              setRefreshToken(data.refresh_token);
              localStorage.setItem('spotify_refresh_token', data.refresh_token);
            }
            const newExpiresAt = Date.now() + data.expires_in * 1000;
            setExpiresAt(newExpiresAt);
            localStorage.setItem('spotify_expires_at', newExpiresAt.toString());
          }
        } catch (error) {
          console.warn("Failed to refresh token", error);
          logout();
        }
      }
    };

    const interval = setInterval(checkToken, 60000); // check every minute
    checkToken(); // check immediately on mount

    return () => clearInterval(interval);
  }, [refreshToken, expiresAt]);

  const login = async () => {
    try {
      const redirectUri = window.location.origin + '/api/callback';
      const res = await fetch(`/api/auth/url?redirect_uri=${encodeURIComponent(redirectUri)}`);
      const { url } = await res.json();
      window.open(url, 'spotify_oauth', 'width=600,height=700');
    } catch (e) {
      console.warn("Failed to login", e);
    }
  };

  const logout = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setExpiresAt(null);
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_expires_at');
  };

  return (
    <AuthContext.Provider value={{ accessToken, isAuthenticated: !!accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
