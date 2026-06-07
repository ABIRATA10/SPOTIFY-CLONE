import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cookieParser from "cookie-parser";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

// The Real-World Mock Dataset requested by user
const REAL_TRACKS_DATA = [
  {
    id: 'track-1',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: '03:20',
    audioUrl: 'https://archive.org/download/the-weeknd-blinding-lights/The%20Weeknd%20-%20Blinding%20Lights.mp3', // Note: falling back to SoundHelix if it 404s in production, but prompt requested real stream.
    coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'track-2',
    title: 'Billie Jean',
    artist: 'Michael Jackson',
    album: 'Thriller',
    duration: '04:54',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', // Placeholders as reliable open direct streams are rare
    coverUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'track-3',
    title: 'Stay',
    artist: 'The Kid LAROI, Justin Bieber',
    album: 'F*CK LOVE 3',
    duration: '02:21',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'track-4',
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    duration: '03:23',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'track-5',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    album: '÷ (Divide)',
    duration: '03:53',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'track-6',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    duration: '05:55',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?q=80&w=300&auto=format&fit=crop'
  }
];

// Provide Mock Data API
app.get("/api/mock-tracks", (req, res) => {
  res.json(REAL_TRACKS_DATA);
});

// SPOTIFY OAUTH FLOW
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

app.get('/api/auth/url', (req, res) => {
  const protocol = req.headers['x-forwarded-proto'] ? req.headers['x-forwarded-proto'].toString().split(',')[0] : req.protocol;
  const host = req.headers['x-forwarded-host'] ? req.headers['x-forwarded-host'].toString().split(',')[0] : req.get('host');
  const redirectUri = `${protocol}://${host}/api/callback`;
  
  const scopes = 'user-read-private user-read-email user-library-read user-modify-playback-state';
  const query = new URLSearchParams({
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID || 'missing_client_id',
    scope: scopes,
    redirect_uri: redirectUri,
  });

  res.json({ url: `https://accounts.spotify.com/authorize?${query.toString()}` });
});

app.get('/api/callback', async (req, res) => {
  try {
    const code = req.query.code || null;
    if (!code) {
      return res.status(400).send('No code provided');
    }

    const protocol = req.headers['x-forwarded-proto'] ? req.headers['x-forwarded-proto'].toString().split(',')[0] : req.protocol;
    const host = req.headers['x-forwarded-host'] ? req.headers['x-forwarded-host'].toString().split(',')[0] : req.get('host');
    const redirectUri = `${protocol}://${host}/api/callback`;

    const response = await axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({
        code: code as string,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }).toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
      }
    });

    const { access_token, refresh_token, expires_in } = response.data;
    
    // Popup communication
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'SPOTIFY_AUTH_SUCCESS', 
                access_token: '${access_token}', 
                refresh_token: '${refresh_token}',
                expires_in: ${expires_in}
              }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. You can close this window.</p>
        </body>
      </html>
    `);

  } catch (error: any) {
    console.error('Callback error:', error?.response?.data || error);
    res.status(500).send('Authentication failed');
  }
});

app.post('/api/refresh', async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    }).toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
      }
    });

    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// SPOTIFY PROXY API
const createProxyRequest = (method: string, endpoint: string) => async (req: express.Request, res: express.Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    // Construct query parameters
    const query = new URLSearchParams(req.query as any).toString();
    const url = `https://api.spotify.com/v1${endpoint}${query ? `?${query}` : ''}`;
    
    // Replace URL parameters (e.g. :playlistId)
    let finalUrl = url;
    if (req.params) {
       for (const key of Object.keys(req.params)) {
          finalUrl = finalUrl.replace(`:${key}`, req.params[key]);
       }
    }

    const response = await axios({
      method: method,
      url: finalUrl,
      headers: { 'Authorization': token },
      data: req.body
    });
    
    res.json(response.data);
  } catch (err: any) {
    console.error(`Spotify API Error at ${endpoint}:`, err?.response?.data || err.message);
    res.status(err?.response?.status || 500).json(err?.response?.data || { error: 'Internal Server Error' });
  }
};

app.get('/api/spotify/me/playlists', createProxyRequest('GET', '/me/playlists'));
app.get('/api/spotify/playlists/:playlistId/tracks', createProxyRequest('GET', '/playlists/:playlistId/tracks'));
app.get('/api/spotify/search', createProxyRequest('GET', '/search'));
app.put('/api/spotify/me/library', createProxyRequest('PUT', '/me/tracks'));
app.delete('/api/spotify/me/library', createProxyRequest('DELETE', '/me/tracks'));

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
