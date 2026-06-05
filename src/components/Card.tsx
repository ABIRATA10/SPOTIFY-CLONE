import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { Track } from '../types';
import { usePlayer } from '../context/PlayerContext';

interface CardProps {
  id?: string;
  type?: 'playlist' | 'album' | 'track';
  title: string;
  description: string;
  imageUrl: string;
  trackContext?: Track;
  tracks?: Track[];
}

export default function Card({ id, type, title, description, imageUrl, trackContext, tracks }: CardProps) {
  const { playTrack } = usePlayer();
  const navigate = useNavigate();

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent navigation when play is clicked
    if (trackContext) {
      playTrack(trackContext, [trackContext]);
    } else if (tracks && tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  const handleCardClick = () => {
    if (type === 'playlist' && id) {
      navigate(`/playlist/${id}`);
    } else if (type === 'album' && id) {
      // Assuming album view is same as playlist view for now, or just play
      if (tracks && tracks.length > 0) playTrack(tracks[0], tracks);
    } else if (type === 'track' && trackContext) {
       playTrack(trackContext, [trackContext]);
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-[#181818] p-4 rounded-md hover:bg-[#282828] transition-colors group cursor-pointer relative flex flex-col"
    >
      <div className="relative w-full aspect-square mb-4 shadow-lg rounded-md overflow-hidden">
        <img src={imageUrl} alt={title} className="object-cover w-full h-full" loading="lazy" />
        <button 
          onClick={handlePlayClick}
          className="absolute bottom-2 right-2 w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 shadow-xl hover:scale-105 hover:bg-[#1ed760] transition-all z-10"
        >
          <Play className="w-6 h-6 fill-black text-black ml-1" />
        </button>
      </div>
      <h3 className="text-white font-bold truncate mb-1">{title}</h3>
      <p className="text-[#b3b3b3] text-sm line-clamp-2">{description}</p>
    </div>
  );
}
