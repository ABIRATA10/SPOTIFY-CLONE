export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  audioUrl: string;
  durationMs: number;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  tracks: Track[];
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
}
