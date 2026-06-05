import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Track } from '../types';

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  progressMs: number;
  volume: number;
  queue: Track[];
  likedTrackIds: Set<string>;
  playTrack: (track: Track, queue?: Track[]) => void;
  togglePlayPause: () => void;
  seek: (ms: number) => void;
  setVolume: (level: number) => void;
  skipNext: () => void;
  skipPrev: () => void;
  toggleLike: (trackId: string) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressMs, setProgressMs] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [queue, setQueue] = useState<Track[]>([]);
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleLike = (trackId: string) => {
    setLikedTrackIds(prev => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  };

  useEffect(() => {
    audioRef.current = new Audio();
    
    const handleTimeUpdate = () => {
      if (audioRef.current) {
        setProgressMs(audioRef.current.currentTime * 1000);
      }
    };
    
    const handleEnded = () => {
      skipNext();
    };

    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current.addEventListener('ended', handleEnded);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playTrack = (track: Track, newQueue?: Track[]) => {
    if (newQueue) setQueue(newQueue);
    setCurrentTrack(track);
    setIsPlaying(true);
    setProgressMs(0);
    
    if (audioRef.current) {
      audioRef.current.src = track.audioUrl;
      audioRef.current.volume = volume;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          if (e.name === 'AbortError' || e.name === 'NotSupportedError' || e.message.includes('supported source')) return; // Ignore expected interruptions
          console.error("Audio play failed:", e);
        });
      }
    }
  };

  const togglePlayPause = () => {
    if (!currentTrack || !audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          if (e.name === 'AbortError' || e.name === 'NotSupportedError' || e.message.includes('supported source')) return;
          console.error("Audio play failed:", e);
        });
      }
      setIsPlaying(true);
    }
  };

  const seek = (ms: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = ms / 1000;
      setProgressMs(ms);
    }
  };

  const setVolume = (level: number) => {
    setVolumeState(level);
    if (audioRef.current) {
      audioRef.current.volume = level;
    }
  };

  const skipNext = () => {
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex !== -1 && currentIndex < queue.length - 1) {
      playTrack(queue[currentIndex + 1]);
    } else {
      // Loop or stop
      setIsPlaying(false);
      setProgressMs(0);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  };

  const skipPrev = () => {
    if (!currentTrack || queue.length === 0) return;
    if (progressMs > 3000 || !audioRef.current) {
      seek(0);
      return;
    }
    
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      playTrack(queue[currentIndex - 1]);
    } else {
      seek(0);
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        progressMs,
        volume,
        queue,
        likedTrackIds,
        playTrack,
        togglePlayPause,
        seek,
        setVolume,
        skipNext,
        skipPrev,
        toggleLike
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
