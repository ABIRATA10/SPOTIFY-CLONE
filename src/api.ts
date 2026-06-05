import { Track, Playlist, Album } from './types';

export const fetchTracks = async (): Promise<Track[]> => {
  const response = await fetch('/api/tracks');
  if (!response.ok) throw new Error('Failed to fetch tracks');
  return response.json();
};

export const fetchAlbums = async (): Promise<Album[]> => {
  const response = await fetch('/api/albums');
  if (!response.ok) throw new Error('Failed to fetch albums');
  return response.json();
};

export const fetchPlaylists = async (): Promise<Playlist[]> => {
  const response = await fetch('/api/playlists');
  if (!response.ok) throw new Error('Failed to fetch playlists');
  return response.json();
};

export const generatePlaylist = async (prompt: string): Promise<Playlist> => {
  const response = await fetch('/api/playlists/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to generate playlist');
  }
  return response.json();
};
