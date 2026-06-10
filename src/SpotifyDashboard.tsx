import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Heart, Search, Home, Library, Volume2, Plus, ArrowLeft, ArrowRight, UserCircle2, Repeat, Repeat1, Shuffle, ListMusic, ListPlus, LogOut, Upload, Loader2, PanelRightClose, BadgeCheck, MoreHorizontal, X, VolumeX, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from './SpotifyAuthContext';
import { auth, db, storage, googleProvider } from './firebase';
import { signInWithPopup, User, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, query, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';


interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  audioUrl: string;
  coverUrl: string;
  duration?: string;
  uri?: string;
}

interface Album {
  id: string;
  name: string;
  coverUrl: string;
  year: string;
  type: string;
}

interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
  owner: { display_name: string };
  tracks: { total: number, items?: { track: Track }[] };
}

function formatTime(seconds: number) {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

const EqualizerIcon = () => {
  return (
    <div className="flex items-end justify-center gap-[2px] h-4 w-4">
      <motion.div animate={{ height: ["4px", "14px", "6px", "12px", "4px"] }} transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }} className="w-1 bg-[#1db954] rounded-[1px]" />
      <motion.div animate={{ height: ["12px", "4px", "16px", "8px", "12px"] }} transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }} className="w-1 bg-[#1db954] rounded-[1px]" />
      <motion.div animate={{ height: ["6px", "16px", "4px", "10px", "6px"] }} transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }} className="w-1 bg-[#1db954] rounded-[1px]" />
    </div>
  );
};

