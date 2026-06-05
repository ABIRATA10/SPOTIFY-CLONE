import { ChevronLeft, ChevronRight, Home, Search, Bell, Users, Folder } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function GlobalTopBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="h-16 flex items-center justify-between px-4 z-50 bg-black flex-shrink-0 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center w-[300px] gap-2">
        <button className="w-8 h-8 flex items-center justify-center text-[#b3b3b3] hover:text-white disabled:opacity-50" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button className="w-8 h-8 flex items-center justify-center text-[#b3b3b3] hover:text-white disabled:opacity-50" onClick={() => navigate(1)}>
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 max-w-[500px] flex items-center gap-2">
        <button onClick={() => navigate('/')} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${location.pathname === '/' ? 'bg-[#333]' : 'bg-[#1f1f1f] hover:bg-[#333]'}`}>
          <Home className={`w-6 h-6 ${location.pathname === '/' ? 'text-white' : 'text-[#b3b3b3]'}`} />
        </button>
        <div className="flex-1 bg-[#1f1f1f] hover:bg-[#2a2a2a] transition-colors rounded-full h-12 flex items-center px-4 group border border-transparent focus-within:bg-[#2a2a2a] focus-within:border-white/20">
          <Search className="w-6 h-6 text-[#b3b3b3] group-focus-within:text-white mr-3 flex-shrink-0" />
          <input 
            type="text" 
            placeholder="What do you want to play?" 
            className="bg-transparent border-none outline-none text-white w-full placeholder-[#b3b3b3] font-medium"
            onFocus={() => navigate('/search')}
          />
          <div className="w-px h-6 bg-white/20 mx-3 hidden md:block"></div>
          <Folder className="w-5 h-5 text-[#b3b3b3] hover:text-white cursor-pointer hidden md:block flex-shrink-0" />
        </div>
      </div>

      <div className="flex items-center justify-end w-[300px] gap-6">
        <button className="text-[#b3b3b3] hover:text-white hover:scale-105 transition-all hidden md:block">
          <Bell className="w-4 h-4" />
        </button>
        <button className="text-[#b3b3b3] hover:text-white hover:scale-105 transition-all hidden md:block">
          <Users className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 rounded-full bg-[#f6b4d3] flex items-center justify-center text-black font-bold hover:scale-105 transition-transform flex-shrink-0 mr-2 md:mr-0">
          A
        </button>
      </div>
    </div>
  );
}
