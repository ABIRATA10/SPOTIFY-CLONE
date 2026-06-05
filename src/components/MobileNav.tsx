import { Home, Search, Library } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function MobileNav() {
  const location = useLocation();
  
  return (
    <div className="md:hidden flex items-center justify-around bg-gradient-to-t from-black/95 to-black/80 backdrop-blur-xl border-t border-white/5 flex-shrink-0 h-[64px] w-full pb-[env(safe-area-inset-bottom)] z-50 fixed bottom-0 left-0">
      <Link to="/" className={`flex flex-col items-center gap-1.5 transition-colors ${location.pathname === '/' ? 'text-white' : 'text-[#b3b3b3]'}`}>
        <Home className={`w-6 h-6 ${location.pathname === '/' ? 'fill-current' : ''}`} />
        <span className="text-[10px] font-medium tracking-wide">Home</span>
      </Link>
      <Link to="/search" className={`flex flex-col items-center gap-1.5 transition-colors ${location.pathname === '/search' ? 'text-white' : 'text-[#b3b3b3]'}`}>
        <Search className={`w-6 h-6 ${location.pathname === '/search' ? 'fill-current' : ''}`} />
        <span className="text-[10px] font-medium tracking-wide">Search</span>
      </Link>
      <Link to="/collection" className={`flex flex-col items-center gap-1.5 transition-colors ${location.pathname === '/collection' ? 'text-white' : 'text-[#b3b3b3]'}`}>
        <Library className={`w-6 h-6 ${location.pathname === '/collection' ? 'fill-current' : ''}`} />
        <span className="text-[10px] font-medium tracking-wide">Your Library</span>
      </Link>
    </div>
  );
}
