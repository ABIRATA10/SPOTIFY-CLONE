import { X, Volume2, HardDrive, Lock, MonitorSpeaker } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
      <div className="bg-[#181818] w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-white/10">
        <div className="p-6 flex items-center justify-between border-b border-white/10">
          <h2 className="text-2xl font-bold text-white tracking-tight">Settings</h2>
          <button onClick={onClose} className="text-[#b3b3b3] hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-8 text-[#b3b3b3] text-sm md:text-base">
          {/* Audio Quality */}
          <section>
            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Volume2 className="w-5 h-5"/> Audio Quality</h3>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span>Streaming quality</span>
              <select className="bg-[#282828] text-white border border-white/10 rounded px-2 py-1 outline-none font-medium">
                <option>Low (24kbps)</option>
                <option>Normal (96kbps)</option>
                <option>High (160kbps)</option>
                <option defaultValue="Very High (320kbps)">Very High (320kbps)</option>
                <option>Lossless (24-bit/44.1 kHz FLAC)</option>
              </select>
            </div>
            <div className="flex items-center justify-between py-4 border-b border-white/5">
              <div>
                <div className="text-white font-medium">Normalize volume</div>
                <div className="text-xs mt-1">Set the same volume level for all songs.</div>
              </div>
              <SlottedSwitch active />
            </div>
          </section>

          {/* Playback */}
          <section>
            <h3 className="text-white font-bold mb-4">Playback</h3>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div>
                <div className="text-white font-medium">Crossfade songs</div>
                <div className="text-xs mt-1">Allows you to crossfade between songs.</div>
              </div>
              <SlottedSwitch active />
            </div>
            <div className="flex items-center gap-4 py-3 border-b border-white/5">
               <span className="text-xs">0s</span>
               <input type="range" className="flex-1 accent-[#1DB954]" min="0" max="12" defaultValue="4" />
               <span className="text-xs">12s</span>
            </div>
            <div className="flex items-center justify-between py-4 border-b border-white/5">
              <div>
                <div className="text-white font-medium">Gapless Playback</div>
                <div className="text-xs mt-1">Allows gapless playback.</div>
              </div>
              <SlottedSwitch active />
            </div>
            <div className="flex items-center justify-between py-4 border-b border-white/5">
              <div>
                <div className="text-white font-medium">Smart Shuffle</div>
                <div className="text-xs mt-1">Interlace your queue with related recommendations.</div>
              </div>
              <SlottedSwitch />
            </div>
          </section>

          {/* Social & Privacy */}
          <section>
            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Lock className="w-5 h-5"/> Social & Privacy</h3>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div>
                <div className="text-white font-medium">Private session</div>
                <div className="text-xs mt-1">Temporarily hide your listening activity from followers and taste profile.</div>
              </div>
              <SlottedSwitch />
            </div>
          </section>

          {/* Local Files */}
          <section>
            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><HardDrive className="w-5 h-5"/> Local Files</h3>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div>
                <div className="text-white font-medium">Show Local Files</div>
                <div className="text-xs mt-1">Add tracks from your computer to Your Library.</div>
              </div>
              <SlottedSwitch />
            </div>
          </section>

          {/* Devices */}
          <section>
            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><MonitorSpeaker className="w-5 h-5"/> Devices</h3>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div>
                <div className="text-white font-medium">Spotify Connect</div>
                <div className="text-xs mt-1">Listen on another device.</div>
              </div>
              <button className="bg-white text-black px-4 py-1 rounded-full font-bold text-xs hover:scale-105">Devices Menu</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SlottedSwitch({ active = false }: { active?: boolean }) {
  return (
    <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${active ? 'bg-[#1DB954]' : 'bg-[#535353]'}`}>
      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${active ? 'right-0.5' : 'left-0.5'}`}></div>
    </div>
  );
}