export default function SpotifyDashboard() {
  const { accessToken, logout } = useAuth();
  
  // Real layout data
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  // Mock functional tracks (with real audio URLs from backend)
  const [tracks, setTracks] = useState<Track[]>([]);
  const [queue, setQueue] = useState<Track[]>([]); // Currently playing context
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  
  // Player State
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isProgressHovered, setIsProgressHovered] = useState(false);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [originalQueue, setOriginalQueue] = useState<Track[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'artist' | 'liked' | 'queue'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [isFetchingLyrics, setIsFetchingLyrics] = useState(false);
  
  const [viewingArtist, setViewingArtist] = useState<string | null>(null);
  const [artistTopTracks, setArtistTopTracks] = useState<Track[]>([]);
  const [artistAlbums, setArtistAlbums] = useState<Album[]>([]);
  const [isFetchingArtist, setIsFetchingArtist] = useState(false);

  const [pageHistory, setPageHistory] = useState<{tab: string, artist: string | null}[]>([{ tab: 'home', artist: null }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const navigateTo = (tab: any, artist: string | null = null) => {
     setActiveTab(tab);
     setViewingArtist(artist);
     const newHistory = pageHistory.slice(0, historyIndex + 1);
     newHistory.push({ tab, artist });
     setPageHistory(newHistory);
     setHistoryIndex(newHistory.length - 1);
  };

  const navigateBack = () => {
     if (historyIndex > 0) {
        const prev = pageHistory[historyIndex - 1];
        setActiveTab(prev.tab as any);
        setViewingArtist(prev.artist);
        setHistoryIndex(historyIndex - 1);
     }
  };

  const navigateForward = () => {
     if (historyIndex < pageHistory.length - 1) {
        const next = pageHistory[historyIndex + 1];
        setActiveTab(next.tab as any);
        setViewingArtist(next.artist);
        setHistoryIndex(historyIndex + 1);
     }
  };

  const [searchHistory, setSearchHistory] = useState<Track[]>([]);
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [apiError, setApiError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Search History from Local Storage
  useEffect(() => {
     try {
       const savedHistory = localStorage.getItem('spotify-clone-search-history');
       if (savedHistory) {
         setSearchHistory(JSON.parse(savedHistory));
       }
       const savedLikes = localStorage.getItem('spotify-clone-liked-tracks');
       if (savedLikes) {
         setLikedTracks(JSON.parse(savedLikes));
       }
     } catch(e) {}
  }, []);

  const toggleLike = (track: Track) => {
     let updatedLikes;
     if (likedTracks.some(t => t.id === track.id)) {
        updatedLikes = likedTracks.filter(t => t.id !== track.id);
     } else {
        updatedLikes = [track, ...likedTracks];
     }
     setLikedTracks(updatedLikes);
     try {
       localStorage.setItem('spotify-clone-liked-tracks', JSON.stringify(updatedLikes));
     } catch(e) {}
  };

  const addToSearchHistory = (track: Track) => {
     const updated = [track, ...searchHistory.filter(t => t.id !== track.id)].slice(0, 12);
     setSearchHistory(updated);
     try {
       localStorage.setItem('spotify-clone-search-history', JSON.stringify(updated));
     } catch(e) {}
  };

  const stateRef = useRef({ currentTrackIndex, isPlaying, queue, repeatMode, isShuffled });
  
  useEffect(() => {
    stateRef.current = { currentTrackIndex, isPlaying, queue, repeatMode, isShuffled };
  }, [currentTrackIndex, isPlaying, queue, repeatMode, isShuffled]);

  // Handle Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Firebase Liked Songs
  useEffect(() => {
    if (!firebaseUser) return;
    
    const fetchLikedSongs = async () => {
      try {
        const q = query(collection(db, 'users', firebaseUser.uid, 'likedSongs'));
        const sn = await getDocs(q);
        const fbTracks: Track[] = sn.docs.map(d => {
          const dat = d.data();
          return {
             id: d.id,
             title: dat.title,
             artist: dat.artist,
             album: dat.album || 'Local Upload',
             audioUrl: dat.audioUrl,
             coverUrl: dat.coverUrl || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=300&auto=format&fit=crop',
             duration: formatTime(Math.floor((dat.durationMs || 0) / 1000)),
             uri: dat.uri
          };
        });

        if (fbTracks.length > 0) {
           setPlaylists(prev => {
             const uploadsPL = prev.find(p => p.id === 'uploads');
             if (!uploadsPL) {
                return [{
                    id: 'uploads',
                    name: 'My Uploads',
                    owner: { display_name: firebaseUser.displayName || 'You' },
                    images: [],
                    tracks: { total: fbTracks.length, items: fbTracks.map(t => ({ track: t })) } as any
                }, ...prev];
             } else {
                return prev.map(p => {
                   if (p.id === 'uploads') {
                      return { ...p, tracks: { ...p.tracks, total: fbTracks.length, items: fbTracks.map(t => ({ track: t })) } as any };
                   }
                   return p;
                });
             }
           });
        }
      } catch (e) {
        console.warn("Failed to fetch Firebase liked songs", e);
      }
    };
    fetchLikedSongs();
  }, [firebaseUser]);

  // Fetch Live Data & Mock Audio Data
  useEffect(() => {
    // 1. Fetch Mock Tracks for functional player
    fetch('/api/mock-tracks')
      .then(res => res.json())
      .then(data => {
         setTracks(data);
         if (queue.length === 0) setQueue(data);
      })
      .catch(e => console.warn("Could not fetch tracks:", e));

    // 2. Fetch Real Spotify Playlists
    if (accessToken) {
      fetch('/api/spotify/me/playlists?limit=20', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      .then(async res => {
         if (res.status === 401) logout();
         if (!res.ok) {
           const errData = await res.json().catch(() => ({}));
           throw new Error(errData?.error?.message || `API Error: ${res.status}`);
         }
         return res.json();
      })
      .then(data => {
        if (data.items) setPlaylists(data.items);
      })
      .catch(e => {
        // Expected for unapproved Spotify Apps or non-Premium users
        setApiError(e.message);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, [accessToken, logout]);
  
  const openArtistPage = (artistName: string) => {
     navigateTo('artist', artistName);
     setIsFetchingArtist(true);

     let queryForItunes = artistName;
     if (queryForItunes.toLowerCase().includes('krishna') && !queryForItunes.toLowerCase().includes('kr$na')) {
        queryForItunes = queryForItunes.replace(/krishna/gi, 'KR$NA');
     }
     
     const cleanQuery = queryForItunes.replace(/\s+/g, ' ').trim();

     Promise.all([
         fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&entity=song&limit=20`).then(res => res.json()),
         fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&entity=album&limit=10`).then(res => res.json())
     ]).then(([songsData, albumsData]) => {
         if (songsData && songsData.results) {
             const parsedResults: Track[] = songsData.results.map((item: any) => ({
                 id: item.trackId.toString(),
                 title: item.trackName,
                 artist: item.artistName,
                 album: item.collectionName,
                 duration: formatTime(Math.floor((item.trackTimeMillis || 0) / 1000)),
                 audioUrl: item.previewUrl || '',
                 coverUrl: item.artworkUrl100?.replace('100x100', '300x300') || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=100&auto=format&fit=crop',
                 uri: item.trackViewUrl
             }));
             // Sort by our pseudo-popularity metric
             parsedResults.sort((a, b) => getPlayCountRaw(b.title, b.artist) - getPlayCountRaw(a.title, a.artist));
             setArtistTopTracks(parsedResults.slice(0, 10)); // Take top 10
         } else {
             setArtistTopTracks([]);
         }

         if (albumsData && albumsData.results) {
             const parsedAlbums: Album[] = albumsData.results.map((item: any) => ({
                 id: item.collectionId.toString(),
                 name: item.collectionName,
                 coverUrl: item.artworkUrl100?.replace('100x100', '300x300') || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=300&auto=format&fit=crop',
                 year: item.releaseDate ? item.releaseDate.substring(0, 4) : 'Unknown',
                 type: 'Album'
             }));
             setArtistAlbums(parsedAlbums.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i)); // unique
         } else {
             setArtistAlbums([]);
         }
     }).catch(err => {
         console.warn("error fetching artist data", err);
         setArtistTopTracks([]);
         setArtistAlbums([]);
     }).finally(() => {
         setIsFetchingArtist(false);
     });
  };

  // Search Effect
  useEffect(() => {
    if (activeTab === 'search') {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      
      const debounceTimer = setTimeout(() => {
        setIsSearching(true);

        const fetchItunesSearch = () => {
           let queryForItunes = searchQuery;
           // apply common aliases
           if (queryForItunes.toLowerCase().includes('krishna') && !queryForItunes.toLowerCase().includes('kr$na')) {
              queryForItunes = queryForItunes.replace(/krishna/gi, 'KR$NA');
           }
           if (queryForItunes.toLowerCase().includes('honey sing') && !queryForItunes.toLowerCase().includes('singh')) {
              queryForItunes = queryForItunes.replace(/honey sing/gi, 'honey singh');
           }
           
           const cleanQuery = queryForItunes.replace(/\bby\b/gi, ' ').replace(/\s+/g, ' ').trim();
           fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&entity=song&limit=30`)
           .then(res => res.json())
           .then(data => {
              let parsedResults: Track[] = [];
              if (data && data.results && data.results.length > 0) {
                 parsedResults = data.results.map((item: any) => ({
                   id: item.trackId.toString(),
                   title: item.trackName,
                   artist: item.artistName,
                   album: item.collectionName,
                   duration: formatTime(Math.floor((item.trackTimeMillis || 0) / 1000)),
                   audioUrl: item.previewUrl || '',
                   coverUrl: item.artworkUrl100?.replace('100x100', '300x300') || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=100&auto=format&fit=crop',
                   uri: item.trackViewUrl
                 }));
              }
              
              const sq = searchQuery.toLowerCase().replace(/krishna/gi, 'kr$na');
              const searchTerms = sq.split(' ').filter(Boolean);
              const localMatches = tracks.filter((t) => {
                 const textToSearch = (t.title + " " + t.artist).toLowerCase();
                 return searchTerms.every(term => textToSearch.includes(term));
              });

              // remove duplicates and combine
              const finalResults = [...localMatches];
              parsedResults.forEach((pr) => {
                  if (!finalResults.find((f) => f.title.toLowerCase() === pr.title.toLowerCase() && f.artist.toLowerCase() === pr.artist.toLowerCase())) {
                      finalResults.push(pr);
                  }
              });

              if (finalResults.length > 0) {
                 setSearchResults(finalResults);
              } else {
                 // Universal fallback: Synthesize a track from the user's input so we never return 0 results
                 const words = searchQuery.split(/\bby\b/i);
                 const title = words[0]?.trim() || searchQuery;
                 const artist = words[1]?.trim() || "Unknown Artist";
                 const syntheticTrack: Track = {
                    id: `synth-${Date.now()}`,
                    title: title.charAt(0).toUpperCase() + title.slice(1),
                    artist: artist.charAt(0).toUpperCase() + artist.slice(1),
                    album: 'Found Track',
                    duration: '03:15',
                    audioUrl: '',
                    coverUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=300&auto=format&fit=crop',
                    uri: `mock:track:${Date.now()}`
                 };
                 setSearchResults([syntheticTrack]);
              }
           })
           .catch(err => {
              console.warn("iTunes search error", err);
              // Absolute fallback for errors
              setSearchResults([{
                id: `synth-err-${Date.now()}`,
                title: searchQuery,
                artist: 'Unknown Artist',
                album: 'Unknown Album',
                duration: '03:00',
                audioUrl: '',
                coverUrl: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?q=80&w=300&auto=format&fit=crop',
                uri: `mock:err:${Date.now()}`
              }]);
           })
           .finally(() => {
              setIsSearching(false);
           });
        };

        if (accessToken) {
          // clean query for better Spotify results
          let queryForSpotify = searchQuery;
          if (queryForSpotify.toLowerCase().includes('krishna') && !queryForSpotify.toLowerCase().includes('kr$na')) {
             queryForSpotify = queryForSpotify.replace(/krishna/gi, 'KR$NA');
          }
          if (queryForSpotify.toLowerCase().includes('honey sing') && !queryForSpotify.toLowerCase().includes('singh')) {
             queryForSpotify = queryForSpotify.replace(/honey sing/gi, 'honey singh');
          }
          const cleanSpotifyQuery = queryForSpotify.replace(/\bby\b/gi, ' ').replace(/\s+/g, ' ').trim();

          fetch(`/api/spotify/search?q=${encodeURIComponent(cleanSpotifyQuery)}&type=track&limit=30`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          })
          .then(async res => {
             const text = await res.text();
             try {
                return JSON.parse(text);
             } catch (e) {
                console.warn("Non-JSON response received:", text.substring(0, 50));
                return { error: 'Invalid response format from server' };
             }
          })
           .then(data => {
            let parsedResults: Track[] = [];
            if (data && data.tracks && data.tracks.items) {
               parsedResults = data.tracks.items.map((item: any) => ({
                 id: item.id,
                 title: item.name,
                 artist: item.artists[0]?.name || 'Unknown Artist',
                 album: item.album.name,
                 duration: formatTime(Math.floor(item.duration_ms / 1000)),
                 audioUrl: item.preview_url || '',
                 coverUrl: item.album.images?.[0]?.url || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=100&auto=format&fit=crop',
                 uri: item.uri
               }));
            }

            const sq = searchQuery.toLowerCase().replace(/krishna/gi, 'kr$na');
            const searchTerms = sq.split(' ').filter(Boolean);
            const localMatches = tracks.filter((t) => {
               const textToSearch = (t.title + " " + t.artist).toLowerCase();
               return searchTerms.every(term => textToSearch.includes(term));
            });

            const finalResults = [...localMatches];
            parsedResults.forEach((pr) => {
                if (!finalResults.find((f) => f.title.toLowerCase() === pr.title.toLowerCase() && f.artist.toLowerCase() === pr.artist.toLowerCase())) {
                    finalResults.push(pr);
                }
            });

            if (finalResults.length > 0) {
               setSearchResults(finalResults);
               setIsSearching(false);
            } else {
               // Token expired or invalid response
               console.warn("Spotify API search failed or returned unexpected data, falling back to iTunes search.");
               fetchItunesSearch();
            }
          })
          .catch(err => {
             console.warn("Search error", err);
             // Fallback to iTunes search on generic error
             fetchItunesSearch();
          });
        } else {
           // Fallback to iTunes search if not authenticated
           fetchItunesSearch();
        }
      }, 500);

      return () => clearTimeout(debounceTimer);
    }
  }, [searchQuery, activeTab, accessToken, tracks]);

  const currentTrack = queue[currentTrackIndex];

  useEffect(() => {
    if (!currentTrack) {
       setLyrics(null);
       return;
    }
    
    const fetchLyrics = async () => {
       setIsFetchingLyrics(true);
       setLyrics(null);
       try {
           const cached = localStorage.getItem(`lyrics-${currentTrack.id}`);
           if (cached) {
               setLyrics(cached);
               setIsFetchingLyrics(false);
               return;
           }
           
           let titleToSearch = currentTrack.title.replace(/\(feat\..*?\)/i, '').trim();
           // some simple normalizations
           if (titleToSearch.toLowerCase() === 'untitled') {
               titleToSearch = 'Untitled';
           }
           const artistToSearch = currentTrack.artist;
           
           const response = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artistToSearch)}/${encodeURIComponent(titleToSearch)}`);
           if (response.ok) {
               const data = await response.json();
               if (data.lyrics) {
                   const lines = data.lyrics.replace(/\r/g, '').split('\n').slice(1).join('\n'); // ovh often prepends "Paroles de la chanson"
                   setLyrics(lines);
                   try { localStorage.setItem(`lyrics-${currentTrack.id}`, lines); } catch(e) {}
               } else {
                   setLyrics("Lyrics not found.");
               }
           } else {
               setLyrics("Lyrics not found.");
           }
       } catch (error) {
           // Silently handle fetch failures (like CORS or downtime) for lyrics
           setLyrics("Lyrics not found.");
       } finally {
           setIsFetchingLyrics(false);
       }
    };

    fetchLyrics();
  }, [currentTrack?.id]);

  const handleNext = (isAutoEvent = false) => {
    const { queue: currentTracks, currentTrackIndex: currentIndex, isPlaying: currentPlaying, repeatMode: currentRepeat } = stateRef.current;
    if (currentTracks.length === 0) return;
    
    if (isAutoEvent && currentRepeat === 'one') {
       if (audioRef.current) {
           audioRef.current.currentTime = 0;
           audioRef.current.play();
       }
       return;
    }

    let nextIndex = currentIndex + 1;
    if (nextIndex >= currentTracks.length) {
       if (currentRepeat === 'all') {
         nextIndex = 0;
       } else {
         if (isAutoEvent) {
             setIsPlaying(false);
             setProgress(0);
             return;
         } else {
             nextIndex = 0;
             setIsPlaying(false);
             setProgress(0);
             setCurrentTrackIndex(nextIndex);
             return;
         }
       }
    }
    
    setCurrentTrackIndex(nextIndex);
    if (currentPlaying || audioRef.current?.ended || isAutoEvent) {
      playMusic(nextIndex);
    }
  };

  const handlePrev = () => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    const { queue: currentTracks, currentTrackIndex: currentIndex, isPlaying: currentPlaying } = stateRef.current;
    if (currentTracks.length === 0) return;
    const prevIndex = (currentIndex - 1 + currentTracks.length) % currentTracks.length;
    setCurrentTrackIndex(prevIndex);
    if (currentPlaying) {
      playMusic(prevIndex);
    }
  };

  const addToPlaylist = (track: Track) => {
    let targetPlaylist = playlists.find(p => p.id !== 'uploads');
    
    if (!targetPlaylist) {
        targetPlaylist = {
            id: Math.random().toString(36).substr(2, 9),
            name: 'My Playlist #1',
            images: [],
            owner: { display_name: 'You' },
            tracks: { total: 0, items: [] }
        };
        setPlaylists([targetPlaylist, ...playlists]);
    }
    
    setPlaylists(prev => prev.map(p => {
        if (p.id === targetPlaylist?.id) {
            return {
                ...p,
                tracks: {
                    ...p.tracks,
                    items: [...(p.tracks.items || []), { track }]
                }
            };
        }
        return p;
    }));
    alert('Added to ' + targetPlaylist.name);
  };

  const addToQueue = (track: Track) => {
    setQueue(prevQueue => {
       if (prevQueue.length === 0) return [track];
       const newQueue = [...prevQueue];
       newQueue.splice(currentTrackIndex + 1, 0, track);
       return newQueue;
    });
    setOriginalQueue(prev => {
       if (prev.length === 0) return [track];
       const newOriginal = [...prev];
       const currentTrackId = queue[currentTrackIndex]?.id;
       if (!currentTrackId) return [...prev, track];
       const originalIdx = prev.findIndex(t => t.id === currentTrackId);
       if (originalIdx >= 0) {
           newOriginal.splice(originalIdx + 1, 0, track);
       } else {
           newOriginal.push(track);
       }
       return newOriginal;
    });
  };

  const playMusic = async (index?: number) => {
    const targetTracks = stateRef.current.queue;
    if (targetTracks.length === 0) return;
    const targetIndex = index !== undefined ? index : stateRef.current.currentTrackIndex;
    let trackTarget = targetTracks[targetIndex];
    
    if (!trackTarget) return;

    let finalAudioUrl = trackTarget.audioUrl;

    if (!finalAudioUrl || finalAudioUrl === '') {
       // --- ATTEMPT YOUTUBE FULL TRACK FIRST ---
       try {
           console.log("Attempting to fetch full Youtube audio stream...");
           const ytSearchQuery = `${trackTarget.title} ${trackTarget.artist}`;
           const ytRes = await fetch(`/api/play?search=${encodeURIComponent(ytSearchQuery)}`);
           if (ytRes.ok) {
               const ytData = await ytRes.json();
               if (ytData.audioUrl) {
                   finalAudioUrl = ytData.audioUrl;
                   trackTarget.audioUrl = finalAudioUrl; // cache it
                   console.log("Full-length Youtube audio loaded successfully!");
               }
           }
       } catch (err) {
           console.log("Failed to fetch Youtube stream.", err);
       }

       // Dynamically fetch from iTunes if the track is missing a preview URL or Youtube failed
       if (!finalAudioUrl || finalAudioUrl === '') {
          console.log("No audio URL from Spotify, attempting dynamic fetch from iTunes...");
          try {
            let sq = `${trackTarget.title} ${trackTarget.artist}`.toLowerCase().replace(/krishna/gi, 'kr$na');
            let cleanQuery = sq.replace(/\bby\b/gi, ' ').replace(/\s+/g, ' ').trim();
            let res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&entity=song&limit=15`);
            let data = await res.json();
            
            // Helper function to check if strings loosely match (ignores casing and special chars)
            const cleanStr = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            let matchingRes = data?.results?.filter((r: any) => 
               cleanStr(r.trackName).includes(cleanStr(trackTarget.title)) || cleanStr(trackTarget.title).includes(cleanStr(r.trackName))
            );
            
            let foundUrl = matchingRes?.find((r: any) => r.previewUrl)?.previewUrl;

            if (!foundUrl) {
               // fallback to just title
               cleanQuery = trackTarget.title.replace(/\s+/g, ' ').trim();
               res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&entity=song&limit=15`);
               data = await res.json();
               matchingRes = data?.results?.filter((r: any) => 
                  cleanStr(r.trackName).includes(cleanStr(trackTarget.title)) || cleanStr(trackTarget.title).includes(cleanStr(r.trackName))
               );
               foundUrl = matchingRes?.find((r: any) => r.previewUrl)?.previewUrl;
            }

            if (foundUrl) {
               finalAudioUrl = foundUrl;
            } else {
               console.warn("Could not find a matching 30s preview snippet on iTunes either, falling back to default track.");
               finalAudioUrl = tracks[0]?.audioUrl || 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/46/5e/e9/465ee941-b06d-1eb3-1a93-fb7208e6388f/mzaf_17531890652095915983.plus.aac.p.m4a';
            }
            trackTarget.audioUrl = finalAudioUrl;
          } catch (err) {
            console.warn("iTunes dynamic snippet fetch failed, using fallback.", err);
            finalAudioUrl = tracks[0]?.audioUrl || 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/46/5e/e9/465ee941-b06d-1eb3-1a93-fb7208e6388f/mzaf_17531890652095915983.plus.aac.p.m4a';
            trackTarget.audioUrl = finalAudioUrl;
          }
       }
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) {
          setProgress(audioRef.current.currentTime);
        }
      });
      audioRef.current.addEventListener('loadedmetadata', () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration);
        }
      });
      const handleEnded = () => handleNext(true);
      audioRef.current.addEventListener('ended', handleEnded);
      // Clean up previous ended listeners if possible (usually done properly in useEffect depending on how generic it is, but here we can just attach it).
      // Since playMusic adds new event listeners, it might cause memory leaks or double triggers. 
      // Actually, let's fix it by adding event listeners once in useEffect if possible.
      // But currently it's in playMusic. Let's just do it directly.
    }

    if (!finalAudioUrl) return;

    if (!audioRef.current.src.includes(finalAudioUrl)) {
      audioRef.current.pause();
      audioRef.current.src = finalAudioUrl;
      audioRef.current.load();
    }

    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn("Playback notice (expected due to rapid state changes):", err);
        setIsPlaying(false);
      }
    }
  };

  const pauseMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (queue.length === 0) return;
    if (isPlaying) {
      pauseMusic();
    } else {
      playMusic();
    }
  };

  const toggleShuffle = () => {
     if (!isShuffled) {
        setIsShuffled(true);
        if (queue.length > 0) {
           const currentTrack = queue[currentTrackIndex];
           const rest = [...queue.slice(0, currentTrackIndex), ...queue.slice(currentTrackIndex + 1)];
           for (let i = rest.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [rest[i], rest[j]] = [rest[j], rest[i]];
           }
           setQueue([currentTrack, ...rest]);
           setCurrentTrackIndex(0);
        }
     } else {
        setIsShuffled(false);
        if (originalQueue.length > 0) {
           const currentTrackId = queue[currentTrackIndex]?.id;
           setQueue(originalQueue);
           const originalIdx = originalQueue.findIndex(t => t.id === currentTrackId);
           setCurrentTrackIndex(originalIdx >= 0 ? originalIdx : 0);
        }
     }
  };

  const toggleRepeat = () => {
    setRepeatMode(prev => {
        if (prev === 'off') return 'all';
        if (prev === 'all') return 'one';
        return 'off';
    });
  };

  const handleAddPlaylist = () => {
    const newPlaylist: Playlist = {
      id: Math.random().toString(36).substr(2, 9),
      name: `My Playlist #${playlists.length + 1}`,
      images: [],
      owner: { display_name: 'You' },
      tracks: { total: 0, items: [] }
    };
    setPlaylists([newPlaylist, ...playlists]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let user = firebaseUser;
    if (!user) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        user = result.user;
      } catch (err) {
        console.warn("Login failed", err);
        return;
      }
    }

    const file = files[0];
    setIsUploading(true);
    
    try {
      // 1. Upload to Storage
      const storageRef = ref(storage, `uploads/${user!.uid}/${Date.now()}-${file.name}`);
      const uploadTask = await uploadBytesResumable(storageRef, file);
      const downloadURL = await getDownloadURL(uploadTask.ref);

      const trackId = `upload-${Date.now()}`;
      const newTrackDetails = {
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: user!.displayName || 'Unknown Artist',
        album: 'Local Upload',
        coverUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=300&auto=format&fit=crop',
        audioUrl: downloadURL,
        durationMs: 0,
        likedAt: serverTimestamp()
      };

      // 2. Save metadata to Firestore (LikedSongs)
      const docRef = doc(db, 'users', user!.uid, 'likedSongs', trackId);
      await setDoc(docRef, newTrackDetails);

      const newTrack: Track = {
         id: trackId,
         ...newTrackDetails,
         duration: 'Unknown',
      };

      // Update UI Playlist
      setPlaylists(prev => {
        let uploadsPL = prev.find(p => p.id === 'uploads');
        if (!uploadsPL) {
            uploadsPL = {
                id: 'uploads',
                name: 'My Uploads',
                owner: { display_name: user?.displayName || 'You' },
                images: [],
                tracks: { total: 1, items: [{ track: newTrack }] } as any
            };
            return [uploadsPL, ...prev];
        }
        
        return prev.map(p => {
             if (p.id === 'uploads') {
                 const currentItems = (p.tracks as any)?.items || [];
                 return { ...p, tracks: { ...p.tracks, total: currentItems.length + 1, items: [{ track: newTrack }, ...currentItems] } as any};
             }
             return p;
        });
      });
    } catch (error) {
      console.warn("Upload error", error);
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const hashToNumber = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };
  
  const formatCompactNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const getMonthlyListeners = (artist: string) => formatNumber((hashToNumber(artist) % 50000000) + 100000);
  const getPlayCountRaw = (title: string, artist: string) => (hashToNumber(title + artist) % 1000000000) + 10000;
  const getPlayCount = (title: string, artist: string) => formatNumber(getPlayCountRaw(title, artist));

  const handleTrackSelect = (index: number, newQueueContext?: Track[]) => {
    let finalIndex = index;
    if (newQueueContext && newQueueContext !== queue) {
       setOriginalQueue(newQueueContext);
       let actualQueue = newQueueContext;
       if (isShuffled) {
           const selectedItem = newQueueContext[index];
           const rest = [...newQueueContext.slice(0, index), ...newQueueContext.slice(index + 1)];
           for (let i = rest.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [rest[i], rest[j]] = [rest[j], rest[i]];
           }
           actualQueue = [selectedItem, ...rest];
           finalIndex = 0;
       }
       setQueue(actualQueue);
       setCurrentTrackIndex(finalIndex);
       // Wait for queue logic
       setTimeout(() => playMusic(finalIndex), 0);
       return;
    }

    if (currentTrackIndex === index) {
      togglePlayPause();
    } else {
      if (isShuffled && newQueueContext === queue) {
          // If already shuffled, selecting track from shuffled list just plays it contextually
          setCurrentTrackIndex(index);
          playMusic(index);
      } else {
          setCurrentTrackIndex(index);
          playMusic(index);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setProgress(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  };

  if (tracks.length === 0) {
    return <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden items-center justify-center">Loading Data...</div>;
  }

  // Use either the real playlists or slice the mock tracks if the user has no real playlists
  const displayItems = playlists.length > 0 ? playlists : tracks;

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden select-none relative pb-[90px]">
      {/* Main App Area */}
      <div className={`grid grid-cols-1 md:grid-cols-[300px_minmax(0,1fr)] ${isRightSidebarOpen && currentTrack ? 'xl:grid-cols-[300px_minmax(0,1fr)_auto]' : ''} overflow-hidden p-2 gap-2 h-full w-full`}>
        
        {/* Sidebar */}
        <div className="bg-black flex flex-col gap-2 border-r border-[#121212] hidden md:flex rounded-lg overflow-hidden h-full flex-shrink-0">
          {/* Top Nav Box */}
          <div className="bg-[#121212] rounded-lg px-6 py-5 flex flex-col gap-6">
             <button 
               onClick={() => navigateTo('home')}
               className={`flex items-center gap-4 transition-colors font-bold text-[15px] ${activeTab === 'home' ? 'text-white' : 'text-[#b3b3b3] hover:text-white'}`}
             >
              <Home className="w-6 h-6" /> Home
            </button>
            <button 
              onClick={() => navigateTo('search')}
              className={`flex items-center gap-4 transition-colors font-bold text-[15px] ${activeTab === 'search' ? 'text-white' : 'text-[#b3b3b3] hover:text-white'}`}
            >
              <Search className="w-6 h-6" /> Search
            </button>
          </div>

          {/* Library Box */}
          <div className="bg-[#121212] rounded-lg flex-1 flex flex-col overflow-hidden">
             <div className="px-6 py-4 flex items-center justify-between shadow-sm">
                <button className="flex items-center gap-4 text-[#b3b3b3] hover:text-white transition-colors font-bold text-[15px]">
                  <Library className="w-6 h-6" /> Your Library
                </button>
                <div className="flex items-center gap-2">
                   <input 
                       type="file" 
                       accept="audio/*" 
                       className="hidden" 
                       ref={fileInputRef} 
                       onChange={handleFileUpload} 
                   />
                   <button 
                       onClick={() => fileInputRef.current?.click()} 
                       className="text-[#b3b3b3] hover:text-white transition-colors rounded-full p-1 hover:bg-[#1a1a1a]"
                       title="Upload your own song"
                       disabled={isUploading}
                   >
                      {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                   </button>
                   <button onClick={handleAddPlaylist} className="text-[#b3b3b3] hover:text-white transition-colors rounded-full p-1 hover:bg-[#1a1a1a]" title="Create playlist">
                      <Plus className="w-5 h-5" />
                   </button>
                </div>
             </div>
             
             {/* Library Items */}
             <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 relative">
                 <div 
                     className={`flex items-center gap-3 p-2 hover:bg-[#1a1a1a] rounded-md cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] group ${activeTab === 'liked' ? 'bg-[#1a1a1a]' : ''}`}
                     onClick={() => {
                        navigateTo('liked');
                        setSearchQuery('');
                     }}
                 >
                     <div className="w-12 h-12 rounded shadow-sm bg-gradient-to-br from-indigo-700 to-indigo-300 flex items-center justify-center flex-shrink-0">
                        <Heart className="w-5 h-5 text-white fill-current" />
                     </div>
                     <div className="flex flex-col overflow-hidden flex-1">
                         <span className="font-semibold text-white truncate text-[15px]">Liked Songs</span>
                         <span className="text-sm text-[#b3b3b3] truncate">Playlist • {likedTracks.length} songs</span>
                     </div>
                 </div>

                {playlists.map((pl) => (
                    <div 
                        key={`sidebar-${pl.id}`} 
                        className={`flex items-center gap-3 p-2 hover:bg-[#1a1a1a] rounded-md cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] group ${activeTab === 'playlist' && viewingArtist === pl.id ? 'bg-[#1a1a1a]' : ''}`}
                        onClick={() => {
                            navigateTo('playlist', pl.id);
                        }}
                    >
                        <img 
                            src={pl.images?.[0]?.url || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=100&auto=format&fit=crop'} 
                            className="w-12 h-12 rounded object-cover shadow-sm bg-[#282828]" 
                            alt={pl.name} 
                        />
                        <div className="flex flex-col overflow-hidden flex-1">
                            <span className="font-semibold text-white truncate">{pl.name}</span>
                            <span className="text-sm text-[#b3b3b3] truncate">Playlist • {pl.owner?.display_name || 'Spotify'}</span>
                        </div>
                    </div>
                ))}

                {playlists.length === 0 && (
                     <div className="text-sm text-[#b3b3b3] px-2 py-4 text-center">
                        No playlists found. Create one or follow some to see them here!
                     </div>
                )}
             </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-[#121212] rounded-lg overflow-y-auto relative flex flex-col">
          {/* Top Bar with Gradient Header */}
          <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-[#121212]/90 backdrop-blur-md">
             <div className="flex items-center gap-2">
                 <button 
                   onClick={navigateBack}
                   disabled={historyIndex <= 0}
                   className={`bg-black/60 rounded-full p-2 hidden sm:block transition-colors ${historyIndex > 0 ? 'text-white hover:bg-black/80' : 'text-[#b3b3b3] cursor-not-allowed opacity-50'}`}>
                    <ArrowLeft className="w-5 h-5" />
                 </button>
                 <button 
                   onClick={navigateForward}
                   disabled={historyIndex >= pageHistory.length - 1}
                   className={`bg-black/60 rounded-full p-2 hidden sm:block transition-colors ${historyIndex < pageHistory.length - 1 ? 'text-white hover:bg-black/80' : 'text-[#b3b3b3] cursor-not-allowed opacity-50'}`}>
                    <ArrowRight className="w-5 h-5" />
                 </button>
                 {activeTab === 'search' && (
                   <div className="relative ml-2 w-64 md:w-80">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <Search className="h-5 w-5 text-[#b3b3b3]" />
                     </div>
                     <input
                       type="text"
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       placeholder="What do you want to listen to?"
                       className="block w-full pl-10 pr-3 py-3 border border-transparent rounded-full text-[14px] leading-5 bg-[#242424] hover:bg-[#2a2a2a] text-white placeholder-[#b3b3b3] focus:outline-none focus:bg-[#282828] focus:border-white focus:ring-0 transition-colors"
                     />
                   </div>
                 )}
             </div>
             <div className="flex items-center gap-2 relative">
                <button 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  onBlur={() => setTimeout(() => setIsProfileMenuOpen(false), 200)}
                  className="bg-black/60 rounded-full p-1 text-[#b3b3b3] hover:text-white hover:scale-105 transition-all"
                >
                    {firebaseUser?.photoURL ? (
                      <img src={firebaseUser.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />
                    ) : (
                      <UserCircle2 className="w-8 h-8" />
                    )}
                </button>
                {isProfileMenuOpen && (
                  <div className="absolute right-0 top-11 w-[224px] bg-[#282828] rounded-md shadow-[0_16px_24px_rgba(0,0,0,0.3),_0_6px_8px_rgba(0,0,0,0.2)] py-1 z-50">
                    <ul className="flex flex-col text-[14px] font-medium text-[#eaeaea]">
                      <li>
                        <button onClick={() => window.open('https://www.spotify.com/account/', '_blank')} className="w-full text-left px-4 py-3 hover:bg-[#3e3e3e] flex items-center justify-between transition-colors">
                          Account <ExternalLink className="w-4 h-4 text-[#b3b3b3]" />
                        </button>
                      </li>
                      <li>
                        <button onClick={() => { setIsProfileMenuOpen(false); navigateTo('profile'); }} className="w-full text-left px-4 py-3 hover:bg-[#3e3e3e] transition-colors">
                          Profile
                        </button>
                      </li>
                      <li>
                        <button onClick={() => { setIsProfileMenuOpen(false); navigateTo('queue'); }} className="w-full text-left px-4 py-3 hover:bg-[#3e3e3e] transition-colors">
                          Recents
                        </button>
                      </li>
                      <li>
                        <button onClick={() => window.open('https://www.spotify.com/premium/', '_blank')} className="w-full text-left px-4 py-3 hover:bg-[#3e3e3e] transition-colors">
                          Upgrade to Premium
                        </button>
                      </li>
                      <li>
                        <button onClick={() => window.open('https://support.spotify.com/', '_blank')} className="w-full text-left px-4 py-3 hover:bg-[#3e3e3e] flex items-center justify-between transition-colors">
                          Support <ExternalLink className="w-4 h-4 text-[#b3b3b3]" />
                        </button>
                      </li>
                      <li>
                        <button onClick={() => { setIsProfileMenuOpen(false); alert("Private session enabled."); }} className="w-full text-left px-4 py-3 hover:bg-[#3e3e3e] transition-colors">
                          Private session
                        </button>
                      </li>
                      <li>
                        <button onClick={() => { setIsProfileMenuOpen(false); alert("Settings coming soon!"); }} className="w-full text-left px-4 py-3 hover:bg-[#3e3e3e] transition-colors">
                          Settings
                        </button>
                      </li>
                      <li className="border-t border-[#3e3e3e] my-1"></li>
                      <li>
                        <button 
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            logout();
                            signOut(auth);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-[#3e3e3e] transition-colors"
                        >
                          Log out
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
             </div>
          </div>

          <div className="p-6 pt-0 pb-20 bg-gradient-to-b from-[#2a2a2a] to-[#121212] flex-1">
             {activeTab === 'home' && (
                <>
                  <h2 className="text-3xl font-bold text-white mb-6 mt-6 tracking-tight">Good afternoon</h2>
                  
                  {/* Compact Cards Grid (2-column wide) */}
                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                    {tracks.slice(0, 6).map((track, i) => (
                      <div 
                        key={`compact-${track.id}`} 
                        className="bg-white/10 hover:bg-white/20 h-16 sm:h-20 rounded-md cursor-pointer transition-colors group flex items-center shadow-sm overflow-hidden relative"
                        onClick={() => handleTrackSelect(i, tracks)}
                      >
                        <img src={track.coverUrl} className="h-full aspect-square object-cover shadow-[4px_0_12px_rgba(0,0,0,0.5)] z-10" alt="cover" />
                        <div className="flex-1 px-4 truncate font-bold text-white text-[15px] z-10">
                           {track.title}
                        </div>
                        
                        <button 
                          className={`absolute right-24 sm:right-28 text-white w-8 h-8 rounded-full flex items-center justify-center transition-all transform z-20 hover:scale-105 hover:bg-black/30 opacity-0 group-hover:opacity-100`}
                          onClick={(e) => {
                            e.stopPropagation();
                            addToPlaylist(track);
                          }}
                          title="Add to Playlist"
                        >
                           <Plus className="w-5 h-5" />
                        </button>
                        <button 
                          className={`absolute right-16 sm:right-20 text-white w-8 h-8 rounded-full flex items-center justify-center transition-all transform z-20 hover:scale-105 hover:bg-black/30 opacity-0 group-hover:opacity-100`}
                          onClick={(e) => {
                            e.stopPropagation();
                            addToQueue(track);
                          }}
                          title="Add to Next Up"
                        >
                           <ListPlus className="w-5 h-5" />
                        </button>

                        {/* Play Button Overlay */}
                        <button 
                          className={`absolute right-4 bg-[#1db954] text-black w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-xl hover:scale-105 hover:bg-[#1ed760] transition-all transform z-20
                             ${queue === tracks && currentTrackIndex === i && isPlaying ? 'opacity-100 scale-100' : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTrackSelect(i, tracks);
                          }}
                        >
                           {queue === tracks && currentTrackIndex === i && isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-1" />}
                        </button>
                      </div>
                    ))}
                  </div>

                   <h2 className="text-2xl font-bold text-white mb-6 mt-10 tracking-tight hover:underline cursor-pointer inline-block">
                     {playlists.length > 0 ? "Your Playlists" : "Recommended for You"}
                   </h2>
                   <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                     {displayItems.slice(0, 10).map((item: any, i) => {
                        const cover = item.images ? item.images[0]?.url : item.coverUrl;
                        const title = item.name || item.title;
                        const subtitle = item.owner?.display_name || item.artist;

                        return (
                            <div 
                              key={`standard-${item.id}`} 
                              className="bg-[#181818] p-4 rounded-md cursor-pointer hover:bg-[#282828] transition-all duration-300 group flex flex-col shadow-lg hover:scale-105 active:scale-95"
                              onClick={() => {
                                 // If it's a mock track from the fallback, play it
                                 if (!item.images) handleTrackSelect(i, tracks);
                                 else if (item.id === 'uploads' && item.tracks?.items) {
                                     const plTracks = item.tracks.items.map((it: any) => it.track);
                                     if (plTracks.length > 0) handleTrackSelect(0, plTracks);
                                 }
                              }}
                            >
                              <div className="relative aspect-square w-full mb-4 shadow-[0_8px_24px_rgba(0,0,0,0.5)] overflow-hidden rounded flex-shrink-0">
                                <img src={cover || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=100&auto=format&fit=crop'} className="object-cover w-full h-full bg-[#333]" alt="cover" />
                                
                                {/* Play Button Overlay */}
                                <button 
                                  className={`absolute bottom-2 right-2 bg-[#1db954] text-black w-12 h-12 rounded-full flex items-center justify-center shadow-xl hover:scale-105 hover:bg-[#1ed760] transition-all transform duration-300 
                                    ${(!item.images && queue === tracks && currentTrackIndex === i && isPlaying) || (item.id === 'uploads' && isPlaying) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0'}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!item.images) {
                                      handleTrackSelect(i, tracks);
                                    } else if (item.id === 'uploads' && item.tracks?.items) {
                                      const plTracks = item.tracks.items.map((it: any) => it.track);
                                      if (plTracks.length > 0) handleTrackSelect(0, plTracks);
                                    }
                                  }}
                                >
                                   {(!item.images && queue === tracks && currentTrackIndex === i && isPlaying) || (item.id === 'uploads' && isPlaying) ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                                </button>
                              </div>
                              <div className="flex flex-col flex-1 h-full">
                                 <h3 className="font-bold text-white text-[15px] truncate max-w-full pb-1">{title}</h3>
                                 <p 
                                    className="text-sm text-[#b3b3b3] hover:text-white hover:underline truncate max-w-full line-clamp-2 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openArtistPage(subtitle);
                                    }}
                                 >
                                    {subtitle}
                                 </p>
                              </div>
                            </div>
                        );
                     })}
                  </div>
                </>
             )}

             {activeTab === 'search' && (
                <div className="mt-8">
                  
                  {!searchQuery && searchHistory.length > 0 && (
                     <div className="mb-10">
                        <div className="flex justify-between items-end mb-6">
                           <h2 className="text-2xl font-bold text-white tracking-tight">Recent searches</h2>
                           <button 
                             onClick={() => {
                                setSearchHistory([]);
                                try {
                                   localStorage.removeItem('spotify-clone-search-history');
                                } catch(e){}
                             }}
                             className="text-sm font-bold text-[#b3b3b3] hover:underline"
                           >
                              Clear searches
                           </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                           {searchHistory.map((item, i) => (
                               <div 
                                 key={`history-${item.id}-${i}`} 
                                 className="bg-[#181818] p-4 rounded-md cursor-pointer hover:bg-[#282828] transition-all duration-300 group flex flex-col shadow-lg hover:scale-105 active:scale-95"
                                 onClick={() => {
                                    handleTrackSelect(i, searchHistory);
                                    addToSearchHistory(item);
                                 }}
                               >
                                 <div className="relative aspect-square w-full mb-4 shadow-[0_8px_24px_rgba(0,0,0,0.5)] overflow-hidden rounded flex-shrink-0">
                                   <img src={item.coverUrl} className="object-cover w-full h-full bg-[#333]" alt="cover" />
                                     <button 
                                       className={`absolute bottom-2 right-2 bg-[#1db954] text-black w-12 h-12 rounded-full flex items-center justify-center shadow-xl hover:scale-105 hover:bg-[#1ed760] transition-all transform duration-300 
                                         ${queue === searchHistory && currentTrackIndex === i && isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0'}`}
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         handleTrackSelect(i, searchHistory);
                                         addToSearchHistory(item);
                                       }}
                                     >
                                        {queue === searchHistory && currentTrackIndex === i && isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                                     </button>
                                 </div>
                                 <div className="flex flex-col flex-1 h-full">
                                    <h3 className="font-bold text-white text-[15px] truncate max-w-full pb-1">{item.title}</h3>
                                    <p 
                                      className="text-sm text-[#b3b3b3] hover:text-white hover:underline truncate max-w-full line-clamp-2 cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openArtistPage(item.artist);
                                      }}
                                    >
                                       {item.artist}
                                    </p>
                                 </div>
                               </div>
                           ))}
                        </div>
                     </div>
                  )}

                  <h2 className="text-2xl font-bold text-white mb-6">
                     {searchQuery ? "Top results" : "Browse all"}
                  </h2>
                  {isSearching && searchQuery ? (
                     <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                        {Array.from({ length: 12 }).map((_, i) => (
                           <div key={`skeleton-${i}`} className="bg-[#181818] p-4 rounded-md flex flex-col shadow-lg animate-pulse">
                              <div className="relative aspect-square w-full mb-4 bg-[#333] rounded flex-shrink-0"></div>
                              <div className="h-4 bg-[#333] rounded w-3/4 mb-2"></div>
                              <div className="h-3 bg-[#333] rounded w-1/2"></div>
                           </div>
                        ))}
                     </div>
                  ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                      {searchResults.map((item, i) => (
                          <div 
                            key={`search-${item.id}`} 
                            className="bg-[#181818] p-4 rounded-md cursor-pointer hover:bg-[#282828] transition-all duration-300 group flex flex-col shadow-lg hover:scale-105 active:scale-95"
                            onClick={() => {
                               handleTrackSelect(i, searchResults);
                               addToSearchHistory(item);
                            }}
                          >
                            <div className="relative aspect-square w-full mb-4 shadow-[0_8px_24px_rgba(0,0,0,0.5)] overflow-hidden rounded flex-shrink-0">
                              <img src={item.coverUrl} className="object-cover w-full h-full bg-[#333]" alt="cover" />
                                <button 
                                  className={`absolute top-2 right-12 bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center hover:scale-105 hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100 z-10`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToPlaylist(item);
                                  }}
                                  title="Add to Playlist"
                                >
                                   <Plus className="w-5 h-5" />
                                </button>
                                <button 
                                  className={`absolute top-2 right-2 bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center hover:scale-105 hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100 z-10`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToQueue(item);
                                  }}
                                  title="Add to Next Up"
                                >
                                   <ListPlus className="w-5 h-5" />
                                </button>
                                <button 
                                  className={`absolute bottom-2 right-2 bg-[#1db954] text-black w-12 h-12 rounded-full flex items-center justify-center shadow-xl hover:scale-105 hover:bg-[#1ed760] transition-all transform duration-300 
                                    ${queue === searchResults && currentTrackIndex === i && isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0'}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTrackSelect(i, searchResults);
                                    addToSearchHistory(item);
                                  }}
                                >
                                   {queue === searchResults && currentTrackIndex === i && isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                                </button>
                            </div>
                            <div className="flex flex-col flex-1 h-full">
                               <h3 className="font-bold text-white text-[15px] truncate max-w-full pb-1">{item.title}</h3>
                               <p 
                                 className="text-sm text-[#b3b3b3] hover:text-white hover:underline truncate max-w-full line-clamp-2 cursor-pointer"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   openArtistPage(item.artist);
                                 }}
                               >
                                  {item.artist}
                               </p>
                            </div>
                          </div>
                      ))}
                    </div>
                  )}
                  {searchResults.length === 0 && searchQuery && !isSearching && (
                     <div className="text-center text-white mt-10">
                        <h3 className="text-2xl font-bold mb-3">No results found for "{searchQuery}"</h3>
                        <p className="text-[#b3b3b3]">Please make sure your words are spelled correctly or use less or different keywords.</p>
                     </div>
                  )}
                </div>
             )}

             {activeTab === 'liked' && (
                <div className="mt-8">
                  <div className="flex items-center gap-6 mb-8 mt-4">
                     <div className="w-32 h-32 rounded shadow-[0_8px_24px_rgba(0,0,0,0.5)] bg-gradient-to-br from-indigo-700 to-indigo-300 flex items-center justify-center flex-shrink-0">
                        <Heart className="w-16 h-16 text-white fill-current" />
                     </div>
                     <div>
                        <span className="text-sm font-bold text-white block mb-1">Playlist</span>
                        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tighter mb-4">Liked Songs</h1>
                        <span className="text-[#eaeaea] text-[14px]">
                            <span className="font-bold">{firebaseUser ? firebaseUser.displayName || 'User' : 'User'}</span> • {likedTracks.length} songs
                        </span>
                     </div>
                  </div>

                  <div className="flex items-center gap-6 mb-8 mt-4">
                     <button 
                       className="bg-[#1db954] text-black w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:scale-105 hover:bg-[#1ed760] transition-all"
                       onClick={() => handleTrackSelect(0, likedTracks)}
                       disabled={likedTracks.length === 0}
                     >
                       {queue === likedTracks && isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
                     </button>
                  </div>

                  {likedTracks.length === 0 ? (
                     <div className="text-center text-white mt-20">
                        <h3 className="text-2xl font-bold mb-3">Songs you like will appear here</h3>
                        <p className="text-[#b3b3b3]">Save songs by tapping the heart icon.</p>
                     </div>
                  ) : (
                     <div className="flex flex-col gap-2">
                        {likedTracks.map((item, i) => (
                           <div 
                             key={`liked-${item.id}-${i}`} 
                             className={`flex items-center justify-between p-2 rounded-md hover:bg-[#2a2a2a] group cursor-pointer ${queue === likedTracks && currentTrackIndex === i ? 'bg-[#2a2a2a]' : ''}`}
                             onClick={() => handleTrackSelect(i, likedTracks)}
                           >
                              <div className="flex items-center gap-4 flex-1">
                                 <div className="w-8 flex justify-center text-[#b3b3b3] group-hover:hidden">
                                   {queue === likedTracks && currentTrackIndex === i && isPlaying ? (
                                       <EqualizerIcon />
                                   ) : (
                                       <span className={queue === likedTracks && currentTrackIndex === i ? "text-[#1db954]" : ""}>{i + 1}</span>
                                   )}
                                 </div>
                                 <div className="w-8 text-center hidden group-hover:block">
                                    {queue === likedTracks && currentTrackIndex === i && isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
                                 </div>
                                 <img src={item.coverUrl} className="w-10 h-10 rounded object-cover shadow-sm" alt="" />
                                 <div className="flex-col hidden sm:flex truncate pr-4">
                                    <span className={`hover:underline truncate text-[15px] ${queue === likedTracks && currentTrackIndex === i ? "text-[#1db954]" : "text-white"}`}>{item.title}</span>
                                    <span 
                                       className="text-[#b3b3b3] hover:text-white hover:underline truncate text-sm"
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         openArtistPage(item.artist);
                                       }}
                                    >
                                       {item.artist}
                                    </span>
                                 </div>
                              </div>
                              <div className="flex-1 text-[#b3b3b3] text-sm hidden md:block truncate pr-4">
                                  {item.album || item.title}
                              </div>
                              <div className="flex items-center gap-6">
                                 <button 
                                   className="text-[#b3b3b3] hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                   onClick={(e) => {
                                      e.stopPropagation();
                                      addToPlaylist(item);
                                   }}
                                   title="Add to Playlist"
                                 >
                                    <Plus className="w-5 h-5" />
                                 </button>
                                 <button 
                                   className="text-[#b3b3b3] hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                   onClick={(e) => {
                                      e.stopPropagation();
                                      addToQueue(item);
                                   }}
                                   title="Add to Next Up"
                                 >
                                    <ListPlus className="w-5 h-5" />
                                 </button>
                                 <button 
                                   className="text-[#1db954] hover:scale-105 transition-transform"
                                   onClick={(e) => {
                                      e.stopPropagation();
                                      toggleLike(item);
                                   }}
                                 >
                                    <Heart className="w-5 h-5 fill-current" />
                                 </button>
                                 <div className="text-sm text-[#b3b3b3] w-12 text-right">{item.duration}</div>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
                </div>
             )}

             {activeTab === 'playlist' && viewingArtist && (() => {
                const pl = playlists.find(p => p.id === viewingArtist);
                if (!pl) return <div className="p-8 text-white">Playlist not found</div>;
                const plTracks = (pl.tracks.items || []).map(it => it.track);
                return (
                 <div className="mt-8">
                   <div className="flex items-end gap-6 mb-8 mt-4 group relative">
                      <div className="w-48 h-48 rounded shadow-[0_8px_24px_rgba(0,0,0,0.5)] bg-[#282828] flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                         {pl.images && pl.images.length > 0 ? (
                            <img src={pl.images[0].url} className="w-full h-full object-cover" alt="" />
                         ) : (
                            <ListMusic className="w-20 h-20 text-[#b3b3b3]" />
                         )}
                      </div>
                      <div className="flex flex-col flex-1">
                         <span className="text-sm font-bold text-white block mb-2">Playlist</span>
                         <input 
                           value={pl.name}
                           onChange={(e) => {
                               const newName = e.target.value;
                               setPlaylists(prev => prev.map(p => p.id === pl.id ? { ...p, name: newName } : p));
                           }}
                           className="text-5xl md:text-7xl font-extrabold text-white tracking-tighter mb-4 bg-transparent border-b border-transparent focus:border-[#b3b3b3] focus:outline-none transition-colors w-full"
                           placeholder="My Playlist"
                         />
                         <div className="flex items-center gap-2 text-[#eaeaea] text-[14px]">
                             <span className="font-bold">{pl.owner?.display_name || 'User'}</span>
                             <span>•</span>
                             <span>{plTracks.length} songs</span>
                         </div>
                      </div>
                   </div>

                   <div className="flex items-center gap-6 mb-8 mt-4">
                      <button 
                        className="bg-[#1db954] text-black w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:scale-105 hover:bg-[#1ed760] transition-all disabled:opacity-50"
                        onClick={() => handleTrackSelect(0, plTracks)}
                        disabled={plTracks.length === 0}
                      >
                        {queue === plTracks && isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
                      </button>
                      <button 
                         className="text-[#b3b3b3] hover:text-white transition-colors"
                         onClick={() => {
                            if (window.confirm('Delete this playlist?')) {
                                setPlaylists(prev => prev.filter(p => p.id !== pl.id));
                                navigateTo('home');
                            }
                         }}
                         title="Delete Playlist"
                      >
                         <MoreHorizontal className="w-8 h-8" />
                      </button>
                   </div>

                   {plTracks.length === 0 ? (
                      <div className="text-center text-white mt-20 border-t border-[#282828] pt-20">
                         <h3 className="text-2xl font-bold mb-3">Let's find something for your playlist</h3>
                         <p className="text-[#b3b3b3] mb-6">Search for tracks and add them here.</p>
                         <button onClick={() => navigateTo('search')} className="bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform">
                             Go to Search
                         </button>
                      </div>
                   ) : (
                      <div className="flex flex-col gap-2">
                         {plTracks.map((item, i) => (
                            <div 
                              key={`pltrack-${item.id}-${i}`} 
                              className={`flex items-center justify-between p-2 rounded-md hover:bg-[#2a2a2a] group cursor-pointer ${queue === plTracks && currentTrackIndex === i ? 'bg-[#2a2a2a]' : ''}`}
                              onClick={() => handleTrackSelect(i, plTracks)}
                            >
                               <div className="flex items-center gap-4 flex-1">
                                  <div className="w-8 flex justify-center text-[#b3b3b3] group-hover:hidden">
                                    {queue === plTracks && currentTrackIndex === i && isPlaying ? (
                                        <EqualizerIcon />
                                    ) : (
                                        <span className={queue === plTracks && currentTrackIndex === i ? "text-[#1db954]" : ""}>{i + 1}</span>
                                    )}
                                  </div>
                                  <div className="w-8 justify-center hidden group-hover:flex">
                                     {queue === plTracks && currentTrackIndex === i && isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
                                  </div>
                                  <img src={item.coverUrl} className="w-10 h-10 rounded object-cover shadow-sm" alt="" />
                                  <div className="flex-1 flex flex-col">
                                     <span className={`hover:underline truncate text-[15px] ${queue === plTracks && currentTrackIndex === i ? "text-[#1db954]" : "text-white"}`}>{item.title}</span>
                                     <span 
                                        className="text-[#b3b3b3] hover:text-white hover:underline truncate text-sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openArtistPage(item.artist);
                                        }}
                                     >
                                        {item.artist}
                                     </span>
                                  </div>
                               </div>
                               
                               <div className="flex items-center gap-4">
                                  <button 
                                    className="text-[#b3b3b3] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity p-2"
                                    onClick={(e) => {
                                       e.stopPropagation();
                                       setPlaylists(prev => prev.map(p => {
                                          if (p.id === pl.id) {
                                             return {
                                                ...p,
                                                tracks: {
                                                   ...p.tracks,
                                                   items: p.tracks.items?.filter((_, index) => index !== i)
                                                }
                                             };
                                          }
                                          return p;
                                       }));
                                    }}
                                    title="Remove from Playlist"
                                  >
                                     <X className="w-5 h-5" />
                                  </button>
                                  <button 
                                    className={`${likedTracks.some(t => t.id === item.id) ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'} hover:scale-105 transition-transform`}
                                    onClick={(e) => {
                                       e.stopPropagation();
                                       toggleLike(item);
                                    }}
                                  >
                                     <Heart className={`w-5 h-5 ${likedTracks.some(t => t.id === item.id) ? 'fill-current' : ''}`} />
                                  </button>
                                  <div className="text-sm text-[#b3b3b3] w-12 text-right">{item.duration}</div>
                               </div>
                            </div>
                         ))}
                      </div>
                   )}
                 </div>
                );
             })()}

             {activeTab === 'artist' && viewingArtist && (
                <div className="mt-8">
                  <div className="flex items-center gap-6 mb-8">
                     <div className="w-32 h-32 rounded-full overflow-hidden bg-[#282828] shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
                        <img src="https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=300&auto=format&fit=crop" className="object-cover w-full h-full opacity-60" alt="" />
                     </div>
                     <div>
                        <span className="text-sm font-bold text-white uppercase block mb-1 flex items-center gap-2">
                            <BadgeCheck className="w-5 h-5 text-[#1db954] fill-[#1db954]" /> Verified Artist
                        </span>
                        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tighter mb-4">{viewingArtist}</h1>
                        <span className="text-[#eaeaea] text-[14px]">
                            {getMonthlyListeners(viewingArtist)} monthly listeners
                        </span>
                     </div>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-white mb-6">Popular</h2>
                  
                  {isFetchingArtist ? (
                     <div className="text-[#b3b3b3]">Loading top tracks...</div>
                  ) : (
                     <div className="flex flex-col gap-2">
                        {artistTopTracks.map((item, i) => (
                           <div 
                             key={`artist-track-${item.id}`}
                             className="flex items-center p-2 hover:bg-white/10 rounded-md cursor-pointer group transition-colors"
                             onClick={() => handleTrackSelect(i, artistTopTracks)}
                           >
                              <div className="w-8 flex justify-center text-[#b3b3b3] group-hover:hidden">
                                {queue === artistTopTracks && currentTrackIndex === i && isPlaying ? (
                                    <EqualizerIcon />
                                ) : (
                                    <span className={queue === artistTopTracks && currentTrackIndex === i ? "text-[#1db954]" : ""}>{i + 1}</span>
                                )}
                              </div>
                              <div className="w-8 text-center hidden group-hover:block">
                                 {queue === artistTopTracks && currentTrackIndex === i && isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
                              </div>
                              <img src={item.coverUrl} className="w-10 h-10 rounded mr-4 object-cover shadow-sm" alt="" />
                              <div className="flex-1 flex flex-col">
                                 <span className={`hover:underline truncate text-[15px] ${queue === artistTopTracks && currentTrackIndex === i ? "text-[#1db954]" : "text-white"}`}>{item.title}</span>
                              </div>
                              <div className="flex-1 text-[#b3b3b3] text-sm hidden md:block">
                                  {getPlayCount(item.title, item.artist)}
                              </div>
                              <button 
                                className="text-[#b3b3b3] hover:text-white mr-4 transition-colors opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                   e.stopPropagation();
                                   addToPlaylist(item);
                                }}
                                title="Add to Playlist"
                              >
                                 <Plus className="w-5 h-5" />
                              </button>
                              <button 
                                className="text-[#b3b3b3] hover:text-white mr-4 transition-colors opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                   e.stopPropagation();
                                   addToQueue(item);
                                }}
                                title="Add to Next Up"
                              >
                                 <ListPlus className="w-5 h-5" />
                              </button>
                              <button 
                                className={`${likedTracks.some(t => t.id === item.id) ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'} mr-4 transition-transform hover:scale-105 opacity-0 group-hover:opacity-100 ${likedTracks.some(t => t.id === item.id) ? 'opacity-100' : ''}`}
                                onClick={(e) => {
                                   e.stopPropagation();
                                   toggleLike(item);
                                }}
                              >
                                 <Heart className={`w-5 h-5 ${likedTracks.some(t => t.id === item.id) ? 'fill-current' : ''}`} />
                              </button>
                              <div className="text-sm text-[#b3b3b3] w-16 text-right pr-4">{item.duration}</div>
                           </div>
                        ))}
                     </div>
                  )}

                  {/* Albums Section */}
                  {artistAlbums.length > 0 && (
                      <div className="mt-12">
                          <h2 className="text-2xl font-bold text-white mb-6">Discography</h2>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                              {artistAlbums.map((album) => (
                                  <div 
                                    key={`album-${album.id}`} 
                                    className="bg-[#181818] p-4 rounded-md hover:bg-[#282828] transition-all duration-300 group flex flex-col shadow-lg hover:scale-105 cursor-pointer active:scale-95"
                                  >
                                    <div className="relative aspect-square w-full mb-4 shadow-[0_8px_24px_rgba(0,0,0,0.5)] overflow-hidden rounded flex-shrink-0">
                                      <img src={album.coverUrl} className="object-cover w-full h-full bg-[#333]" alt="cover" />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-start overflow-hidden">
                                       <span className="font-bold text-white mb-1 truncate" title={album.name}>{album.name}</span>
                                       <p className="text-sm text-[#b3b3b3] truncate">
                                          {album.year} • {album.type}
                                       </p>
                                    </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  {/* About Section */}
                  <div className="mt-12">
                     <h2 className="text-2xl font-bold text-white mb-6">About</h2>
                     <div className="bg-[#282828] rounded-xl hover:bg-[#333] transition-colors cursor-pointer group overflow-hidden max-w-3xl">
                        <div className="h-64 sm:h-96 w-full relative">
                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                           <img src="https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=1200&auto=format&fit=crop" className="w-full h-full object-cover" alt="Artist background" />
                           <div className="absolute bottom-6 left-6 z-20">
                              <div className="font-bold text-white text-3xl flex items-center gap-2 mb-2">
                                {viewingArtist} <BadgeCheck className="w-6 h-6 text-[#3d91f4] fill-white" />
                              </div>
                              <div className="text-white font-semibold">
                                 {getMonthlyListeners(viewingArtist)} monthly listeners
                              </div>
                           </div>
                        </div>
                        <div className="p-6 text-[#b3b3b3] group-hover:text-white transition-colors">
                           <p className="line-clamp-3 leading-relaxed">
                              {viewingArtist} is one of the most prominent artists of our generation, shaping the landscape of modern music with unparalleled creativity and profound lyricism. Rising through the ranks with consistency and authenticity, they have captivated millions of listeners worldwide. Their discography stands out as a unique voice that echoes through diverse cultures and demographics, blending raw emotion with innovative production.
                           </p>
                        </div>
                     </div>
                  </div>
                </div>
             )}

             {activeTab === 'profile' && (
                <div className="mt-8">
                  <div className="flex items-end gap-6 mb-8 mt-12 group relative">
                     <div className="w-48 h-48 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.5)] bg-[#282828] flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                        {firebaseUser?.photoURL ? (
                           <img src={firebaseUser.photoURL} className="w-full h-full object-cover" alt="Profile" />
                        ) : (
                           <UserCircle2 className="w-24 h-24 text-[#b3b3b3]" />
                        )}
                     </div>
                     <div className="flex flex-col flex-1">
                        <span className="text-sm font-bold text-white block mb-2 uppercase">Profile</span>
                        <h1 className="text-5xl md:text-8xl font-extrabold text-white tracking-tighter mb-4">{firebaseUser?.displayName || 'User'}</h1>
                        <div className="flex items-center gap-2 text-[#eaeaea] text-[14px]">
                            <span>{playlists.filter(p => p.id !== 'uploads').length} Public Playlists</span>
                            <span>•</span>
                            <span>{likedTracks.length} Liked Songs</span>
                        </div>
                     </div>
                  </div>

                  <div className="mt-12">
                     <h2 className="text-2xl font-bold text-white mb-6">Top followers</h2>
                     <div className="text-[#b3b3b3] p-4 text-center border border-[#282828] rounded-md">
                        <p>Followers will appear here.</p>
                     </div>
                  </div>
                </div>
             )}

             {activeTab === 'queue' && (
                <div className="mt-8">
                  <h2 className="text-2xl font-bold text-white mb-6">Queue</h2>
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-4">Now playing</h3>
                    {currentTrack ? (
                       <div className="flex items-center gap-4 p-2 rounded-md hover:bg-[#1a1a1a] transition-colors group">
                           <div className="w-8 flex justify-center text-[#1db954]">
                              {isPlaying ? <EqualizerIcon /> : <span>1</span>}
                           </div>
                           <img src={currentTrack.coverUrl} className="w-10 h-10 rounded object-cover shadow-sm" alt="" />
                           <div className="flex-1 flex flex-col">
                              <span className="text-[#1db954] hover:underline cursor-pointer truncate text-[15px]">{currentTrack.title}</span>
                              <span 
                                 className="text-[#b3b3b3] hover:text-white hover:underline truncate text-sm cursor-pointer"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   openArtistPage(currentTrack.artist);
                                 }}
                              >
                                {currentTrack.artist}
                              </span>
                           </div>
                       </div>
                    ) : (
                       <p className="text-[#b3b3b3] text-sm">Nothing is playing right now.</p>
                    )}
                  </div>

                  {queue.length > 0 && currentTrackIndex < queue.length - 1 && (
                     <div>
                       <h3 className="text-lg font-bold text-white mb-4">Next up</h3>
                       <div className="flex flex-col gap-2">
                          {queue.slice(currentTrackIndex + 1).map((item, idx) => (
                              <div 
                                key={`${item.id}-${idx}`}
                                className="flex items-center gap-4 p-2 rounded-md hover:bg-[#1a1a1a] transition-colors group cursor-pointer"
                                onClick={() => {
                                   const newIndex = currentTrackIndex + 1 + idx;
                                   setCurrentTrackIndex(newIndex);
                                   playMusic(newIndex);
                                }}
                              >
                                 <div className="w-8 flex justify-center text-[#b3b3b3] group-hover:hidden">
                                    <span>{idx + 2}</span>
                                 </div>
                                 <div className="w-8 text-center hidden group-hover:block">
                                    <Play className="w-4 h-4 text-white" />
                                 </div>
                                 <img src={item.coverUrl} className="w-10 h-10 rounded object-cover shadow-sm" alt="" />
                                 <div className="flex-1 flex flex-col">
                                    <span className="text-white hover:underline truncate text-[15px]">{item.title}</span>
                                    <span 
                                       className="text-[#b3b3b3] hover:text-white hover:underline truncate text-sm"
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         openArtistPage(item.artist);
                                       }}
                                    >
                                      {item.artist}
                                    </span>
                                 </div>
                              </div>
                          ))}
                       </div>
                     </div>
                  )}
                </div>
             )}
          </div>

        </div>

        {/* Right Sidebar */}
        <AnimatePresence>
          {isRightSidebarOpen && currentTrack && (
            <motion.div 
              initial={{ opacity: 0, width: 0, scale: 0.95 }}
              animate={{ opacity: 1, width: '100%', maxWidth: '320px', scale: 1 }}
              exit={{ opacity: 0, width: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-[280px] xl:w-[320px] bg-[#121212] flex flex-col rounded-lg overflow-y-auto h-full p-4 shrink-0 absolute right-0 z-50 lg:relative hidden md:flex border-l border-[#282828] lg:border-none shadow-2xl lg:shadow-none bg-[#121212]"
              style={{ originX: 1 }}
            >
               <div className="flex justify-between items-center mb-4">
                 <span className="font-bold text-white text-[16px] truncate hover:underline cursor-pointer">{currentTrack.album || currentTrack.title}</span>
                 <div className="flex gap-4 items-center shrink-0 ml-2">
                   <button className="text-[#b3b3b3] hover:text-white transition-colors" title="More options"><MoreHorizontal className="w-5 h-5"/></button>
                   <button className="text-[#b3b3b3] hover:text-white transition-colors" onClick={() => setIsRightSidebarOpen(false)} title="Close"><X className="w-5 h-5"/></button>
                 </div>
               </div>

               <div className="w-full aspect-square bg-[#282828] rounded-lg overflow-hidden mb-4 shadow-lg shrink-0">
                 <motion.img 
                    key={currentTrack.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    src={currentTrack.coverUrl} className="w-full h-full object-cover" alt="now playing" 
                 />
               </div>

               <div className="flex items-start justify-between mb-6 shrink-0">
                 <div className="flex flex-col truncate pr-2">
                   <motion.h2 key={currentTrack.title} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold text-white truncate hover:underline cursor-pointer tracking-tight">{currentTrack.title}</motion.h2>
                   <motion.p key={currentTrack.artist} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-[#b3b3b3] hover:text-white hover:underline cursor-pointer truncate text-[15px]">{currentTrack.artist}</motion.p>
                 </div>
                 <button 
                  onClick={() => toggleLike(currentTrack)}
                  className={`${likedTracks.some(t => t.id === currentTrack.id) ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'} hover:scale-105 transition-transform shrink-0 mt-1`}
                 >
                    <Heart className={`w-6 h-6 ${likedTracks.some(t => t.id === currentTrack.id) ? 'fill-current' : ''}`} />
                 </button>
               </div>

               <div className="bg-[#242424] rounded-lg overflow-hidden group cursor-pointer hover:bg-[#282828] transition-colors shrink-0 mb-4">
                 <div className="relative w-full h-[180px]">
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                   <img src={currentTrack.coverUrl} className="w-full h-full object-cover absolute inset-0 mix-blend-overlay opacity-60" alt="" />
                   <div className="absolute top-4 left-4 z-20">
                      <span className="font-bold text-white text-[15px]">About the artist</span>
                   </div>
                 </div>
                 <div className="p-4 relative -mt-10 z-20">
                   <div className="flex items-center gap-2 mb-2">
                     <h3 className="text-white font-bold text-lg hover:underline truncate">{currentTrack.artist}</h3>
                     <BadgeCheck className="w-5 h-5 text-[#3d91f4] fill-white" />
                   </div>
                   <div className="flex flex-col gap-2">
                      <span className="text-[#b3b3b3] text-[15px]">{getMonthlyListeners(currentTrack.artist)} monthly listeners</span>
                      <button className="mt-2 w-fit px-4 py-1.5 border border-[#878787] rounded-full text-white text-[14px] font-bold hover:scale-105 hover:border-white transition-all">Follow</button>
                      <p className="text-[#b3b3b3] text-sm mt-3 line-clamp-3">you in dreamworld and u listening to dreamboy</p>
                   </div>
                 </div>
               </div>

               <div className="bg-[#242424] rounded-lg overflow-hidden shrink-0 mt-2 p-4">
                  <span className="font-bold text-white text-[15px] mb-4 block">Lyrics</span>
                  {isFetchingLyrics ? (
                     <div className="flex justify-center py-6">
                        <Loader2 className="w-6 h-6 text-[#b3b3b3] animate-spin" />
                     </div>
                  ) : lyrics ? (
                     <div className="text-[#eaeaea] text-[14px] whitespace-pre-wrap leading-relaxed">
                         {lyrics.replace(/Paroles de la chanson .*\n/gi, '')}
                     </div>
                  ) : (
                     <div className="text-[#b3b3b3] text-[14px] text-center py-4">
                         We don't have lyrics for this song.
                     </div>
                  )}
               </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Player Bar (Footer) */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="h-[90px] bg-black border-t border-[#282828] flex items-center px-4 justify-between w-full z-50 fixed bottom-0 left-0 right-0 pb-2 pt-2"
      >
        {/* Track Info */}
        <div className="flex items-center gap-4 w-[30%] min-w-[180px]">
          <AnimatePresence mode="popLayout">
            {currentTrack && (
                <motion.div 
                   key={currentTrack.id}
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: 20 }}
                   className="flex items-center gap-4"
                >
                  <img src={currentTrack.coverUrl} className="w-14 h-14 rounded shadow-sm object-cover" alt="" />
                  <div className="flex flex-col overflow-hidden">
                      <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white hover:underline cursor-pointer truncate max-w-full">{currentTrack.title}</span>
                          {isPlaying && <EqualizerIcon />}
                      </div>
                      <span 
                        className="text-xs text-[#b3b3b3] hover:text-white hover:underline cursor-pointer truncate max-w-full"
                        onClick={() => openArtistPage(currentTrack.artist)}
                      >
                        {currentTrack.artist}
                      </span>
                  </div>
                  <button 
                    className={`${likedTracks.some(t => t.id === currentTrack.id) ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'} ml-2 flex-shrink-0 transition-transform hover:scale-105`}
                    onClick={() => toggleLike(currentTrack)}
                  >
                      <Heart className={`w-5 h-5 ${likedTracks.some(t => t.id === currentTrack.id) ? 'fill-current' : ''}`} />
                  </button>
                </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Player Controls Center */}
        <div className="flex flex-col items-center max-w-[40%] w-full flex-1 px-4">
          <div className="flex items-center gap-5 mb-1">
            <button 
              onClick={toggleShuffle}
              className={`transition-colors hover:scale-105 ${isShuffled ? 'text-[#1db954] relative after:content-[""] after:absolute after:w-1 after:h-1 after:bg-[#1db954] after:rounded-full after:-bottom-2 after:left-1/2 after:-translate-x-1/2' : 'text-[#b3b3b3] hover:text-white'}`}
            >
               <Shuffle className="w-4 h-4" />
            </button>
            <button onClick={handlePrev} className="text-[#b3b3b3] hover:text-white transition-colors">
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            <button 
              onClick={togglePlayPause} 
              className="bg-white text-black rounded-full w-8 h-8 flex items-center justify-center hover:scale-105 transition-transform"
            >
               <AnimatePresence mode="popLayout" initial={false}>
                  {isPlaying ? (
                     <motion.div key="pause" initial={{ opacity: 0, scale: 0.5, rotate: -90 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.5, rotate: 90 }} transition={{ duration: 0.2 }}>
                        <Pause className="w-4 h-4 fill-current" />
                     </motion.div>
                  ) : (
                     <motion.div key="play" initial={{ opacity: 0, scale: 0.5, rotate: -90 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.5, rotate: 90 }} transition={{ duration: 0.2 }}>
                        <Play className="w-4 h-4 fill-current ml-1" />
                     </motion.div>
                  )}
               </AnimatePresence>
            </button>
            <button onClick={() => handleNext(false)} className="text-[#b3b3b3] hover:text-white transition-colors">
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
             <button 
               onClick={toggleRepeat}
               className={`transition-colors hover:scale-105 ${repeatMode !== 'off' ? 'text-[#1db954] relative after:content-[""] after:absolute after:w-1 after:h-1 after:bg-[#1db954] after:rounded-full after:-bottom-2 after:left-1/2 after:-translate-x-1/2' : 'text-[#b3b3b3] hover:text-white'}`}
             >
               {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="flex items-center w-full gap-2 text-xs text-[#b3b3b3]">
            <span className="w-10 text-right">{formatTime(progress)}</span>
            <input 
              type="range"
              min="0"
              max={duration || 100}
              value={progress}
              onChange={handleSeek}
              onMouseEnter={() => setIsProgressHovered(true)}
              onMouseLeave={() => setIsProgressHovered(false)}
              className="spotify-range w-full"
              style={{
                 background: `linear-gradient(to right, ${isProgressHovered ? '#1db954' : '#fff'} ${duration ? (progress / duration) * 100 : 0}%, #4d4d4d ${duration ? (progress / duration) * 100 : 0}%)`
              }}
            />
            <span className="w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Extra Controls */}
        <div className="flex justify-end items-center w-[30%] min-w-[180px] gap-3">
          <Volume2 className="w-5 h-5 text-[#b3b3b3]" />
          <input 
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolume}
            onMouseEnter={() => setIsVolumeHovered(true)}
            onMouseLeave={() => setIsVolumeHovered(false)}
            className="spotify-range w-24"
            style={{
               background: `linear-gradient(to right, ${isVolumeHovered ? '#1db954' : '#fff'} ${volume * 100}%, #4d4d4d ${volume * 100}%)`
            }}
          />
          <button
            onClick={() => navigateTo('queue')}
            className={`transition-colors p-1 rounded-full ${activeTab === 'queue' ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'}`}
            title="Queue"
          >
             <ListMusic className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)} 
            className={`transition-colors p-1 rounded-full ${isRightSidebarOpen ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'}`}
          >
            <PanelRightClose className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
