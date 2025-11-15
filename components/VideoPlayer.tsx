"use client";

import { useEffect, useRef, useState } from "react";
import YouTube, { YouTubePlayer } from "react-youtube";
import { Socket } from "socket.io-client";
import { Play, Pause, Search, Crown, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VideoPlayerProps {
  socket: Socket | null;
  currentVideoId: string;
  setCurrentVideoId: (videoId: string) => void;
  isHost: boolean;
  memberCount: number;
  serverUrl: string;
}

interface VideoResult {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: {
      medium: { url: string };
    };
  };
}

export default function VideoPlayer({
  socket,
  currentVideoId,
  setCurrentVideoId,
  isHost,
  memberCount,
  serverUrl,
}: VideoPlayerProps) {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VideoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const isSyncing = useRef(false);
  const lastSeekTime = useRef<number>(0);
  const syncTimeout = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Auto show search if host and no video
  useEffect(() => {
    if (isHost && !currentVideoId) {
      setShowSearch(true);
    } else {
      setShowSearch(false);
    }
  }, [isHost, currentVideoId]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleChangeVideo = ({
      videoId,
      startTime = 0,
    }: {
      videoId: string;
      startTime?: number;
    }) => {
      console.log("Received change_video:", videoId, startTime);
      setCurrentVideoId(videoId);

      if (playerRef.current && isReady) {
        setTimeout(() => {
          if (playerRef.current) {
            isSyncing.current = true;
            playerRef.current.seekTo(startTime, true);
            setTimeout(() => {
              isSyncing.current = false;
            }, 500);
          }
        }, 1000);
      }
    };

    const handlePlay = ({ time }: { time: number }) => {
      console.log("Received play at:", time);
      if (!playerRef.current || !isReady || isSyncing.current) return;

      isSyncing.current = true;
      playerRef.current.seekTo(time, true);
      playerRef.current.playVideo();

      if (syncTimeout.current) clearTimeout(syncTimeout.current);
      syncTimeout.current = setTimeout(() => {
        isSyncing.current = false;
      }, 1000);
    };

    const handlePause = ({ time }: { time: number }) => {
      console.log("Received pause at:", time);
      if (!playerRef.current || !isReady || isSyncing.current) return;

      isSyncing.current = true;
      playerRef.current.seekTo(time, true);
      playerRef.current.pauseVideo();

      if (syncTimeout.current) clearTimeout(syncTimeout.current);
      syncTimeout.current = setTimeout(() => {
        isSyncing.current = false;
      }, 1000);
    };

    const handleSeek = ({ time }: { time: number }) => {
      console.log("Received seek to:", time);
      if (!playerRef.current || !isReady || isSyncing.current) return;

      const currentTime = playerRef.current.getCurrentTime();
      const timeDiff = Math.abs(currentTime - time);

      if (timeDiff > 2) {
        isSyncing.current = true;
        playerRef.current.seekTo(time, true);

        if (syncTimeout.current) clearTimeout(syncTimeout.current);
        syncTimeout.current = setTimeout(() => {
          isSyncing.current = false;
        }, 1000);
      }
    };

    const handleSyncState = async (state: {
      videoId: string;
      currentTime: number;
      isPlaying: boolean;
      time?: number;
      playing?: boolean;
    }) => {
      console.log("Received sync_state:", state);
      if (!playerRef.current || !isReady) return;

      const time = state.currentTime ?? state.time ?? 0;
      const playing = state.isPlaying ?? state.playing ?? false;

      isSyncing.current = true;

      if (state.videoId && state.videoId !== currentVideoId) {
        setCurrentVideoId(state.videoId);
      }

      playerRef.current.seekTo(time, true);

      if (playing) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }

      if (syncTimeout.current) clearTimeout(syncTimeout.current);
      syncTimeout.current = setTimeout(() => {
        isSyncing.current = false;
      }, 1500);
    };

    socket.on("change_video", handleChangeVideo);
    socket.on("play", handlePlay);
    socket.on("pause", handlePause);
    socket.on("seek", handleSeek);
    socket.on("sync_state", handleSyncState);

    return () => {
      socket.off("change_video", handleChangeVideo);
      socket.off("play", handlePlay);
      socket.off("pause", handlePause);
      socket.off("seek", handleSeek);
      socket.off("sync_state", handleSyncState);

      if (syncTimeout.current) {
        clearTimeout(syncTimeout.current);
      }
    };
  }, [socket, isReady, currentVideoId, setCurrentVideoId]);

  // Player ready
  const onReady = (event: { target: YouTubePlayer }) => {
    console.log("YouTube player ready");
    playerRef.current = event.target;
    setIsReady(true);

    if (!isHost && socket) {
      setTimeout(() => {
        console.log("Requesting sync from host...");
        socket.emit("request_sync");
      }, 1000);
    }
  };

  // State change
  const onStateChange = async (event: {
    target: YouTubePlayer;
    data: number;
  }) => {
    if (!socket || isSyncing.current || !isHost) return;

    const currentTime = await event.target.getCurrentTime();
    setIsPlaying(event.data === 1);

    console.log("Player state changed:", event.data, "time:", currentTime);

    if (event.data === 1) {
      console.log("Emitting play event");
      socket.emit("play", { time: currentTime });
    } else if (event.data === 2) {
      console.log("Emitting pause event");
      socket.emit("pause", { time: currentTime });
    }
  };

  // Seek detection
  useEffect(() => {
    if (!socket || !isHost || !playerRef.current || !isReady) return;

    const checkSeek = async () => {
      if (!playerRef.current || isSyncing.current) return;

      try {
        const currentTime = await playerRef.current.getCurrentTime();
        const timeDiff = Math.abs(currentTime - lastSeekTime.current);

        if (timeDiff > 2) {
          console.log(
            "Detected seek from",
            lastSeekTime.current,
            "to",
            currentTime
          );
          socket.emit("seek", { time: currentTime });
        }

        lastSeekTime.current = currentTime;
      } catch (error) {
        // Player might not be ready yet
      }
    };

    const interval = setInterval(checkSeek, 500);

    return () => clearInterval(interval);
  }, [socket, isHost, isReady]);

  // Sync requests (host only)
  useEffect(() => {
    if (!socket || !isHost) return;

    const handleRequestSync = async ({ toSocket }: { toSocket: string }) => {
      if (!playerRef.current || !isReady) {
        console.log("Player not ready for sync");
        return;
      }

      try {
        console.log("Sync requested by", toSocket);
        const currentTime = await playerRef.current.getCurrentTime();
        const playerState = await playerRef.current.getPlayerState();
        const isPlayingState = playerState === 1;

        const state = {
          videoId: currentVideoId,
          currentTime,
          isPlaying: isPlayingState,
        };

        console.log("Sending sync state:", state);
        socket.emit("sync_state", {
          toSocket,
          state,
        });
      } catch (error) {
        console.error("Error syncing state:", error);
      }
    };

    socket.on("request_sync_from_host", handleRequestSync);

    return () => {
      socket.off("request_sync_from_host", handleRequestSync);
    };
  }, [socket, isHost, currentVideoId, isReady]);

  const handleTopSearch = (input: string) => {
    if (!input.trim()) return;

    // Check if it's a YouTube URL
    const videoIdMatch = input.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/
    );
    if (videoIdMatch) {
      const videoId = videoIdMatch[1];
      if (socket) {
        socket.emit("change_video", { videoId, startTime: 0 });
      }
      setCurrentVideoId(videoId);
      setQuery("");
      toast({
        title: "Video Loaded",
        description: "Playing from URL",
      });
      return;
    }

    // Otherwise, treat as search query
    setQuery(input);
    setShowSearch(true);
    searchVideos(input);
  };

  const searchVideos = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) {
      toast({
        title: "Empty Query",
        description: "Please enter a search term",
        variant: "destructive",
      });
      return;
    }

    if (!serverUrl) {
      toast({
        title: "Error",
        description: "Server URL not available",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${serverUrl}/api/search?q=${encodeURIComponent(q)}&maxResults=10`
      );
      const data = await response.json();

      if (data.items) {
        setResults(data.items);
      } else {
        toast({
          title: "No Results",
          description: "No videos found for your search",
          variant: "destructive",
        });
        setResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Failed",
        description: "Failed to search videos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSelect = (videoId: string, videoTitle: string) => {
    if (!socket) {
      toast({
        title: "Not Connected",
        description: "Socket connection not available",
        variant: "destructive",
      });
      return;
    }

    console.log("Selecting video:", videoId);

    socket.emit("change_video", {
      videoId,
      startTime: 0,
    });

    setCurrentVideoId(videoId);
    setShowSearch(false);
    setQuery("");
    setResults([]);

    toast({
      title: "Video Changed",
      description: `Now playing: ${videoTitle}`,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleTopSearch(e.currentTarget.value);
    }
  };

  const handleTogglePlay = () => {
    if (!playerRef.current || isSyncing.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  if (!currentVideoId && !isHost) {
    return (
      <div className="flex-1 flex flex-col bg-black">
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                <Play className="w-4 h-4 text-white fill-current" />
              </div>
              <span className="font-semibold text-gray-900 hidden sm:inline">
                WatchTogether
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">
                  {memberCount} watching
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-black relative">
          <div className="text-center p-8">
            <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              No video selected
            </h2>
            <p className="text-gray-400 mb-6">
              Waiting for host to select a video...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-black relative">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <Play className="w-4 h-4 text-white fill-current" />
            </div>
            <span className="font-semibold text-gray-900 hidden sm:inline">
              WatchTogether
            </span>
          </div>
          {isHost && (
            <div className="flex-1 max-w-2xl relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Paste YouTube URL or search for videos..."
                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-full focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
              <button
                onClick={() => handleTopSearch(query)}
                disabled={loading || !query.trim()}
                className="absolute right-1 top-1 bottom-1 px-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Search className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">
                {memberCount} watching
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center bg-black relative">
        {currentVideoId ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-full aspect-video max-h-full">
              <YouTube
                videoId={currentVideoId}
                opts={{
                  width: "100%",
                  height: "100%",
                  playerVars: {
                    autoplay: 0,
                    controls: isHost ? 1 : 0,
                    modestbranding: 1,
                    rel: 0,
                    fs: 1,
                  },
                }}
                onReady={onReady}
                onStateChange={onStateChange}
                className="w-full h-full"
              />
            </div>
          </div>
        ) : (
          <div className="text-center p-8">
            <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              No video selected
            </h2>
            <p className="text-gray-400 mb-6">
              Use the search bar above to get started
            </p>
          </div>
        )}
      </div>
      {/* {currentVideoId && isHost && (
        <div className="bg-gray-900 border-t border-gray-800 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
            <button
              onClick={handleTogglePlay}
              className="p-3 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white fill-current" />
              )}
            </button>
            <div className="text-white text-sm flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span>You're controlling playback</span>
            </div>
          </div>
        </div>
      )} */}

      {/* Search Overlay - only for query results */}
      {isHost && showSearch && (
        <div className="absolute inset-0 z-10 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">
                Search Results for "{query}"
              </h3>
              <button
                onClick={() => {
                  setShowSearch(false);
                  setResults([]);
                }}
                className="text-gray-500 hover:text-gray-700 p-1 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto p-4 space-y-3">
                {loading && (
                  <div className="text-center py-4 text-gray-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Searching...</span>
                  </div>
                )}
                {!loading && results.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-2 opacity-50 text-gray-400" />
                    <p>No videos found for "{query}"</p>
                  </div>
                )}
                {results.map((video) => (
                  <div
                    key={video.id.videoId}
                    className="cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-lg overflow-hidden transition-all p-3"
                    onClick={() =>
                      handleVideoSelect(video.id.videoId, video.snippet.title)
                    }
                  >
                    <div className="flex gap-3">
                      <div className="relative flex-shrink-0">
                        <img
                          src={video.snippet.thumbnails.medium.url}
                          alt={video.snippet.title}
                          className="w-40 h-24 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center rounded-lg">
                          <Play className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-all" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                          {video.snippet.title}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {video.snippet.channelTitle}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
