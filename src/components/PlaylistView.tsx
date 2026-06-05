import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Clock, Heart } from 'lucide-react';
import TopBar from './TopBar';
import { Playlist } from '../types';
import { fetchPlaylists } from '../api';
import { usePlayer } from '../context/PlayerContext';

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function PlaylistView() {
  const { id } = useParams<{ id: string }>();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { playTrack, currentTrack, isPlaying } = usePlayer();

  useEffect(() => {
    const load = async () => {
      try {
        const playlists = await fetchPlaylists();
        const found = playlists.find(p => p.id === id);
        setPlaylist(found || null);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  if (isLoading) return <div className="flex-1 bg-[#121212] p-6 text-white">Loading...</div>;
  if (!playlist) return <div className="flex-1 bg-[#121212] p-6 text-white text-2xl font-bold">Playlist not found</div>;

  return (
    <div className="flex-1 bg-gradient-to-b from-[#4a4a4a] to-[#121212] overflow-y-auto custom-scrollbar pb-24 relative">
      {/* Header */}
      <div className="p-4 md:p-6 flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 mt-0 md:mt-4 text-center md:text-left relative z-10 pt-8">
        <img src={playlist.coverUrl} className="w-48 h-48 md:w-56 md:h-56 shadow-2xl object-cover" alt={playlist.name} />
        <div className="flex flex-col items-center md:items-start">
          <span className="text-xs md:text-sm font-bold text-white uppercase tracking-wider hidden md:block">Playlist</span>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold text-white drop-shadow-md my-1 md:my-2 tracking-tight leading-tight">{playlist.name}</h1>
          <p className="text-[#b3b3b3] text-sm mt-1 md:mt-2 px-4 md:px-0">{playlist.description}</p>
          <div className="flex items-center gap-1 mt-2 text-xs md:text-sm text-white font-semibold">
            <span className="hidden md:inline">Spotify •</span>
            <span className="text-[#b3b3b3]"> {playlist.tracks.length} songs</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="p-4 md:p-6 flex items-center justify-between md:justify-start gap-6 bg-black/20">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => {
              if (playlist.tracks.length > 0) playTrack(playlist.tracks[0], playlist.tracks);
            }}
            className="w-12 h-12 md:w-14 md:h-14 bg-[#1DB954] rounded-full flex items-center justify-center shadow-xl hover:scale-105 hover:bg-[#1ed760] transition-all"
          >
            <Play className="w-6 h-6 md:w-7 md:h-7 fill-black text-black ml-1" />
          </button>
          <button className="text-[#b3b3b3] hover:text-white transition-colors">
            <Heart className="w-7 h-7 md:w-8 md:h-8" />
          </button>
          <button className="text-[#b3b3b3] hover:text-white transition-colors">
            <span className="text-xl md:text-2xl font-bold leading-none tracking-widest">...</span>
          </button>
        </div>
      </div>

      {/* Track List */}
      <div className="px-2 md:px-6 mt-4">
        {/* Table Header */}
        <div className="grid grid-cols-[30px_1fr] md:grid-cols-[16px_minmax(120px,4fr)_minmax(120px,2fr)_minmax(80px,1fr)] gap-4 px-2 md:px-4 py-2 text-[#b3b3b3] text-xs md:text-sm font-semibold border-b border-white/10 mb-2 md:mb-4 sticky top-[60px] md:top-[64px] bg-[#121212]/90 backdrop-blur-md z-30">
          <div className="hidden md:block">#</div>
          <div className="md:hidden"></div>
          <div>Title</div>
          <div className="hidden md:block">Album</div>
          <div className="hidden md:flex justify-end"><Clock className="w-4 h-4" /></div>
        </div>

        {/* Tracks */}
        <div className="flex flex-col pb-12">
          {playlist.tracks.map((track, index) => {
            const isCurrentMatch = currentTrack?.id === track.id;
            return (
              <div 
                key={track.id} 
                className={`grid grid-cols-[30px_1fr] md:grid-cols-[16px_minmax(120px,4fr)_minmax(120px,2fr)_minmax(80px,1fr)] gap-4 px-2 md:px-4 py-2 rounded-md hover:bg-white/10 group cursor-pointer transition-colors items-center ${isCurrentMatch ? 'bg-white/5' : ''}`}
                onClick={() => playTrack(track, playlist.tracks)}
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
                  <div className="flex md:hidden items-center text-[#b3b3b3]">
                    <span className="text-xl leading-none px-2 mb-1">...</span>
                  </div>
                </div>
                
                <div className="text-sm text-[#b3b3b3] truncate group-hover:text-white transition-colors hidden md:flex items-center">
                  {track.album}
                </div>
                
                <div className="text-sm text-[#b3b3b3] hidden md:flex justify-end items-center">
                  {formatTime(track.durationMs)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
