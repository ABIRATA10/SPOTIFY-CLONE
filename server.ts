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
  { id: 'track-0', title: 'I Guess', artist: 'KR$NA', album: 'I Guess', duration: '03:11', audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview122/v4/66/80/33/66803378-5898-0156-d7ff-e6528323b0eb/mzaf_9686007198005243920.plus.aac.p.m4a', coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/db/f8/fc/dbf8fce4-dd7d-08b5-b35c-fa86bedcdc94/cover.jpg/300x300bb.jpg' },
  { id: 'track-1', title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', duration: '03:20', audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/17/b4/8f/17b48f9a-0b93-6bb8-fe1d-3a16623c2cfb/mzaf_9560252727299052414.plus.aac.p.m4a', coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/a6/6e/bf/a66ebf79-5008-8948-b352-a790fc87446b/19UM1IM04638.rgb.jpg/300x300bb.jpg' },
  { id: 'track-2', title: 'Billie Jean', artist: 'Michael Jackson', album: 'Thriller', duration: '04:54', audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/dc/bc/8a/dcbc8a3e-4ce1-c00d-cc02-eda2212053c7/mzaf_8347559338388601510.plus.aac.p.m4a', coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/32/4f/fd/324ffda2-9e51-8f6a-0c2d-c6fd2b41ac55/074643811224.jpg/300x300bb.jpg' },
  { id: 'track-3', title: 'STAY', artist: 'The Kid LAROI, Justin Bieber', album: 'F*CK LOVE 3', duration: '02:21', audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/d7/4a/84/d74a84d5-9afa-761e-b632-baab55c2a23b/mzaf_11865500880477235553.plus.aac.p.m4a', coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/89/59/6a/89596ab9-fa3c-8d08-4d95-a6450fa2013c/886449400515.jpg/300x300bb.jpg' },
  { id: 'track-4', title: 'Levitating', artist: 'Dua Lipa', album: 'Future Nostalgia', duration: '03:23', audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/59/dc/4d/59dc4dda-93ff-8f1c-c536-f005f6ea6af5/mzaf_3066686759813252385.plus.aac.p.m4a', coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/6c/11/d6/6c11d681-aa3a-d59e-4c2e-f77e181026ab/190295092665.jpg/300x300bb.jpg' },
  { id: 'track-5', title: 'Shape of You', artist: 'Ed Sheeran', album: '÷ (Divide)', duration: '03:53', audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/44/c7/4f/44c74f0d-72dc-6143-d4d0-ba14d661ca0d/mzaf_9566898362556366703.plus.aac.p.m4a', coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/15/e6/e8/15e6e8a4-4190-6a8b-86c3-ab4a51b88288/190295851286.jpg/300x300bb.jpg' },
  { id: 'track-6', title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', duration: '05:55', audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/8f/11/52/8f1152a9-fd5f-0021-f546-b97579c22ec3/mzaf_3962258993076347789.plus.aac.p.m4a', coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/4d/08/2a/4d082a9e-7898-1aa1-a02f-339810058d9e/14DMGIM05632.rgb.jpg/300x300bb.jpg' },
  { id: 'track-7', title: 'Smells Like Teen Spirit', artist: 'Nirvana', album: 'Nevermind', duration: '05:01', audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/a6/53/1e/a6531efa-397c-eb73-ecab-9b2790c1471e/mzaf_16440344883389407474.plus.aac.p.m4a', coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/95/fd/b9/95fdb9b2-6d2b-92a6-97f2-51c1a6d77f1a/00602527874609.rgb.jpg/300x300bb.jpg' },
  { id: 'track-8', title: 'Hotel California', artist: 'Eagles', album: 'Hotel California', duration: '06:30', audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/a7/1b/f0/a71bf07d-f498-05c9-2c8a-d12af7d019d8/mzaf_11402952498213508559.plus.aac.p.m4a', coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/88/16/2c/88162c3d-46db-8321-61f3-3a47404cfe76/075596050920.jpg/300x300bb.jpg' },
  { id: 'track-9', title: 'Imagine', artist: 'John Lennon', album: 'Imagine', duration: '03:07', audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/7d/4e/8c/7d4e8ced-a37b-fab9-c66a-f3b4d6f043cb/mzaf_1566428042492234227.plus.aac.p.m4a', coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/21/e3/b0/21e3b048-c917-92c4-bd7d-ace44797b388/13UABIM52808.rgb.jpg/300x300bb.jpg' },
  { id: 'track-10', title: 'Rolling in the Deep', artist: 'Adele', album: '21', duration: '03:48', audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/9f/07/1d/9f071dc7-791c-c869-dfa2-06b25936a287/mzaf_11077490630806345321.plus.aac.p.m4a', coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/eb/ca/25/ebca2596-cd1e-b295-91a3-771c868d0a79/191404113868.png/300x300bb.jpg' },
  ];

// Provide Mock Data API
app.get("/api/mock-tracks", (req, res) => {
  res.json(REAL_TRACKS_DATA);
});

// SPOTIFY OAUTH FLOW
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

app.get('/api/auth/url', (req, res) => {
  let redirectUri = req.query.redirect_uri as string;

  if (!redirectUri) {
    const protocol = req.headers['x-forwarded-proto'] ? req.headers['x-forwarded-proto'].toString().split(',')[0] : req.protocol;
    const host = req.headers['x-forwarded-host'] ? req.headers['x-forwarded-host'].toString().split(',')[0] : req.get('host');
    redirectUri = `${protocol}://${host}/api/callback`;
  }
  
  const scopes = 'user-read-private user-read-email user-library-read user-modify-playback-state';
  const query = new URLSearchParams({
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID || 'missing_client_id',
    scope: scopes,
    redirect_uri: redirectUri,
    state: Buffer.from(redirectUri).toString('base64'),
  });

  res.json({ url: `https://accounts.spotify.com/authorize?${query.toString()}` });
});

app.get('/api/callback', async (req, res) => {
  try {
    const code = req.query.code || null;
    const state = req.query.state || null;
    if (!code) {
      if (req.query.error) {
         return res.status(400).send(`Spotify returned error: ${req.query.error}`);
      }
      return res.status(400).send('No code provided');
    }

    let redirectUri = '';
    if (state && typeof state === 'string') {
        redirectUri = Buffer.from(state, 'base64').toString('utf-8');
    }

    if (!redirectUri) {
       const protocol = req.headers['x-forwarded-proto'] ? req.headers['x-forwarded-proto'].toString().split(',')[0] : req.protocol;
       const host = req.headers['x-forwarded-host'] ? req.headers['x-forwarded-host'].toString().split(',')[0] : req.get('host');
       redirectUri = `${protocol}://${host}/api/callback`;
    }

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
    if (error?.response?.data?.error) {
      console.warn('Spotify Auth Callback notice:', error.response.data.error);
    } else {
      console.warn('Callback notice:', error.message);
    }
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

    // Construct query parameters safely
    const safeQuery: Record<string, string> = {};
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
         safeQuery[key] = req.query[key] as string;
      }
    }
    const query = new URLSearchParams(safeQuery).toString();
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
    
    return res.status(200).json(typeof response.data === 'object' ? response.data : { data: response.data, msg: 'non-object response' });
  } catch (err: any) {
    const status = err?.response?.status || 500;
    if (status !== 403 && status !== 401) {
       console.log(`Spotify API Error at ${endpoint}:`, err?.response?.data?.error?.message || err.message);
    }
    
    let safeData = { error: 'Internal Server Error', message: err.message };
    if (err?.response?.data) {
        if (typeof err.response.data === 'object') {
             safeData = err.response.data;
        } else {
             safeData = { error: 'External API Error', message: String(err.response.data).substring(0, 200) };
        }
    }
    
    return res.status(typeof status === 'number' ? status : 500).json(safeData);
  }
};

