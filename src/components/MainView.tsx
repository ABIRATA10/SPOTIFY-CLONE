import { useEffect, useState } from 'react';
import { Sparkles, Calendar, Settings2, Users, Radio } from 'lucide-react';
import TopBar from './TopBar';
import Card from './Card';
import { usePlayer } from '../context/PlayerContext';
import { Track, Album, Playlist } from '../types';
import { fetchTracks, fetchAlbums, fetchPlaylists } from '../api';
import { useNavigate } from 'react-router-dom';

export default function MainView() {
  const greeting = getGreeting();
  const { playTrack } = usePlayer();
  const navigate = useNavigate();
  
  const [tracks, setTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tracksData, albumsData, playlistsData] = await Promise.all([
          fetchTracks(),
          fetchAlbums(),
          fetchPlaylists()
        ]);
        setTracks(tracksData);
        setAlbums(albumsData);
        setPlaylists(playlistsData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 bg-gradient-to-b from-[#1e1e1e] to-[#121212] overflow-y-auto custom-scrollbar pb-24 p-6">
        <div className="animate-pulse flex flex-col gap-8">
          <div className="h-8 bg-white/10 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-20 bg-white/5 rounded"></div>
            ))}
          </div>
          <div className="h-8 bg-white/10 rounded w-32 mt-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-64 bg-white/5 rounded-md"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#121212] overflow-y-auto custom-scrollbar relative">
      <div className="absolute top-0 left-0 w-full h-[332px] bg-gradient-to-b from-[#2a1b38] via-[#2a1b38]/50 to-[#121212] pointer-events-none z-0"></div>
      
      <div className="px-4 md:px-6 py-4 relative z-10">
        {/* Smart Filters */}
        <div className="flex items-center gap-2 md:gap-3 mb-6 sticky top-0 bg-[#2a1b38]/90 backdrop-blur pb-4 pt-4 -mx-4 md:-mx-6 px-4 md:px-6 z-20 overflow-x-auto no-scrollbar shadow-[0_24px_24px_rgba(18,18,18,0.2)]">
          {['All', 'Music', 'Podcasts', 'Audiobooks', 'Live Events'].map((filter, i) => (
            <button 
              key={filter} 
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors flex-shrink-0 ${i === 0 ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* AI DJ & Discovery */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 mt-2">
           <div className="bg-gradient-to-r from-blue-600 to-emerald-500 rounded-lg p-6 flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform h-48 relative overflow-hidden group">
              <div className="relative z-10">
                <span className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-white border border-white/20 flex w-fit items-center gap-2">
                  <Sparkles className="w-3 h-3" /> AI DJ
                </span>
                <h3 className="text-3xl font-bold text-white mt-4 drop-shadow-md">DJ Luminate</h3>
                <p className="text-white/80 mt-1 font-medium">Your personalized AI guide.</p>
              </div>
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/20 rounded-tl-full blur-2xl group-hover:bg-white/30 transition-colors"></div>
           </div>
           
           <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg p-6 flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform h-48 relative overflow-hidden group">
              <div className="relative z-10">
                <span className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-white border border-white/20 flex w-fit items-center gap-2">
                  <Settings2 className="w-3 h-3" /> Taste Profile
                </span>
                <h3 className="text-3xl font-bold text-white mt-4 drop-shadow-md">Refine Your Vibe</h3>
                <p className="text-white/80 mt-1 font-medium">Exclude kids' music & sleep sounds.</p>
              </div>
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/20 rounded-tl-full blur-2xl group-hover:bg-white/30 transition-colors"></div>
           </div>
        </div>

        {/* Top Playlists Grid (8 items) */}
        <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-2 md:gap-3 mb-8 px-0">
          <div 
            className="bg-white/10 hover:bg-white/20 transition-colors rounded flex items-center h-12 md:h-16 overflow-hidden cursor-pointer group relative"
            onClick={() => navigate('/collection')}
          >
             <div className="h-full aspect-square bg-gradient-to-br from-[#450af5] to-[#c4efd9] flex justify-center items-center flex-shrink-0 shadow-[8px_0_12px_rgba(0,0,0,0.3)]">
               <svg role="img" height="24" width="24" aria-hidden="true" viewBox="0 0 16 16" className="fill-white"><path d="M1.69 2A4.582 4.582 0 0 1 8 2.023 4.583 4.583 0 0 1 11.88.817h.002a4.618 4.618 0 0 1 3.782 3.65v.003a4.543 4.543 0 0 1-1.011 3.84L9.35 14.629a1.765 1.765 0 0 1-2.093.464 1.762 1.762 0 0 1-1.15-1.336l-5.321-6.19a4.544 4.544 0 0 1-1.006-3.837A4.619 4.619 0 0 1 1.69 2z"></path></svg>
             </div>
             <div className="px-3 md:px-4 font-bold text-white text-xs md:text-[15px] flex-1 truncate tracking-tight">Liked Songs</div>
             <div className="px-3 md:px-4 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                <button className="w-10 h-10 bg-[#1DB954] rounded-full flex items-center justify-center shadow-[0_8px_8px_rgba(0,0,0,0.3)] hover:scale-105 hover:bg-[#1ed760] active:scale-95 text-black">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current ml-1"><path d="M7 6v12l10-6z"></path></svg>
                </button>
             </div>
          </div>

          {[...tracks, tracks[0], tracks[1], tracks[2]].slice(0, 7).map((track, i) => (
            track && (
              <div 
                key={track.id + i} 
                className="bg-white/10 hover:bg-white/20 transition-colors rounded flex items-center h-12 md:h-16 overflow-hidden cursor-pointer group relative"
                onClick={() => playTrack(track, tracks)}
              >
                <img src={track.coverUrl} className="h-full aspect-square shadow-[8px_0_12px_rgba(0,0,0,0.3)] object-cover" alt="" />
                <div className="px-3 md:px-4 font-bold text-white text-xs md:text-[15px] flex-1 truncate tracking-tight">{track.title}</div>
                <div className="px-3 md:px-4 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                  <button onClick={(e) => { e.stopPropagation(); playTrack(track, tracks); }} className="w-10 h-10 bg-[#1DB954] rounded-full flex items-center justify-center shadow-[0_8px_8px_rgba(0,0,0,0.3)] hover:scale-105 hover:bg-[#1ed760] active:scale-95 text-black">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current ml-1"><path d="M7 6v12l10-6z"></path></svg>
                  </button>
                </div>
              </div>
            )
          ))}
        </div>

        {/* Made For You Section */}
        <div className="mb-8">
          <div className="flex items-end justify-between mb-4 mt-2">
            <h2 className="text-xl md:text-2xl font-bold text-white hover:underline cursor-pointer tracking-tight">It's New Music Friday!</h2>
            <span className="text-xs md:text-sm font-bold text-[#b3b3b3] hover:underline cursor-pointer tracking-wider">Show all</span>
          </div>
          <div className="flex overflow-x-auto snap-x custom-scrollbar pb-6 gap-6 md:grid md:grid-cols-3 lg:grid-cols-5 md:overflow-visible md:pb-0">
            <div className="bg-[#181818] p-4 rounded-md hover:bg-[#282828] transition-colors group cursor-pointer snap-start min-w-[160px]">
              <div className="w-full aspect-square mb-4 relative shadow-[0_8px_24px_rgba(0,0,0,0.5)] overflow-hidden rounded group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.6)]">
                 <img src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80" className="w-full h-full object-cover" />
                 <div className="absolute right-2 bottom-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <button className="w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 shadow-black/50">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-black"><path d="M7 6v12l10-6z"></path></svg>
                    </button>
                 </div>
              </div>
              <h3 className="text-white font-bold truncate mb-1">New Music Friday</h3>
              <p className="text-[#b3b3b3] text-sm line-clamp-2">New music from Taylor Swift, Steve Lacy, and more.</p>
            </div>
            
            <div className="bg-[#181818] p-4 rounded-md hover:bg-[#282828] transition-colors group cursor-pointer snap-start min-w-[160px]">
              <div className="w-full aspect-square mb-4 relative shadow-[0_8px_24px_rgba(0,0,0,0.5)] overflow-hidden rounded group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.6)]">
                 <img src="https://images.unsplash.com/photo-1493225457124-a1a2a5f529db?w=400&q=80" className="w-full h-full object-cover" />
                 <div className="absolute right-2 bottom-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <button className="w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 shadow-black/50">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-black"><path d="M7 6v12l10-6z"></path></svg>
                    </button>
                 </div>
              </div>
              <h3 className="text-white font-bold truncate mb-1">Release Radar</h3>
              <p className="text-[#b3b3b3] text-sm line-clamp-2">Catch all the latest music from artists you follow.</p>
            </div>

             {playlists.slice(0, 3).map(playlist => (
              <Card 
                key={playlist.id}
                id={playlist.id}
                type="playlist"
                title={playlist.name}
                description={playlist.description || 'Playlist • Spotify'}
                imageUrl={playlist.coverUrl}
                tracks={playlist.tracks}
              />
            ))}
          </div>
        </div>

        {/* Section: Albums */}
        <div className="mb-8">
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-white hover:underline cursor-pointer tracking-tight">Albums featuring songs you like</h2>
            <span className="text-xs md:text-sm font-bold text-[#b3b3b3] hover:underline cursor-pointer tracking-wider">Show all</span>
          </div>
          <div className="flex overflow-x-auto snap-x custom-scrollbar pb-6 gap-6 md:grid md:grid-cols-3 lg:grid-cols-5 md:overflow-visible md:pb-0">
            {albums.map((album) => (
               <Card 
                key={album.id}
                id={album.id}
                type="album"
                title={album.title}
                description={album.artist}
                imageUrl={album.coverUrl}
                tracks={tracks}
              />
            ))}
          </div>
        </div>

        {/* Social & Jams */}
        <div className="mb-8">
          <div className="flex items-end justify-between mb-4 border-t border-white/10 pt-6">
            <h2 className="text-xl md:text-2xl font-bold text-white hover:underline cursor-pointer tracking-tight">Collaborative & Shared</h2>
            <span className="text-xs md:text-sm font-bold text-[#b3b3b3] hover:underline cursor-pointer uppercase tracking-wider">Start a Jam</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            <div className="bg-[#181818] p-4 rounded-md hover:bg-[#282828] transition-colors group cursor-pointer border border-[#1DB954]/20 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-[#1DB954]/20 rounded-bl-full blur-xl"></div>
               <div className="w-12 h-12 bg-[#1DB954]/20 text-[#1DB954] rounded-full flex items-center justify-center mb-4">
                 <Radio className="w-6 h-6" />
               </div>
               <h3 className="text-white font-bold truncate mb-1">Spotify Jams</h3>
               <p className="text-[#b3b3b3] text-sm">Start a shared queue and listen together in real-time.</p>
            </div>
            
            <div className="bg-[#181818] p-4 rounded-md hover:bg-[#282828] transition-colors group cursor-pointer border border-blue-500/20 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/20 rounded-bl-full blur-xl"></div>
               <div className="w-full aspect-square mb-4 relative shadow-[0_8px_24px_rgba(0,0,0,0.5)] overflow-hidden rounded-full">
                  <div className="absolute inset-0 flex items-center justify-center bg-[#282828]">
                    <div className="flex -space-x-4">
                       <img className="w-16 h-16 rounded-full border-4 border-[#282828] z-20 bg-emerald-500" />
                       <img className="w-16 h-16 rounded-full border-4 border-[#282828] z-10 bg-pink-500" />
                    </div>
                  </div>
               </div>
               <h3 className="text-white font-bold truncate mb-1">Blend</h3>
               <p className="text-[#b3b3b3] text-sm">Algorithmically merge your musical tastes with friends.</p>
            </div>
          </div>
        </div>

        {/* Section: Concerts / Live Events */}
        <div className="mb-8">
          <div className="flex items-end justify-between mb-4 border-t border-white/10 pt-6">
            <h2 className="text-xl md:text-2xl font-bold text-white hover:underline cursor-pointer tracking-tight">Live Events Near You</h2>
            <span className="text-xs md:text-sm font-bold text-[#b3b3b3] hover:underline cursor-pointer uppercase tracking-wider">Discover Tours</span>
          </div>
          <div className="flex overflow-x-auto snap-x custom-scrollbar pb-6 gap-6 md:grid md:grid-cols-4 md:overflow-visible md:pb-0">
             <div className="bg-[#181818] p-4 rounded-md hover:bg-[#282828] transition-colors group cursor-pointer flex flex-col">
                <div className="w-full aspect-square bg-[#282828] rounded flex items-center justify-center mb-4">
                  <Calendar className="w-12 h-12 text-[#b3b3b3]" />
                </div>
                <h3 className="text-white font-bold truncate mb-1 text-lg">The Weeknd</h3>
                <p className="text-[#1DB954] text-sm font-medium">Oct 24 • Madison Square Garden</p>
                <p className="text-[#b3b3b3] text-xs mt-2">Merch available on artist page</p>
             </div>
             <div className="bg-[#181818] p-4 rounded-md hover:bg-[#282828] transition-colors group cursor-pointer flex flex-col">
                <div className="w-full aspect-square bg-[#282828] rounded flex items-center justify-center mb-4">
                  <Calendar className="w-12 h-12 text-[#b3b3b3]" />
                </div>
                <h3 className="text-white font-bold truncate mb-1 text-lg">M83 Live</h3>
                <p className="text-[#1DB954] text-sm font-medium">Nov 12 • Brooklyn Steel</p>
             </div>
             <div className="bg-[#181818] p-4 rounded-md hover:bg-[#282828] transition-colors group cursor-pointer flex flex-col">
                <div className="w-full aspect-square bg-[#282828] rounded flex items-center justify-center mb-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-blue-900/40"></div>
                  <Calendar className="w-12 h-12 text-[#b3b3b3] relative z-10" />
                </div>
                <h3 className="text-white font-bold truncate mb-1 text-lg">Digital Concerts</h3>
                <p className="text-[#1DB954] text-sm font-medium">Live from anywhere</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const currentHour = new Date().getHours();
  if (currentHour < 12) return 'Good morning';
  if (currentHour < 18) return 'Good afternoon';
  return 'Good evening';
}
