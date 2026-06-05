import { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Volume2, Mic2, MonitorSpeaker, ListMusic, Maximize2, SlidersHorizontal, Moon, ChevronDown, Share2, CheckCircle2, ChevronUp } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function Player() {
  const { currentTrack, isPlaying, progressMs, volume, togglePlayPause, skipNext, skipPrev, seek, setVolume, likedTrackIds, toggleLike } = usePlayer();
  const [showEq, setShowEq] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(Number(e.target.value));
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value));
  };

  const progressPercent = currentTrack ? (progressMs / currentTrack.durationMs) * 100 : 0;

  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isFullScreen]);

  if (isFullScreen) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-[#4a4a4a] to-black z-[100] flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] px-6 animate-in slide-in-from-bottom-full duration-300 overflow-hidden">
        <div className="flex items-center justify-between py-4 mt-2">
          <button onClick={() => setIsFullScreen(false)} className="text-white hover:text-[#b3b3b3] transition-colors">
            <ChevronDown className="w-8 h-8" />
          </button>
          <span className="text-xs font-bold uppercase tracking-widest text-[#b3b3b3]">Now Playing</span>
          <button className="text-white">
            <span className="text-2xl font-bold leading-none mb-2 block">...</span>
          </button>
        </div>

        {currentTrack ? (
          <div className="flex-1 flex flex-col h-full max-h-[calc(100vh-100px)] justify-between pb-8">
            <div className="w-full aspect-square rounded-lg shadow-2xl overflow-hidden mt-4 mb-auto mx-auto relative group max-w-[400px]">
               <img src={currentTrack.coverUrl} className="w-full h-full object-cover" alt="Album Art" />
            </div>

            <div className="w-full max-w-[400px] mx-auto flex flex-col">
              <div className="flex items-center justify-between mt-8 mb-6">
                <div className="flex flex-col flex-1 overflow-hidden pr-4">
                  <span className="text-white text-2xl font-bold truncate">{currentTrack.title}</span>
                  <span className="text-[#b3b3b3] text-lg truncate">{currentTrack.artist}</span>
                </div>
                <button onClick={() => toggleLike(currentTrack.id)} className="text-[#1DB954]">
                   {likedTrackIds.has(currentTrack.id) ? (
                     <CheckCircle2 className="w-8 h-8 text-[#1DB954] fill-[#1DB954] bg-black rounded-full" />
                   ) : (
                     <div className="w-8 h-8 rounded-full border-2 border-[#b3b3b3] hover:border-white transition-colors flex items-center justify-center">
                        <svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16" fill="currentColor" className="text-[#b3b3b3] hover:text-white"><path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"></path><path d="M11.75 8a.75.75 0 0 1-.75.75H8.75V11.5a.75.75 0 0 1-1.5 0V8.75H4.5a.75.75 0 0 1 0-1.5h2.75V4.5a.75.75 0 0 1 1.5 0v2.75H11a.75.75 0 0 1 .75.75z"></path></svg>
                     </div>
                   )}
                </button>
              </div>

              <div className="flex flex-col mb-4">
                <div className="w-full h-1.5 bg-white/20 rounded-full relative mb-3">
                  <div className="absolute top-0 left-0 h-full bg-white rounded-full" style={{ width: `${progressPercent}%` }}>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg"></div>
                  </div>
                  <input type="range" className="absolute inset-0 w-full h-full opacity-0 z-10" min="0" max={currentTrack.durationMs} value={progressMs} onChange={handleSeek} disabled={!currentTrack} />
                </div>
                <div className="flex justify-between text-xs text-[#b3b3b3] font-medium">
                  <span>{formatTime(progressMs)}</span>
                  <span>{formatTime(currentTrack.durationMs)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-8">
                <button className="text-[#b3b3b3] hover:text-white"><Shuffle className="w-6 h-6" /></button>
                <button onClick={skipPrev} className="text-white hover:text-[#b3b3b3]">
                  <SkipBack className="w-10 h-10 fill-current" />
                </button>
                <button onClick={togglePlayPause} className="w-[72px] h-[72px] bg-white rounded-full flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-transform">
                  {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                </button>
                <button onClick={skipNext} className="text-white hover:text-[#b3b3b3]">
                  <SkipForward className="w-10 h-10 fill-current" />
                </button>
                <button className="text-white"><Repeat className="w-6 h-6" /></button>
              </div>

              <div className="flex items-center justify-between text-[#b3b3b3]">
                 <button><MonitorSpeaker className="w-5 h-5 hover:text-white"/></button>
                 <button><Share2 className="w-5 h-5 hover:text-white"/></button>
                 <button><ListMusic className="w-5 h-5 hover:text-white"/></button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#b3b3b3]">No track playing</div>
        )}
      </div>
    );
  }

  return (
    <div className="h-[64px] md:h-24 bg-[#282828] md:bg-black rounded-lg md:rounded-none mx-2 mb-[6px] md:mx-0 md:mb-0 flex items-center justify-between px-3 md:px-4 z-[90] flex-shrink-0 relative overflow-hidden group shadow-lg md:shadow-none w-[calc(100%-16px)] md:w-full">
      <div className="md:hidden absolute bottom-0 left-0 w-full h-[2px] bg-white/10 z-10">
        <div className="h-full bg-white transition-all rounded-r" style={{ width: `${progressPercent}%` }}></div>
      </div>
      
      <div 
        className="flex items-center w-full md:w-[30%] md:min-w-[180px] justify-between md:justify-start cursor-pointer md:cursor-default"
        onClick={() => { if (window.innerWidth < 768) setIsFullScreen(true); }}
      >
        <div className="flex items-center overflow-hidden mr-3 md:mr-0 min-w-0">
          {currentTrack ? (
            <>
              <img src={currentTrack.coverUrl} alt={currentTrack.album} className="w-10 h-10 md:w-14 md:h-14 rounded md:rounded-md shadow-lg object-cover flex-shrink-0" />
              <div className="ml-3 flex flex-col justify-center overflow-hidden min-w-0 pr-2">
                <a href="#" className="text-[13px] md:text-sm font-semibold text-white animate-marquee whitespace-nowrap md:truncate">{currentTrack.title}</a>
                <a href="#" className="text-[11px] md:text-xs text-[#b3b3b3] truncate">{currentTrack.artist}</a>
              </div>
              <button onClick={() => toggleLike(currentTrack.id)} className="ml-2 md:ml-6 transition-colors flex-shrink-0 hidden md:block">
                {likedTrackIds.has(currentTrack.id) ? (
                  <CheckCircle2 className="w-5 h-5 text-[#1DB954] fill-[#1DB954]" />
                ) : (
                  <HeartIcon className="w-4 h-4 text-[#b3b3b3] hover:text-white fill-current" />
                )}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 md:w-14 md:h-14 bg-[#333] rounded md:rounded-md shadow-lg flex items-center justify-center flex-shrink-0">
                 <span className="text-[#b3b3b3] text-xs">No track</span>
               </div>
               <div className="flex flex-col">
                 <span className="text-[13px] md:text-sm font-semibold text-[#b3b3b3]">-</span>
                 <span className="text-[11px] md:text-xs text-[#b3b3b3]">-</span>
               </div>
            </div>
          )}
        </div>

        <div className="flex md:hidden items-center gap-4 flex-shrink-0 z-20 mr-1" onClick={(e) => e.stopPropagation()}>
           <button className="text-[#b3b3b3] hover:text-white transition-colors" title="Devices"><MonitorSpeaker className="w-[18px] h-[18px]" /></button>
           <button onClick={(e) => { e.stopPropagation(); if(currentTrack) toggleLike(currentTrack.id); }} className="transition-colors">
             {currentTrack && likedTrackIds.has(currentTrack.id) ? (
               <CheckCircle2 className="w-5 h-5 text-[#1DB954] fill-[#1DB954]" />
             ) : (
               <HeartIcon className="w-5 h-5 text-[#b3b3b3] hover:text-white fill-current" />
             )}
           </button>
           <button 
              onClick={togglePlayPause} 
              className="text-white hover:scale-105 active:scale-95 transition-all w-8 h-8 flex items-center justify-center"
              disabled={!currentTrack}
           >
             {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
           </button>
        </div>
      </div>

      <div className="hidden md:flex flex-col items-center max-w-[40%] w-full">
        <div className="flex items-center gap-6 mb-2">
          <button className="text-[#b3b3b3] hover:text-white transition-colors" title="Enable shuffle"><Shuffle className="w-5 h-5" /></button>
          <button onClick={skipPrev} className="text-[#b3b3b3] hover:text-white transition-colors" disabled={!currentTrack}>
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          
          <button 
            onClick={togglePlayPause} 
            className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-black hover:scale-105 transition-transform"
            disabled={!currentTrack}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
          </button>
          
          <button onClick={skipNext} className="text-[#b3b3b3] hover:text-white transition-colors" disabled={!currentTrack}>
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
          <button className="text-[#b3b3b3] hover:text-white transition-colors" title="Enable repeat"><Repeat className="w-5 h-5" /></button>
        </div>

        <div className="flex items-center w-full gap-2 group">
          <span className="text-xs text-[#b3b3b3] w-10 text-right">
            {formatTime(progressMs)}
          </span>
          <div className="flex-1 overflow-hidden relative rounded-full h-1 bg-[#4d4d4d] group-hover:h-1.5 transition-all outline-none">
            <input 
              type="range" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              min={0} 
              max={currentTrack?.durationMs || 100} 
              value={progressMs}
              onChange={handleSeek}
              disabled={!currentTrack}
            />
            <div 
              className="absolute top-0 left-0 h-full bg-white group-hover:bg-[#1DB954] transition-colors rounded-full"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow hidden group-hover:block" />
            </div>
          </div>
          <span className="text-xs text-[#b3b3b3] w-10">
            {currentTrack ? formatTime(currentTrack.durationMs) : '0:00'}
          </span>
        </div>
      </div>

      <div className="hidden md:flex items-center justify-end w-[30%] min-w-[180px] gap-4 relative">
        <button className="text-[#b3b3b3] hover:text-white transition-colors flex items-center" title="Now Playing View"><div className="w-4 h-4 border border-current rounded-sm mr-[1px]"></div><ListMusic className="w-3 h-3 -ml-1 border-current" /></button>
        <button className="text-[#b3b3b3] hover:text-white transition-colors" title="Lyrics"><Mic2 className="w-[18px] h-[18px]" /></button>
        <button className="text-[#b3b3b3] hover:text-white transition-colors" title="Queue"><ListMusic className="w-[18px] h-[18px]" /></button>
        <button className="text-[#1DB954] hover:text-[#1ed760] transition-colors" title="Connect to a device"><MonitorSpeaker className="w-[18px] h-[18px] text-inherit" /></button>
        
        <div className="flex items-center gap-2 group w-24">
          <button className="text-[#b3b3b3] hover:text-white"><Volume2 className="w-5 h-5 text-inherit" /></button>
          <div className="flex-1 relative rounded-full h-1 bg-[#4d4d4d] group-hover:h-1.5 transition-all">
             <input 
              type="range" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              min="0" max="1" step="0.01" value={volume} onChange={handleVolume}
            />
            <div 
              className="absolute top-0 left-0 h-full bg-white group-hover:bg-[#1DB954] transition-colors rounded-full"
              style={{ width: `${volume * 100}%` }}
            >
               <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow hidden group-hover:block" />
            </div>
          </div>
        </div>
        
        <button className="text-[#b3b3b3] hover:text-white transition-colors flex-shrink-0 hidden lg:block" title="Full screen"><Maximize2 className="w-[18px] h-[18px]" /></button>

        {showEq && (
          <div className="absolute bottom-16 right-10 bg-[#282828] p-4 rounded-lg shadow-2xl border border-white/10 z-50 w-64">
             <div className="flex items-center justify-between mb-4">
               <h4 className="text-white font-bold text-sm">Equalizer</h4>
               <SlottedSwitch />
             </div>
             <div className="flex justify-between items-end h-24 gap-2 mb-2">
                {[40, 70, 30, 80, 50, 60].map((h, i) => (
                  <div key={i} className="w-1/6 bg-white/20 rounded-t overflow-hidden relative">
                     <div className="absolute bottom-0 w-full bg-[#1DB954]" style={{ height: `${h}%` }}></div>
                  </div>
                ))}
             </div>
             <div className="flex justify-between text-[10px] text-[#b3b3b3]">
               <span>60Hz</span><span>150Hz</span><span>400Hz</span><span>1KHz</span><span>2.4KHz</span><span>15KHz</span>
             </div>
          </div>
        )}

        {showTimer && (
          <div className="absolute bottom-16 right-32 bg-[#282828] p-4 rounded-lg shadow-2xl border border-white/10 z-50 w-48 text-sm">
             <h4 className="text-white font-bold mb-3">Sleep Timer</h4>
             <div className="flex flex-col gap-2">
               {['15 min', '30 min', '45 min', '1 hour', 'End of track'].map(t => (
                 <button key={t} onClick={() => setShowTimer(false)} className="text-left text-[#b3b3b3] hover:text-white transition-colors py-1">
                   {t}
                 </button>
               ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SlottedSwitch() {
  return (
    <div className="w-8 h-4 bg-[#1DB954] rounded-full relative cursor-pointer">
      <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 right-0.5"></div>
    </div>
  );
}

function HeartIcon({ className = "w-5 h-5 fill-current" }: { className?: string }) {
  return (
    <svg role="img" viewBox="0 0 16 16" className={className} aria-hidden="true">
      <path d="M1.69 2A4.582 4.582 0 0 1 8 2.023 4.583 4.583 0 0 1 11.88.817h.002a4.618 4.618 0 0 1 3.782 3.65v.003a4.543 4.543 0 0 1-1.011 3.84L9.35 14.629a1.765 1.765 0 0 1-2.093.464 1.762 1.762 0 0 1-1.15-1.336l-5.321-6.19a4.544 4.544 0 0 1-1.006-3.837A4.619 4.619 0 0 1 1.69 2z"></path>
    </svg>
  );
}