app.get('/api/spotify/me/playlists', createProxyRequest('GET', '/me/playlists'));
app.get('/api/spotify/playlists/:playlistId/tracks', createProxyRequest('GET', '/playlists/:playlistId/tracks'));
app.get('/api/spotify/search', createProxyRequest('GET', '/search'));
app.put('/api/spotify/me/library', createProxyRequest('PUT', '/me/tracks'));
app.delete('/api/spotify/me/library', createProxyRequest('DELETE', '/me/tracks'));

app.get('/api/play', async (req, res) => {
  try {
    const search = req.query.search as string;
    if (!search) return res.status(400).json({ error: "Missing search parameter" });
    
    // Using inline require so we don't need to change top-level imports
    const ytSearch = require('yt-search');
    const ytdl = require('@distube/ytdl-core');

    const result = await ytSearch(search);
    if (!result || !result.videos || result.videos.length === 0) {
       return res.status(404).json({ error: "No results found" });
    }
    
    const videoId = result.videos[0].videoId;
    const info = await ytdl.getInfo(videoId);
    const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
    
    res.json({ audioUrl: format.url, videoId });
  } catch (error: any) {
    console.warn("YouTube streaming parse failure:", error.message);
    res.status(500).json({ error: "YouTube scraping failed due to bot protection or region locks." });
  }
});

// Catch-all for unhandled API requests to prevent Vite returning HTML
app.use('/api', (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

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
