/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MainView from './components/MainView';
import Player from './components/Player';
import SearchView from './components/SearchView';
import LibraryView from './components/LibraryView';
import PlaylistView from './components/PlaylistView';
import RightSidebar from './components/RightSidebar';
import MobileNav from './components/MobileNav';
import GlobalTopBar from './components/GlobalTopBar';
import { PlayerProvider } from './context/PlayerContext';

export default function App() {
  return (
    <PlayerProvider>
      <BrowserRouter>
        <div className="h-[100dvh] w-screen bg-black overflow-hidden flex flex-col font-sans select-none text-white relative">
          <GlobalTopBar />
          <div className="flex flex-1 overflow-hidden md:px-2 md:pb-2 gap-2 h-full z-0">
            <Sidebar />
            <div className="flex-1 bg-[#121212] md:rounded-lg overflow-hidden relative border-none flex flex-col z-0">
              <Routes>
                <Route path="/" element={<MainView />} />
                <Route path="/search" element={<SearchView />} />
                <Route path="/collection" element={<LibraryView />} />
                <Route path="/playlist/:id" element={<PlaylistView />} />
              </Routes>
            </div>
            <RightSidebar />
          </div>
          <div className="w-full flex-shrink-0 z-40 bg-black pb-[64px] md:pb-0 relative">
            <Player />
            <MobileNav />
          </div>
        </div>
      </BrowserRouter>
    </PlayerProvider>
  );
}
