import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./SpotifyAuthContext";
import SpotifyDashboard from "./SpotifyDashboard";
import { Eye, EyeOff } from "lucide-react";
import { auth, googleProvider } from "./firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
} from "firebase/auth";

// Firebase Auth Screen Component
function FirebaseAuthScreen({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const calculatePasswordStrength = (pwd: string) => {
    let score = 0;
    if (!pwd) return score;
    if (pwd.length > 6) score += 1;
    if (pwd.length > 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    return Math.min(score, 4);
  };

  const passwordStrength = calculatePasswordStrength(password);
  const strengthLabels = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-400", "bg-green-500"];

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    setError("");
    setMessage("");
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent. Please check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    setMessage("");
    try {
      googleProvider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, googleProvider);
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message || "Google Auth failed");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black items-center justify-center font-sans">
      <div className="bg-[#121212] p-8 sm:p-12 rounded-lg w-full max-w-md shadow-2xl mx-4">
        <div className="flex justify-center mb-8">
          <svg
            viewBox="0 0 24 24"
            className="w-16 h-16 text-white"
            fill="currentColor"
          >
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.001 10.62 18.661 12.9c.42.24.6.84.3 1.26zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.54-1.02.72-1.56.3z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-8 text-center">
          {isLogin ? "Log in to Spotify" : "Sign up for Spotify"}
        </h1>

        {error && (
          <div className="bg-red-500/10 text-red-500 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}
        
        {message && (
          <div className="bg-green-500/10 text-green-500 p-3 rounded mb-4 text-sm">
            {message}
          </div>
        )}

        <button
          onClick={handleGoogleAuth}
          className="w-full bg-transparent border border-[#878787] text-white font-bold text-[15px] rounded-full py-3 mb-6 hover:border-white transition-colors flex items-center justify-center gap-2"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-[#282828] flex-1"></div>
          <span className="text-[#878787] text-sm">or</span>
          <div className="h-px bg-[#282828] flex-1"></div>
        </div>

        <form onSubmit={handleEmailAuth} className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-white">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="bg-[#242424] text-white px-4 py-3 rounded text-[15px] border border-transparent focus:border-white outline-none transition-colors"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-white">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="bg-[#242424] text-white px-4 py-3 rounded text-[15px] border border-transparent focus:border-white outline-none transition-colors w-full pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b3b3b3] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          {!isLogin && password && (
            <div className="mt-1 mb-2">
              <div className="flex gap-1 h-1.5 w-full bg-[#3e3e3e] rounded-full overflow-hidden mb-1.5">
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-full flex-1 transition-all duration-300 ${i <= passwordStrength ? strengthColors[passwordStrength] : 'bg-transparent'}`}
                  ></div>
                ))}
              </div>
              <p className={`text-xs ${strengthColors[passwordStrength].replace('bg-', 'text-')}`}>
                 {strengthLabels[passwordStrength]} password
              </p>
            </div>
          )}

          {isLogin && (
            <button 
              type="button" 
              onClick={handleForgotPassword}
              className="text-white hover:text-[#1ed760] font-bold text-sm text-left hover:underline mb-2 transition-colors self-start"
            >
              Forgot your password?
            </button>
          )}

          <button
            type="submit"
            className="bg-[#1ed760] text-black font-bold text-[15px] rounded-full py-3.5 mt-2 hover:scale-105 transition-transform"
          >
            {isLogin ? "Log In" : "Sign Up"}
          </button>
        </form>

        <div className="text-center text-[#878787] text-[15px]">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-white hover:text-[#1ed760] hover:underline font-bold transition-colors"
          >
            {isLogin ? "Sign up for Spotify" : "Log in here"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Spotify Auth Setup
function SpotifyAuthScreen() {
  const { login } = useAuth();
  return (
    <div className="flex flex-col h-screen bg-black items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-8 max-w-lg text-center pl-4 pr-4">
        <svg
          viewBox="0 0 24 24"
          className="w-24 h-24 text-[#1db954]"
          fill="currentColor"
        >
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.001 10.62 18.661 12.9c.42.24.6.84.3 1.26zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.54-1.02.72-1.56.3z" />
        </svg>
        <h1 className="text-4xl font-bold text-white tracking-tight">
          Connect Spotify
        </h1>
        <p className="text-[#b3b3b3]">
          Connect your Spotify account to access your playlists, artists, and
          liked songs.
        </p>
        <button
          onClick={login}
          className="bg-[#1ed760] text-black font-bold text-lg rounded-full py-3.5 px-10 hover:scale-105 transition-transform mt-2"
        >
          Connect Spotify Account
        </button>
      </div>
    </div>
  );
}

function MainLayout() {
  const { isAuthenticated } = useAuth();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading)
    return (
      <div className="h-screen bg-black flex items-center justify-center text-white">
        Loading...
      </div>
    );
  if (!firebaseUser) return <FirebaseAuthScreen onAuthSuccess={() => {}} />;
  if (!isAuthenticated) return <SpotifyAuthScreen />;

  return <SpotifyDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
