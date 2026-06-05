import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Library, Plus, ArrowRight, List, Sparkles, Pin } from 'lucide-react';
import { Playlist } from '../types';
import { fetchPlaylists, generatePlaylist } from '../api';
import { usePlayer } from '../context/PlayerContext';

export default function Sidebar() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const location = useLocation();
  const { likedTrackIds } = usePlayer();

  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  useEffect(() => {
    fetchPlaylists().then(setPlaylists).catch(console.error);
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const newPlaylist = await generatePlaylist(aiPrompt);
      setPlaylists(prev => [newPlaylist, ...prev]);
      setShowAiModal(false);
      setAiPrompt("");
    } catch (err) {
      alert("Failed to generate AI playlist. Ensure your API Key is set.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-[300px] lg:w-[350px] xl:w-[400px] hidden md:flex flex-col h-full flex-shrink-0">
      {/* Library Block */}
      <div className="bg-[#121212] rounded-lg flex-1 flex flex-col overflow-hidden relative">
        <div className="pt-4 px-4 pb-2 z-10 sticky top-0 bg-[#121212]">
          <div className="flex items-center justify-between text-[#b3b3b3] font-bold pb-2">
             <button className="flex items-center gap-3 hover:text-white transition-colors cursor-pointer group">
               <svg role="img" height="24" width="24" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="group-hover:text-white"><path d="M3 22a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v18a1 1 0 0 1-1 1zM15.5 2.134A1 1 0 0 0 14 3v18a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6.464a1 1 0 0 0-.5-.866l-6-3.464zM9 2a1 1 0 0 0-1 1v18a1 1 0 1 0 2 0V3a1 1 0 0 0-1-1z"></path></svg>
               Your Library
             </button>
             <div className="flex items-center gap-2">
               <button 
                 onClick={() => setShowAiModal(true)}
                 className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#1a1a1a] hover:text-white transition-colors"
                 title="AI Playlist Generator"
               >
                 <Sparkles className="w-4 h-4 text-purple-400" />
               </button>
               <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#1a1a1a] hover:text-white transition-colors">
                 <Plus className="w-5 h-5" />
               </button>
               <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#1a1a1a] hover:text-white transition-colors">
                 <ArrowRight className="w-5 h-5" />
               </button>
             </div>
          </div>
          
          <div className="flex gap-2 mt-4 overflow-x-hidden pb-1">
            <span className="bg-[#2a2a2a] text-white px-3 py-1.5 rounded-full text-sm font-semibold hover:bg-[#333] cursor-pointer active:scale-95 transition-transform border border-transparent hover:border-white/20">Playlists</span>
            <span className="bg-[#2a2a2a] text-white px-3 py-1.5 rounded-full text-sm font-semibold hover:bg-[#333] cursor-pointer active:scale-95 transition-transform border border-transparent hover:border-white/20">Albums</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="sticky top-0 bg-[#121212]/95 backdrop-blur z-10 px-4 py-2 flex items-center justify-between text-[#b3b3b3] text-sm shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
            <button className="hover:text-white hover:bg-[#1a1a1a] rounded-full p-1.5"><svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16" fill="currentColor"><path d="M7 1.75a5.25 5.25 0 1 0 0 10.5 5.25 5.25 0 0 0 0-10.5zM.25 7a6.75 6.75 0 1 1 12.096 4.12l3.184 3.185a.75.75 0 1 1-1.06 1.06l-3.185-3.184A6.75 6.75 0 0 1 .25 7z"></path></svg></button>
            <button className="flex items-center gap-1 hover:text-white font-semibold hover:scale-105 transition-transform text-[13px]">Recents <List className="w-4 h-4 ml-1" /></button>
          </div>

          <ul className="space-y-0.5 px-2 py-1 pb-4">
            {/* Hardcoded Liked Songs */}
            <li>
              <Link to={`/collection`} className={`flex items-center gap-3 p-2 rounded-md transition-colors ${location.pathname === `/collection` ? 'bg-[#2a2a2a]' : 'hover:bg-[#1a1a1a]'}`}>
                <div className="w-12 h-12 rounded bg-gradient-to-br from-[#450af5] to-[#c4efd9] flex justify-center items-center flex-shrink-0 shadow-md">
                   <svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16" className="fill-white"><path d="M1.69 2A4.582 4.582 0 0 1 8 2.023 4.583 4.583 0 0 1 11.88.817h.002a4.618 4.618 0 0 1 3.782 3.65v.003a4.543 4.543 0 0 1-1.011 3.84L9.35 14.629a1.765 1.765 0 0 1-2.093.464 1.762 1.762 0 0 1-1.15-1.336l-5.321-6.19a4.544 4.544 0 0 1-1.006-3.837A4.619 4.619 0 0 1 1.69 2z"></path></svg>
                </div>
                <div className="flex flex-col flex-1 overflow-hidden">
                  <span className={`truncate text-[15px] font-bold ${location.pathname === `/collection` ? 'text-[#1DB954]' : 'text-white'}`}>
                    Liked Songs
                  </span>
                  <span className="truncate text-[13px] text-[#b3b3b3] flex items-center gap-1">
                    <Pin className="w-3 h-3 text-[#1DB954] fill-[#1DB954] rotate-45" /> Playlist • {likedTrackIds.size} songs
                  </span>
                </div>
              </Link>
            </li>

            {playlists.map((playlist, idx) => (
              <li key={playlist.id}>
                <Link to={`/playlist/${playlist.id}`} className={`flex items-center gap-3 p-2 rounded-md transition-colors ${location.pathname === `/playlist/${playlist.id}` ? 'bg-[#2a2a2a]' : 'hover:bg-[#1a1a1a]'}`}>
                  <img src={playlist.coverUrl} className={`w-12 h-12 object-cover shadow-sm flex-shrink-0 ${idx % 3 === 0 ? 'rounded-full' : 'rounded'}`} alt={playlist.name} />
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <span className={`truncate text-[15px] font-bold ${location.pathname === `/playlist/${playlist.id}` ? 'text-[#1DB954]' : 'text-white'}`}>
                      {playlist.name}
                    </span>
                    <span className="truncate text-[13px] text-[#b3b3b3] flex items-center gap-1">
                      {idx < 2 && <Pin className="w-3 h-3 text-[#1DB954] fill-[#1DB954] rotate-45" />} {idx % 3 === 0 ? 'Artist' : 'Playlist'} • {playlist.name.startsWith('AI') ? 'AI DJ' : 'Spotify'}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* AI Modal */}
        {showAiModal && (
          <div className="absolute top-14 left-4 right-4 bg-[#282828] border border-white/10 rounded-lg p-4 shadow-2xl z-50">
            <h3 className="text-white font-bold mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-400"/> AI Playlist Generator</h3>
            <form onSubmit={handleGenerate} className="flex flex-col gap-3">
              <textarea 
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="e.g. upbeat songs for a road trip"
                className="w-full bg-[#121212] border border-white/10 rounded p-2 text-sm text-white focus:outline-none focus:border-white/30 resize-none h-20"
              />
              <div className="flex justify-end gap-2">
                 <button type="button" onClick={() => setShowAiModal(false)} className="px-3 py-1.5 text-xs text-white hover:bg-white/10 rounded-full font-bold">Cancel</button>
                 <button type="submit" disabled={isGenerating || !aiPrompt} className="px-4 py-1.5 bg-white text-black text-xs rounded-full font-bold hover:scale-105 disabled:opacity-50 disabled:scale-100">
                   {isGenerating ? 'Generating...' : 'Create'}
                 </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
