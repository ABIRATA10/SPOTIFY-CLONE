import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  audioUrl: string;
  durationMs: number;
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  tracks: Track[];
}

interface Album {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
}

const mockTracks: Track[] = [
  {
    id: '1',
    title: 'Midnight City',
    artist: 'M83',
    album: "Hurry Up, We're Dreaming",
    coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    durationMs: 372000,
  },
  {
    id: '2',
    title: 'Starboy',
    artist: 'The Weeknd',
    album: 'Starboy',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300&auto=format&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    durationMs: 422000,
  },
  {
    id: '3',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    durationMs: 344000,
  },
  {
    id: '4',
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    coverUrl: 'https://images.unsplash.com/photo-1516280440502-37f8e56c52bb?q=80&w=300&auto=format&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    durationMs: 297000,
  },
  {
    id: '5',
    title: 'As It Was',
    artist: 'Harry Styles',
    album: "Harry's House",
    coverUrl: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f54a?q=80&w=300&auto=format&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    durationMs: 350000,
  }
];

const mockAlbums: Album[] = [
  {
    id: 'a1',
    title: 'Midnight Vibes',
    artist: 'Various Artists',
    coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'a2',
    title: 'Neon Nights',
    artist: 'Synthwave Kings',
    coverUrl: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'a3',
    title: 'Chill Lofi Study',
    artist: 'Lofi Girl',
    coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'a4',
    title: 'Acoustic Covers',
    artist: 'Coffeehouse',
    coverUrl: 'https://images.unsplash.com/photo-1460036521480-ff49c08c2781?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'a5',
    title: 'Deep Focus',
    artist: 'Ambient Soundscapes',
    coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=300&auto=format&fit=crop',
  }
];

let myPlaylists: Playlist[] = [
  {
    id: 'p1',
    name: 'Top Hits 2026',
    description: 'The biggest songs right now.',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300&auto=format&fit=crop',
    tracks: mockTracks.slice(0, 3)
  },
  {
    id: 'p2',
    name: 'Discover Weekly',
    description: 'New music based on what you love.',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop',
    tracks: mockTracks.slice(2, 5)
  },
  {
    id: 'p3',
    name: 'Liked Songs',
    description: '',
    coverUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=300&auto=format&fit=crop',
    tracks: mockTracks
  }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/tracks", (req, res) => {
    res.json(mockTracks);
  });

  app.get("/api/albums", (req, res) => {
    res.json(mockAlbums);
  });

  app.get("/api/playlists", (req, res) => {
    res.json(myPlaylists);
  });

  app.get("/api/playlists/:id", (req, res) => {
    const playlist = myPlaylists.find(p => p.id === req.params.id);
    if (playlist) {
      res.json(playlist);
    } else {
      res.status(404).json({ error: "Playlist not found" });
    }
  });

  app.post("/api/playlists/generate", async (req, res) => {
    try {
      const { prompt } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is missing. Configure it in settings."});
      }
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are an AI DJ for a music app. Generate a playlist of 5 real songs based on this user prompt: "${prompt}". 
        Respond ONLY with a JSON array of objects. Do not use markdown blocks.
        Format: [{"title": "song", "artist": "artist", "album": "album"}]`
      });

      let text = response.text || "[]";
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const songs = JSON.parse(text);

      const tracks = songs.map((s: any, i: number) => ({
        id: `ai-${Date.now()}-${i}`,
        title: s.title,
        artist: s.artist,
        album: s.album,
        coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop', // generic AI cover
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // default mock audio
        durationMs: 180000 + Math.floor(Math.random() * 60000)
      }));

      const newPlaylist = {
        id: `p-ai-${Date.now()}`,
        name: `AI: ${prompt.substring(0, 20)}`,
        description: `Generated seamlessly by AI DJ matching: "${prompt}"`,
        coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=300&auto=format&fit=crop',
        tracks
      };

      myPlaylists.unshift(newPlaylist); // Add to top
      res.json(newPlaylist);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Failed to generate playlist" });
    }
  });

  // Vite development middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
