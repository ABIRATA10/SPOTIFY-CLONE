import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipForward, SkipBack, X, Loader2, Sparkles, Search, RotateCcw, Mic, Shuffle, Repeat, Repeat1 } from 'lucide-react';

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

interface LyricsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  progress: number;
  duration: number;
  isPlaying: boolean;
  isShuffled: boolean;
  repeatMode: 'off' | 'all' | 'one';
  onTogglePlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  formatTime: (time: number) => string;
}

interface LyricLine {
  time: number;
  text: string;
}

export function LyricsOverlay({
  isOpen,
  onClose,
  currentTrack,
  progress,
  duration,
  isPlaying,
  isShuffled,
  repeatMode,
  onTogglePlayPause,
  onPrev,
  onNext,
  onSeek,
  onToggleShuffle,
  onToggleRepeat,
  formatTime,
}: LyricsOverlayProps) {
  const [lyrics, setLyrics] = useState<LyricLine[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customSearchQuery, setCustomSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [isLrcSynced, setIsLrcSynced] = useState(true);

  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const currentRequestRef = useRef<string>('');
  
  // Track current lyrics fetch based on track or custom search
  useEffect(() => {
    if (isOpen && currentTrack) {
      setCustomSearchQuery(`${currentTrack.title} ${currentTrack.artist}`);
      fetchLyrics(currentTrack.artist, currentTrack.title);
    } else {
      setLyrics(null);
      setError(null);
      setShowSearchInput(false);
    }
  }, [isOpen, currentTrack?.id]);

  const fetchLyrics = async (artist: string, title: string) => {
    const requestId = `${artist}-${title}`;
    currentRequestRef.current = requestId;
    
    setLoading(true);
    setError(null);
    setLyrics(null);
    setIsLrcSynced(true);
    
    try {
      // Clean up title for better search accuracy
      let cleanTitle = title.replace(/\(feat\..*?\)/i, '').replace(/\[.*?\]/g, '').trim();
      if (cleanTitle.toLowerCase() === 'untitled') {
        cleanTitle = 'Untitled';
      }
      
      // 1. Try precise match first via lrclib synced get API
      let url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(cleanTitle)}`;
      let res = await fetch(url);
      
      let data: any = null;
      if (res.ok) {
        data = await res.json();
      }

      let syncedLyrics = data?.syncedLyrics;
      let plainLyrics = data?.plainLyrics;
      
      // 2. Fallback to general search on lrclib
      if (!syncedLyrics && !plainLyrics) {
        url = `https://lrclib.net/api/search?q=${encodeURIComponent(cleanTitle + ' ' + artist)}`;
        res = await fetch(url);
        if (res.ok) {
          const searchData = await res.json();
          if (Array.isArray(searchData) && searchData.length > 0) {
            const matched = searchData.find((d: any) => d.syncedLyrics) || searchData[0];
            syncedLyrics = matched?.syncedLyrics;
            plainLyrics = matched?.plainLyrics;
          }
        }
      }
      
      // Prevent race conditions
      if (currentRequestRef.current !== requestId) return;
      
      if (syncedLyrics) {
        const parsed = parseLrc(syncedLyrics);
        setLyrics(parsed);
        setIsLrcSynced(true);
      } else if (plainLyrics) {
        // Parse plain text lyrics (unsynced)
        const lines = plainLyrics.split('\n').map((line: string, idx: number) => ({
          time: idx * 4, // Pseudo times for spacing
          text: line.trim()
        })).filter((line: any) => line.text.length > 0);
        setLyrics(lines);
        setIsLrcSynced(false);
      } else {
        // Fallback to static or mock helper if needed, otherwise show not found
        setError("Could not find lyrics automatically.");
      }
    } catch (err) {
      if (currentRequestRef.current === requestId) {
        setError("Error connecting to lyrics service.");
      }
    } finally {
      if (currentRequestRef.current === requestId) {
        setLoading(false);
      }
    }
  };

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSearchQuery.trim()) return;
    
    // Split input query or search directly
    const queryParts = customSearchQuery.split(' ');
    const half = Math.ceil(queryParts.length / 2);
    const title = queryParts.slice(0, half).join(' ');
    const artist = queryParts.slice(half).join(' ');
    
    fetchLyrics(artist || 'Unknown', title);
  };

  // Parse LRC format
  const parseLrc = (lrc: string): LyricLine[] => {
    const lines = lrc.split('\n');
    const parsed: LyricLine[] = [];
    const timeRegEx = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
    
    for (const line of lines) {
      const match = timeRegEx.exec(line);
      if (match) {
        const m = parseInt(match[1], 10);
        const s = parseInt(match[2], 10);
        const ms = parseInt(match[3], 10);
        
        const time = m * 60 + s + (ms / (match[3].length === 2 ? 100 : 1000));
        const text = line.replace(timeRegEx, '').trim();
        
        if (text) {
          parsed.push({ time, text });
        }
      }
    }
    
    return parsed;
  };

  // Find the currently active line index based on song progress
  const activeLineIndex = lyrics && isLrcSynced ? lyrics.findIndex((line, idx) => {
    const nextLine = lyrics[idx + 1];
    if (!nextLine) return progress >= line.time;
    return progress >= line.time && progress < nextLine.time;
  }) : -1;

  // Auto-scroll the container to center the active line
  useEffect(() => {
    if (activeLineIndex !== -1 && lyricsContainerRef.current && isLrcSynced) {
      const activeElement = lyricsContainerRef.current.children[activeLineIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [activeLineIndex, isLrcSynced]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] bg-black/95 flex flex-col select-none"
      >
        {/* Dynamic Glowing Ambient Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30 z-0">
          <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-emerald-800/40 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-slate-800/40 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
          {currentTrack?.coverUrl && (
            <div 
              className="absolute inset-0 bg-cover bg-center filter blur-[80px] opacity-10 transition-all duration-1000 scale-110"
              style={{ backgroundImage: `url(${currentTrack.coverUrl})` }}
            />
          )}
        </div>

        {/* Top Header Controls */}
        <div className="relative z-10 flex justify-between items-center px-8 py-6 border-b border-white/5 bg-black/20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#1db954]" />
            <span className="font-bold text-white text-base tracking-tight uppercase">Sing Along Mode</span>
            {!isLrcSynced && lyrics && (
              <span className="text-xs bg-[#282828] text-[#b3b3b3] px-2 py-0.5 rounded-full font-medium ml-2">
                Unsynced
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Toggle Custom Search */}
            <button 
              onClick={() => setShowSearchInput(!showSearchInput)}
              className="text-[#b3b3b3] hover:text-white transition-colors p-2 rounded-full hover:bg-white/5 cursor-pointer"
              title="Search lyrics manually"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-[#b3b3b3] hover:text-white transition-colors p-2 rounded-full hover:bg-white/5 cursor-pointer"
              title="Exit Sing Along"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Custom Search Form Overlay */}
        <AnimatePresence>
          {showSearchInput && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="relative z-10 bg-[#121212]/90 border-b border-white/5 overflow-hidden"
            >
              <form onSubmit={handleCustomSearch} className="max-w-xl mx-auto py-4 px-6 flex gap-2">
                <input
                  type="text"
                  value={customSearchQuery}
                  onChange={(e) => setCustomSearchQuery(e.target.value)}
                  placeholder="Search artist name or track title..."
                  className="flex-1 bg-[#242424] text-white px-4 py-2 rounded-lg text-sm outline-none border border-transparent focus:border-[#1db954] transition-all"
                />
                <button
                  type="submit"
                  className="bg-[#1db954] text-black hover:bg-[#1ed760] font-bold px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                >
                  Search
                </button>
                {currentTrack && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomSearchQuery(`${currentTrack.title} ${currentTrack.artist}`);
                      fetchLyrics(currentTrack.artist, currentTrack.title);
                    }}
                    className="p-2 bg-[#242424] hover:bg-[#2e2e2e] text-white rounded-lg transition-colors cursor-pointer"
                    title="Reset search"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary Content Grid */}
        <div className="flex-1 relative z-10 flex flex-col md:flex-row overflow-hidden max-w-7xl mx-auto w-full px-8 py-4 gap-8">
          
          {/* Left / Side Panel: Now Playing Track Info */}
          {currentTrack && (
            <div className="flex md:flex-col justify-center items-center md:items-start md:w-[35%] shrink-0 gap-6 border-b md:border-b-0 md:border-r border-white/5 pb-6 md:pb-0 md:pr-8">
              <div className="w-24 h-24 md:w-64 md:h-64 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] shrink-0 group relative">
                <img 
                  src={currentTrack.coverUrl} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  alt={currentTrack.title} 
                />
              </div>
              
              <div className="flex-1 md:flex-initial text-left md:mt-2 min-w-0">
                <h1 className="text-xl md:text-3xl font-extrabold text-white tracking-tight leading-tight truncate">
                  {currentTrack.title}
                </h1>
                <p className="text-sm md:text-lg text-[#b3b3b3] mt-1 font-medium truncate">
                  {currentTrack.artist}
                </p>
                <p className="text-xs text-[#535353] mt-2 font-mono truncate hidden md:block">
                  Album: {currentTrack.album || 'Unknown Album'}
                </p>
              </div>
            </div>
          )}

          {/* Right Panel: Scrollable Synced Lyrics */}
          <div className="flex-1 flex flex-col overflow-hidden justify-center min-h-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-[#1db954]" />
                <p className="text-[#b3b3b3] mt-4 font-bold text-base">Retrieving lyrics...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 px-6 flex flex-col items-center justify-center">
                <Mic className="w-12 h-12 text-[#535353] mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">No Lyrics Found</h2>
                <p className="text-sm text-[#b3b3b3] max-w-md mb-6">
                  We couldn't automatically find synced lyrics for this song. You can try adjusting the search query manually.
                </p>
                <button
                  onClick={() => setShowSearchInput(true)}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-2.5 rounded-full text-sm transition-colors cursor-pointer"
                >
                  Search Manually
                </button>
              </div>
            ) : lyrics ? (
              <div 
                ref={lyricsContainerRef}
                className="flex-1 overflow-y-auto px-4 py-32 space-y-8 scrollbar-hide select-none"
                style={{ scrollBehavior: 'smooth' }}
              >
                {lyrics.map((line, idx) => {
                  const isActive = idx === activeLineIndex;
                  const isPast = idx < activeLineIndex;
                  
                  return (
                    <motion.div
                      key={idx}
                      onClick={() => isLrcSynced && onSeek(line.time)}
                      className={`text-[24px] md:text-[34px] font-black leading-snug cursor-pointer transition-all duration-300 origin-left ${
                        isActive 
                          ? 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-[1.03]' 
                          : isPast 
                            ? 'text-white/60 hover:text-white' 
                            : 'text-[#3e3e3e] hover:text-[#b3b3b3]'
                      }`}
                      style={{
                        transitionTimingFunction: 'cubic-bezier(0.25, 0.8, 0.25, 1)',
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      layout
                    >
                      {line.text}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-[#b3b3b3]">
                Play a song to load its lyrics.
              </div>
            )}
          </div>
        </div>

        {/* Bottom Lyrics Player Dashboard & Controls */}
        <div className="relative z-10 border-t border-white/5 bg-black/60 backdrop-blur-xl px-8 py-6 shrink-0">
          <div className="max-w-4xl mx-auto flex flex-col gap-4">
            {/* Progress Slider */}
            <div className="flex items-center gap-4 text-xs text-[#b3b3b3] font-mono">
              <span className="w-12 text-right">{formatTime(progress)}</span>
              <div 
                className="flex-1 h-1.5 bg-white/10 hover:bg-white/20 rounded-full overflow-hidden relative cursor-pointer group"
                onClick={(e) => {
                  const bounds = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - bounds.left;
                  const percentage = x / bounds.width;
                  onSeek(percentage * duration);
                }}
              >
                <div 
                  className="h-full bg-[#1db954] group-hover:bg-[#1ed760] transition-all rounded-full relative" 
                  style={{ width: `${(progress / (duration || 1)) * 100}%` }}
                />
              </div>
              <span className="w-12">{formatTime(duration)}</span>
            </div>

            {/* Control Actions */}
            <div className="flex justify-center items-center gap-8">
              <button 
                onClick={onToggleShuffle}
                className={`transition-colors hover:scale-105 cursor-pointer ${isShuffled ? 'text-[#1db954] relative after:content-[""] after:absolute after:w-1 after:h-1 after:bg-[#1db954] after:rounded-full after:-bottom-2 after:left-1/2 after:-translate-x-1/2' : 'text-[#b3b3b3] hover:text-white'}`}
                title="Shuffle"
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button 
                onClick={onPrev}
                className="text-[#b3b3b3] hover:text-white transition-colors cursor-pointer"
                title="Previous Song"
              >
                <SkipBack className="w-6 h-6 fill-current" />
              </button>

              <button 
                onClick={onTogglePlayPause}
                className="bg-white text-black hover:scale-105 active:scale-95 transition-transform rounded-full w-14 h-14 flex items-center justify-center cursor-pointer shadow-lg"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
              </button>

              <button 
                onClick={onNext}
                className="text-[#b3b3b3] hover:text-white transition-colors cursor-pointer"
                title="Next Song"
              >
                <SkipForward className="w-6 h-6 fill-current" />
              </button>

              <button 
                onClick={onToggleRepeat}
                className={`transition-colors hover:scale-105 cursor-pointer ${repeatMode !== 'off' ? 'text-[#1db954] relative after:content-[""] after:absolute after:w-1 after:h-1 after:bg-[#1db954] after:rounded-full after:-bottom-2 after:left-1/2 after:-translate-x-1/2' : 'text-[#b3b3b3] hover:text-white'}`}
                title="Repeat"
              >
                {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
