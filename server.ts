import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import YTMusic from "ytmusic-api";
import ytdl from "@distube/ytdl-core";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

const ytmusic = new YTMusic();
ytmusic.initialize().catch(err => console.error("YTMusic Init Error:", err));

// Search Endpoint
app.get("/api/search", async (req, res) => {
  const query = req.query.q as string;
  if (!query) return res.json([]);

  try {
    const songs = await ytmusic.searchSongs(query);
    
    // Convert YTMusic results to our Track format
    const results = songs.slice(0, 15).map((song: any) => {
      const durMatch = song.duration;
      let durStr = "00:00";
      if (durMatch && typeof durMatch === 'number') {
        const m = Math.floor(durMatch / 60);
        const s = durMatch % 60;
        durStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      } else if (durMatch && typeof durMatch === 'string') {
        durStr = durMatch;
      }

      return {
        id: song.videoId,
        title: song.name,
        artist: song.artist?.name || 'Unknown Artist',
        album: song.album?.name || '',
        duration: durStr,
        audioUrl: `/api/stream/${song.videoId}`,
        coverUrl: song.thumbnails?.[1]?.url || song.thumbnails?.[0]?.url || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=300',
        uri: `yt:track:${song.videoId}`
      };
    });

    res.json(results);
  } catch (error: any) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to search" });
  }
});

app.get("/api/stream/:videoId", async (req, res) => {
  const videoId = req.params.videoId;
  try {
    res.setHeader('Content-Type', 'audio/mpeg');
    ytdl(`https://www.youtube.com/watch?v=${videoId}`, { filter: 'audioonly', quality: 'highestaudio' })
      .on('error', (err) => {
         console.warn("ytdl error:", err);
      })
      .pipe(res);
  } catch (err) {
    console.warn("Stream API error:", err);
    res.status(500).send("Error streaming audio");
  }
});

// Provide Preview Data API
app.get("/api/tracks", async (req, res) => {
  try {
    // Initial fetch for dashboard using YT Music
    const songs1 = await ytmusic.searchSongs("Top 50 Global Songs 2024");
    const songs2 = await ytmusic.searchSongs("Billboard Top 100 Hits");
    const songs = [...songs1.slice(0, 15), ...songs2.slice(0, 15)];
    const results = songs.map((song: any) => {
      const durMatch = song.duration;
      let durStr = "00:00";
      if (typeof durMatch === 'number') {
        const m = Math.floor(durMatch / 60);
        const s = durMatch % 60;
        durStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      }
      return {
        id: song.videoId,
        title: song.name,
        artist: song.artist?.name || 'Unknown',
        album: song.album?.name || '',
        duration: durStr,
        audioUrl: `/api/stream/${song.videoId}`,
        coverUrl: song.thumbnails?.[1]?.url || song.thumbnails?.[0]?.url || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=300',
        uri: `yt:track:${song.videoId}`
      };
    });
    res.json(results);
  } catch (e) {
    console.warn("Failed to fetch initial tracks:", e);
    res.json([]);
  }
});

app.get("/api/auth/url", (req, res) => {
  const redirectUri = req.query.redirect_uri as string;

  const scopes = [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-library-read',
  ].join(' ');
  
  const query = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID || '',
    scope: scopes,
    redirect_uri: redirectUri,
  });

  res.json({ url: `https://accounts.spotify.com/authorize?${query.toString()}` });
});

app.post("/api/refresh", async (req, res) => {
  const refresh_token = req.body?.refresh_token;
  if (!refresh_token) return res.status(400).json({ error: "Missing refresh_token" });
  try {
    const authOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        })
    };
    const response = await fetch('https://accounts.spotify.com/api/token', authOptions);
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/callback", async (req, res) => {
  const code = req.query.code as string;
  const redirect_uri = `https://${req.get('host')}/api/callback`;
  
  if (!code) {
      return res.redirect("/?error=missing_code");
  }

  try {
    const authOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirect_uri
        })
    };
    const response = await fetch('https://accounts.spotify.com/api/token', authOptions);
    const data = await response.json();
    
    if (data.error) {
        return res.redirect(`/?error=${data.error}`);
    }

    const { access_token, refresh_token, expires_in } = data;
    const expires_at = Date.now() + expires_in * 1000;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head><title>Spotify Login</title></head>
      <body>
        <script>
          localStorage.setItem('spotify_access_token', '${access_token}');
          localStorage.setItem('spotify_refresh_token', '${refresh_token}');
          localStorage.setItem('spotify_expires_at', '${expires_at}');
          // If opened in popup, message opener. If redirected, redirect back
          if (window.opener) {
             window.opener.postMessage({ type: 'SPOTIFY_AUTH_SUCCESS', access_token: '${access_token}', refresh_token: '${refresh_token}', expires_in: ${expires_in} }, '*');
             window.close();
          } else {
             window.location.href = '/';
          }
        </script>
      </body>
      </html>
    `;
    res.send(html);
  } catch (err: any) {
    res.redirect("/?error=auth_failed");
  }
});

// Setup Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();
