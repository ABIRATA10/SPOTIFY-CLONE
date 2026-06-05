import { X, MoreHorizontal, UserPlus, CheckCircle2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export default function RightSidebar() {
  const { currentTrack, likedTrackIds, toggleLike } = usePlayer();

  if (!currentTrack) {
    return (
      <div className="w-[320px] bg-[#121212] rounded-lg hidden lg:flex flex-col overflow-hidden min-h-full items-center justify-center text-[#b3b3b3] p-6 text-center">
        <h3 className="font-bold text-white mb-2">Let's find some podcasts to follow</h3>
        <p className="text-sm">We'll keep you updated on new episodes</p>
        <button className="mt-8 bg-white text-black font-bold rounded-full px-6 py-2">Browse podcasts</button>
      </div>
    );
  }

  return (
    <div className="w-[340px] bg-[#121212] rounded-lg hidden xl:flex flex-col overflow-hidden min-h-full">
      <div className="p-4 flex items-center justify-between">
        <h2 className="text-white font-bold text-sm tracking-wide">Liked Songs</h2>
        <div className="flex items-center gap-3">
          <MoreHorizontal className="w-5 h-5 text-[#b3b3b3] hover:text-white cursor-pointer transition-colors" />
          <X className="w-5 h-5 text-[#b3b3b3] hover:text-white cursor-pointer transition-colors" />
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
        <div className="w-full aspect-square mb-4 shadow-[0_8px_24px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden relative group">
          <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
        </div>

        <div className="flex items-start justify-between mt-2 mb-8">
          <div className="flex flex-col pr-4 overflow-hidden">
            <h1 className="text-white font-bold text-2xl truncate hover:underline cursor-pointer">{currentTrack.title}</h1>
            <span className="text-[#b3b3b3] hover:underline cursor-pointer truncate mt-1">{currentTrack.artist}</span>
          </div>
          <button onClick={() => toggleLike(currentTrack.id)} className="text-white transition-colors flex-shrink-0 mt-1">
             {likedTrackIds.has(currentTrack.id) ? (
               <CheckCircle2 className="w-6 h-6 text-[#1DB954] fill-[#1DB954] bg-black rounded-full shadow-[0_0_0_2px_black]" />
             ) : (
               <div className="w-6 h-6 rounded-full border-2 border-[#b3b3b3] hover:border-white hover:scale-105 flex items-center justify-center">
                 <svg role="img" height="12" width="12" aria-hidden="true" viewBox="0 0 16 16" fill="currentColor" className="text-[#b3b3b3] hover:text-white"><path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"></path><path d="M11.75 8a.75.75 0 0 1-.75.75H8.75V11.5a.75.75 0 0 1-1.5 0V8.75H4.5a.75.75 0 0 1 0-1.5h2.75V4.5a.75.75 0 0 1 1.5 0v2.75H11a.75.75 0 0 1 .75.75z"></path></svg>
               </div>
             )}
          </button>
        </div>

        {/* About the artist card */}
        <div className="bg-[#282828] rounded-lg overflow-hidden group cursor-pointer relative mt-4 group">
          <div className="h-40 w-full relative">
             <img src={currentTrack.coverUrl} className="w-full h-full object-cover brightness-75 group-hover:brightness-100 transition-all duration-300" alt={currentTrack.artist} />
             <div className="absolute top-4 left-4 font-bold text-white tracking-wide">About the artist</div>
          </div>
          <div className="p-4 flex flex-col gap-2">
            <h3 className="text-white font-bold text-[15px] hover:underline flex items-center gap-1">
              {currentTrack.artist}
              <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                 <svg viewBox="0 0 24 24" className="w-2 h-2 fill-white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"></path></svg>
              </div>
            </h3>
            <div className="flex items-center justify-between w-full">
              <span className="text-[#b3b3b3] text-sm">49,42,459<br/>monthly listeners</span>
              <button className="border border-white/30 text-white rounded-full px-4 py-1.5 text-xs font-bold hover:border-white hover:scale-105 transition-all">Follow</button>
            </div>
            <p className="text-[#b3b3b3] text-sm line-clamp-3 mt-2 leading-tight">
               {currentTrack.artist} : Un artiste incontournable de la scène POP URBAINE qui casse tous les code...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
