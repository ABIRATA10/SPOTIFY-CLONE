import { useEffect, useState } from 'react';
import { Play, Clock, Heart, CheckCircle2 } from 'lucide-react';
import { Track } from '../types';
import { fetchTracks } from '../api';
import { usePlayer } from '../context/PlayerContext';

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function LibraryView() {
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const { playTrack, currentTrack, isPlaying, likedTrackIds, toggleLike } = usePlayer();

  useEffect(() => {
    fetchTracks().then(setAllTracks).catch(console.error);
  }, []);

  const likedTracks = allTracks.filter(t => likedTrackIds.has(t.id));

  return (
    <div className="flex-1 bg-gradient-to-b from-[#4a4a4a] to-[#121212] overflow-y-auto custom-scrollbar pb-24 relative">
      <div className="absolute top-0 left-0 w-full h-[332px] bg-gradient-to-b from-[#450af5] via-[#450af5]/50 to-transparent pointer-events-none z-0"></div>

      {/* Header */}
      <div className="p-4 md:p-6 flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 mt-0 md:mt-4 text-center md:text-left relative z-10 pt-8">
        <div className="w-48 h-48 md:w-56 md:h-56 shadow-2xl bg-gradient-to-br from-[#450af5] to-[#c4efd9] flex justify-center items-center flex-shrink-0">
           <svg role="img" height="64" width="64" aria-hidden="true" viewBox="0 0 16 16" className="fill-white"><path d="M1.69 2A4.582 4.582 0 0 1 8 2.023 4.583 4.583 0 0 1 11.88.817h.002a4.618 4.618 0 0 1 3.782 3.65v.003a4.543 4.543 0 0 1-1.011 3.84L9.35 14.629a1.765 1.765 0 0 1-2.093.464 1.762 1.762 0 0 1-1.15-1.336l-5.321-6.19a4.544 4.544 0 0 1-1.006-3.837A4.619 4.619 0 0 1 1.69 2z"></path></svg>
        </div>
        <div className="flex flex-col items-center md:items-start">
          <span className="text-xs md:text-sm font-bold text-white uppercase tracking-wider hidden md:block">Playlist</span>
          <h1 className="text-3xl sm:text-5xl md:text-8xl font-black text-white drop-shadow-md my-1 md:my-2 tracking-tighter leading-none mb-4">Liked Songs</h1>
          <div className="flex items-center gap-1 mt-2 text-xs md:text-sm text-white font-semibold">
            <div className="w-6 h-6 rounded-full bg-[#f6b4d3] text-black flex items-center justify-center font-bold text-[10px] mr-1">
              A
            </div>
            <span className="hover:underline cursor-pointer">Abiratapanda</span>
            <span className="text-white"> • {likedTracks.length} songs</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="p-4 md:p-6 flex items-center justify-between md:justify-start gap-6 relative z-10">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => {
              if (likedTracks.length > 0) playTrack(likedTracks[0], likedTracks);
            }}
            className="w-12 h-12 md:w-14 md:h-14 bg-[#1DB954] rounded-full flex items-center justify-center shadow-xl hover:scale-105 hover:bg-[#1ed760] transition-all"
          >
            <Play className="w-6 h-6 md:w-7 md:h-7 fill-black text-black ml-1" />
          </button>
        </div>
      </div>

      {/* Track List */}
      <div className="px-2 md:px-6 mt-4 relative z-10">
        {/* Table Header */}
        <div className="grid grid-cols-[30px_1fr] md:grid-cols-[16px_minmax(120px,4fr)_minmax(120px,2fr)_minmax(80px,1fr)] gap-4 px-2 md:px-4 py-2 text-[#b3b3b3] text-xs md:text-sm font-semibold border-b border-white/10 mb-2 md:mb-4 sticky top-0 bg-[#121212]/95 backdrop-blur-md z-30">
          <div className="hidden md:block">#</div>
          <div className="md:hidden"></div>
          <div>Title</div>
          <div className="hidden md:block">Album</div>
          <div className="hidden md:flex justify-end"><Clock className="w-4 h-4" /></div>
        </div>

        {/* Tracks */}
        <div className="flex flex-col pb-12">
          {likedTracks.map((track, index) => {
            const isCurrentMatch = currentTrack?.id === track.id;
            return (
              <div 
                key={track.id} 
                className={`grid grid-cols-[30px_1fr] md:grid-cols-[16px_minmax(120px,4fr)_minmax(120px,2fr)_minmax(80px,1fr)] gap-4 px-2 md:px-4 py-2 rounded-md hover:bg-white/10 group cursor-pointer transition-colors items-center ${isCurrentMatch ? 'bg-white/5' : ''}`}
                onClick={() => playTrack(track, likedTracks)}
              >
                <div className="text-[#b3b3b3] group-hover:hidden flex items-center h-full justify-center md:items-start md:justify-start w-full">
                  {isCurrentMatch && isPlaying ? (
                    <img src="https://open.spotifycdn.com/cdn/images/equaliser-animated-green.f93a2ef4.gif" className="w-3 h-3 block" alt="playing" />
                  ) : isCurrentMatch ? (
                    <span className="text-[#1DB954] text-xs md:text-base">{index + 1}</span>
                  ) : (
                    <span className="text-xs md:text-base">{index + 1}</span>
                  )}
                </div>
                <div className="hidden group-hover:flex items-center justify-center md:justify-start text-white">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                
                <div className="flex items-center gap-3 md:gap-4 overflow-hidden pr-2">
                  <img src={track.coverUrl} className="w-10 h-10 md:w-10 md:h-10 object-cover rounded shadow" alt={track.title} />
                  <div className="flex flex-col truncate flex-1 min-w-0">
                    <span className={`truncate text-sm md:text-base font-semibold ${isCurrentMatch ? 'text-[#1DB954]' : 'text-white'}`}>
                      {track.title}
                    </span>
                    <span className="truncate text-[11px] md:text-sm text-[#b3b3b3] group-hover:text-white transition-colors">{track.artist}</span>
                  </div>
                  {/* Mobile Actions in Row */}
                  <div className="flex md:hidden items-center">
                    <button onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }} className="mr-2">
                      <CheckCircle2 className="w-5 h-5 text-[#1DB954] fill-[#1DB954]" />
                    </button>
                    <span className="text-xl leading-none px-2 mb-1 text-[#b3b3b3]">...</span>
                  </div>
                </div>
                
                <div className="text-sm text-[#b3b3b3] truncate group-hover:text-white transition-colors hidden md:flex items-center">
                  {track.album}
                </div>
                
                <div className="text-sm text-[#b3b3b3] hidden md:flex justify-end items-center gap-4">
                  <button onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <CheckCircle2 className="w-5 h-5 text-[#1DB954] fill-[#1DB954]" />
                  </button>
                  <span className="w-10 text-right">{formatTime(track.durationMs)}</span>
                </div>
              </div>
            );
          })}
          {likedTracks.length === 0 && (
            <div className="text-center mt-20 text-[#b3b3b3]">
               <h3 className="text-2xl font-bold text-white mb-2">Songs you like will appear here</h3>
               <p>Save songs by tapping the heart icon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
