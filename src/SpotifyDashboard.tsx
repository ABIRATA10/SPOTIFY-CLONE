import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Heart, Search, Home, Library, Volume2, Plus, ArrowLeft, ArrowRight, UserCircle2, Repeat, Shuffle, ListMusic, LogOut } from 'lucide-react';
import { useAuth } from './SpotifyAuthContext';

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  audioUrl: string;
  coverUrl: string;
  duration?: string;
  uri?: string;
}

interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
  owner: { display_name: string };
  tracks: { total: number };
}

function formatTime(seconds: number) {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function SpotifyDashboard() {
  const { accessToken, logout } = useAuth();
  
  // Real layout data
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  // Mock functional tracks (with real audio URLs from backend)
  const [tracks, setTracks] = useState<Track[]>([]);
  
  // Player State
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isProgressHovered, setIsProgressHovered] = useState(false);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stateRef = useRef({ currentTrackIndex, isPlaying, tracks });
  
  useEffect(() => {
    stateRef.current = { currentTrackIndex, isPlaying, tracks };
  }, [currentTrackIndex, isPlaying, tracks]);

  // Fetch Live Data & Mock Audio Data
  useEffect(() => {
    // 1. Fetch Mock Tracks for functional player
    fetch('/api/mock-tracks')
      .then(res => res.json())
      .then(data => setTracks(data))
      .catch(e => console.error("Could not fetch tracks:", e));

    // 2. Fetch Real Spotify Playlists
    if (accessToken) {
      fetch('/api/spotify/me/playlists?limit=20', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      .then(res => {
         if (res.status === 401) logout();
         return res.json();
      })
      .then(data => {
        if (data.items) setPlaylists(data.items);
      })
      .catch(e => console.error("Could not fetch playlists:", e));
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, [accessToken, logout]);

  const currentTrack = tracks[currentTrackIndex];

  const handleNext = () => {
    const { tracks: currentTracks, currentTrackIndex: currentIndex, isPlaying: currentPlaying } = stateRef.current;
    if (currentTracks.length === 0) return;
    const nextIndex = (currentIndex + 1) % currentTracks.length;
    setCurrentTrackIndex(nextIndex);
    if (currentPlaying || audioRef.current?.ended) {
      playMusic(nextIndex);
    }
  };

  const handlePrev = () => {
    const { tracks: currentTracks, currentTrackIndex: currentIndex, isPlaying: currentPlaying } = stateRef.current;
    if (currentTracks.length === 0) return;
    const prevIndex = (currentIndex - 1 + currentTracks.length) % currentTracks.length;
    setCurrentTrackIndex(prevIndex);
    if (currentPlaying) {
      playMusic(prevIndex);
    }
  };

  const playMusic = (index?: number) => {
    const targetTracks = stateRef.current.tracks;
    if (targetTracks.length === 0) return;
    const targetIndex = index !== undefined ? index : stateRef.current.currentTrackIndex;
    const trackTarget = targetTracks[targetIndex];

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) {
          setProgress(audioRef.current.currentTime);
        }
      });
      audioRef.current.addEventListener('loadedmetadata', () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration);
        }
      });
      audioRef.current.addEventListener('ended', handleNext);
    }

    if (audioRef.current.src !== trackTarget.audioUrl) {
      audioRef.current.src = trackTarget.audioUrl;
      audioRef.current.load();
    }

    audioRef.current.play().then(() => {
      setIsPlaying(true);
    }).catch(err => {
      console.error("Playback error", err);
      // Fallback if audio URL is broken (CORS, etc)
      setIsPlaying(false);
    });
  };

  const pauseMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (tracks.length === 0) return;
    if (isPlaying) {
      pauseMusic();
    } else {
      playMusic();
    }
  };

  const handleTrackSelect = (index: number) => {
    if (currentTrackIndex === index) {
      togglePlayPause();
    } else {
      setCurrentTrackIndex(index);
      playMusic(index);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setProgress(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  };

  if (tracks.length === 0) {
    return <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden items-center justify-center">Loading Data...</div>;
  }

  // Use either the real playlists or slice the mock tracks if the user has no real playlists
  const displayItems = playlists.length > 0 ? playlists : tracks;

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden select-none">
      {/* Main App Area */}
      <div className="flex flex-1 overflow-hidden p-2 gap-2">
        
        {/* Sidebar */}
        <div className="w-[300px] bg-black flex flex-col gap-2 border-r border-[#121212] hidden md:flex rounded-lg overflow-hidden h-full">
          {/* Top Nav Box */}
          <div className="bg-[#121212] rounded-lg px-6 py-5 flex flex-col gap-6">
            <button className="flex items-center gap-4 text-[#b3b3b3] hover:text-white transition-colors font-bold text-[15px]">
              <Home className="w-6 h-6" /> Home
            </button>
            <button className="flex items-center gap-4 text-[#b3b3b3] hover:text-white transition-colors font-bold text-[15px]">
              <Search className="w-6 h-6" /> Search
            </button>
          </div>

          {/* Library Box */}
          <div className="bg-[#121212] rounded-lg flex-1 flex flex-col overflow-hidden">
             <div className="px-6 py-4 flex items-center justify-between shadow-sm">
                <button className="flex items-center gap-4 text-[#b3b3b3] hover:text-white transition-colors font-bold text-[15px]">
                  <Library className="w-6 h-6" /> Your Library
                </button>
                <div className="flex items-center gap-2">
                   <button className="text-[#b3b3b3] hover:text-white transition-colors rounded-full p-1 hover:bg-[#1a1a1a]">
                      <Plus className="w-5 h-5" />
                   </button>
                </div>
             </div>
             
             {/* Library Items */}
             <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 relative">
                {playlists.map((pl) => (
                    <div key={`sidebar-${pl.id}`} className="flex items-center gap-3 p-2 hover:bg-[#1a1a1a] rounded-md cursor-pointer transition-colors group">
                        <img 
                            src={pl.images?.[0]?.url || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=100&auto=format&fit=crop'} 
                            className="w-12 h-12 rounded object-cover shadow-sm bg-[#282828]" 
                            alt={pl.name} 
                        />
                        <div className="flex flex-col overflow-hidden flex-1">
                            <span className="font-semibold text-white truncate">{pl.name}</span>
                            <span className="text-sm text-[#b3b3b3] truncate">Playlist • {pl.owner?.display_name || 'Spotify'}</span>
                        </div>
                    </div>
                ))}

                {playlists.length === 0 && (
                     <div className="text-sm text-[#b3b3b3] px-2 py-4 text-center">
                        No playlists found. Create one or follow some to see them here!
                     </div>
                )}
             </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-[#121212] rounded-lg overflow-y-auto relative flex flex-col">
          {/* Top Bar with Gradient Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#121212]/90 backdrop-blur-md">
             <div className="flex items-center gap-2">
                 <button className="bg-black/60 rounded-full p-2 text-[#b3b3b3] cursor-not-allowed">
                    <ArrowLeft className="w-5 h-5" />
                 </button>
                 <button className="bg-black/60 rounded-full p-2 text-[#b3b3b3] cursor-not-allowed">
                    <ArrowRight className="w-5 h-5" />
                 </button>
             </div>
             <div className="flex items-center gap-2">
                <button onClick={logout} className="bg-black/60 rounded-full p-1 text-[#b3b3b3] hover:text-white hover:scale-105 transition-all title='Log Out'">
                    <LogOut className="w-5 h-5 m-1.5" />
                </button>
                <button className="bg-black/60 rounded-full p-1 text-[#b3b3b3] hover:text-white hover:scale-105 transition-all">
                    <UserCircle2 className="w-8 h-8" />
                </button>
             </div>
          </div>

          <div className="p-6 pt-0 pb-20 bg-gradient-to-b from-[#2a2a2a] to-[#121212] flex-1">
              <h2 className="text-3xl font-bold text-white mb-6 mt-6 tracking-tight">Good afternoon</h2>
              
              {/* Compact Cards Grid (2-column wide) */}
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                {tracks.slice(0, 6).map((track, i) => (
                  <div 
                    key={`compact-${track.id}`} 
                    className="bg-white/10 hover:bg-white/20 h-16 sm:h-20 rounded-md cursor-pointer transition-colors group flex items-center shadow-sm overflow-hidden relative"
                    onClick={() => handleTrackSelect(i)}
                  >
                    <img src={track.coverUrl} className="h-full aspect-square object-cover shadow-[4px_0_12px_rgba(0,0,0,0.5)] z-10" alt="cover" />
                    <div className="flex-1 px-4 truncate font-bold text-white text-[15px] z-10">
                       {track.title}
                    </div>
                    
                    {/* Play Button Overlay */}
                    <button 
                      className={`absolute right-4 bg-[#1db954] text-black w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-xl hover:scale-105 hover:bg-[#1ed760] transition-all transform z-20
                         ${currentTrackIndex === i && isPlaying ? 'opacity-100 scale-100' : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTrackSelect(i);
                      }}
                    >
                       {currentTrackIndex === i && isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-1" />}
                    </button>
                  </div>
                ))}
              </div>

               <h2 className="text-2xl font-bold text-white mb-6 mt-10 tracking-tight hover:underline cursor-pointer inline-block">Real Spotify Playlists</h2>
               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                 {displayItems.slice(0, 10).map((item: any, i) => {
                    const cover = item.images ? item.images[0]?.url : item.coverUrl;
                    const title = item.name || item.title;
                    const subtitle = item.owner?.display_name || item.artist;

                    return (
                        <div 
                          key={`standard-${item.id}`} 
                          className="bg-[#181818] p-4 rounded-md cursor-pointer hover:bg-[#282828] transition-all duration-300 group flex flex-col shadow-lg hover:-translate-y-1"
                          onClick={() => {
                             // If it's a mock track from the fallback, play it
                             if (!item.images) handleTrackSelect(i);
                          }}
                        >
                          <div className="relative aspect-square w-full mb-4 shadow-[0_8px_24px_rgba(0,0,0,0.5)] overflow-hidden rounded flex-shrink-0">
                            <img src={cover} className="object-cover w-full h-full bg-[#333]" alt="cover" />
                            
                            {/* Play Button Overlay */}
                            <button 
                              className={`absolute bottom-2 right-2 bg-[#1db954] text-black w-12 h-12 rounded-full flex items-center justify-center shadow-xl hover:scale-105 hover:bg-[#1ed760] transition-all transform duration-300 
                                ${!item.images && currentTrackIndex === i && isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!item.images) handleTrackSelect(i);
                              }}
                            >
                               {!item.images && currentTrackIndex === i && isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                            </button>
                          </div>
                          <div className="flex flex-col flex-1 h-full">
                             <h3 className="font-bold text-white text-[15px] truncate max-w-full pb-1">{title}</h3>
                             <p className="text-sm text-[#b3b3b3] truncate max-w-full line-clamp-2 white-space-normal">{subtitle}</p>
                          </div>
                        </div>
                    );
                 })}
              </div>
          </div>

        </div>
      </div>

      {/* Player Bar (Footer) */}
      <div className="h-[90px] bg-black border-t border-[#282828] flex items-center px-4 justify-between w-full flex-shrink-0 z-50 relative pb-2 pt-2">
        {/* Track Info */}
        <div className="flex items-center gap-4 w-[30%] min-w-[180px]">
          {currentTrack && (
              <>
                <img src={currentTrack.coverUrl} className="w-14 h-14 rounded shadow-sm object-cover" alt="" />
                <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-semibold text-white hover:underline cursor-pointer truncate max-w-full">{currentTrack.title}</span>
                    <span className="text-xs text-[#b3b3b3] hover:text-white hover:underline cursor-pointer truncate max-w-full">{currentTrack.artist}</span>
                </div>
                <button className="text-[#b3b3b3] hover:text-white ml-2 flex-shrink-0">
                    <Heart className="w-5 h-5" />
                </button>
              </>
          )}
        </div>

        {/* Player Controls Center */}
        <div className="flex flex-col items-center max-w-[40%] w-full flex-1 px-4">
          <div className="flex items-center gap-5 mb-1">
            <button className="text-[#b3b3b3] hover:text-white transition-colors">
               <Shuffle className="w-4 h-4" />
            </button>
            <button onClick={handlePrev} className="text-[#b3b3b3] hover:text-white transition-colors">
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            <button 
              onClick={togglePlayPause} 
              className="bg-white text-black rounded-full w-8 h-8 flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-1" />}
            </button>
            <button onClick={handleNext} className="text-[#b3b3b3] hover:text-white transition-colors">
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
             <button className="text-[#b3b3b3] hover:text-white transition-colors">
               <Repeat className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center w-full gap-2 text-xs text-[#b3b3b3]">
            <span className="w-10 text-right">{formatTime(progress)}</span>
            <input 
              type="range"
              min="0"
              max={duration || 100}
              value={progress}
              onChange={handleSeek}
              onMouseEnter={() => setIsProgressHovered(true)}
              onMouseLeave={() => setIsProgressHovered(false)}
              className="spotify-range w-full"
              style={{
                 background: `linear-gradient(to right, ${isProgressHovered ? '#1db954' : '#fff'} ${duration ? (progress / duration) * 100 : 0}%, #4d4d4d ${duration ? (progress / duration) * 100 : 0}%)`
              }}
            />
            <span className="w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Extra Controls */}
        <div className="flex justify-end items-center w-[30%] min-w-[180px] gap-3">
          <Volume2 className="w-5 h-5 text-[#b3b3b3]" />
          <input 
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolume}
            onMouseEnter={() => setIsVolumeHovered(true)}
            onMouseLeave={() => setIsVolumeHovered(false)}
            className="spotify-range w-24"
            style={{
               background: `linear-gradient(to right, ${isVolumeHovered ? '#1db954' : '#fff'} ${volume * 100}%, #4d4d4d ${volume * 100}%)`
            }}
          />
        </div>
      </div>
    </div>
  );
}
