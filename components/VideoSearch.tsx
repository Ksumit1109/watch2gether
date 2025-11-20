"use client";

import { useState, useEffect } from "react";
import { Socket } from "socket.io-client";
import { Search, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface VideoSearchProps {
  socket: Socket | null;
  serverUrl: string;
  initialQuery?: string;
  onVideoSelect?: (videoId: string) => void;
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

export default function VideoSearch({
  socket,
  serverUrl,
  initialQuery = "",
  onVideoSelect,
}: VideoSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<VideoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Auto-search when initialQuery is provided
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      searchVideos(initialQuery);
    }
  }, [initialQuery]);

  const searchVideos = async (searchQuery?: string) => {
    const queryToSearch = searchQuery || query;

    if (!queryToSearch.trim()) {
      toast({
        title: "Empty Query",
        description: "Please enter a search term",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${serverUrl}/api/search?q=${encodeURIComponent(
          queryToSearch
        )}&maxResults=10`
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

    // Emit change_video event to all users in the room
    socket.emit("change_video", {
      videoId,
      startTime: 0,
    });

    // Update local state if callback provided
    if (onVideoSelect) {
      onVideoSelect(videoId);
    }

    toast({
      title: "Video Changed",
      description: `Now playing: ${videoTitle}`,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchVideos();
    }
  };

  return (
    <div className="flex flex-col bg-[#212121] rounded-xl overflow-hidden h-[70vh]">
      {/* Search Header */}
      <div className="p-4 border-b border-[#303030] flex-shrink-0">
        <div className="yt-search">
          <Input
            type="text"
            placeholder="Search YouTube..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-transparent border-0 text-[#f1f1f1] placeholder:text-[#717171] focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button
            onClick={() => searchVideos()}
            disabled={loading}
            size="icon"
            className="bg-[#272727] hover:bg-[#3f3f3f] text-[#f1f1f1] rounded-none border-l border-[#303030]"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Results - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-3">
          {results.length === 0 && !loading && (
            <div className="text-center py-12 px-4">
              <Search className="w-12 h-12 mx-auto mb-3 text-[#717171]" />
              <p className="text-[#aaaaaa] text-sm">
                Search for videos to add to your watch party
              </p>
            </div>
          )}

          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="yt-thumbnail bg-[#272727]" />
                  <div className="mt-2 space-y-2">
                    <div className="h-4 bg-[#272727] rounded w-3/4" />
                    <div className="h-3 bg-[#272727] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {results.map((video) => (
            <div
              key={video.id.videoId}
              className="group cursor-pointer"
              onClick={() =>
                handleVideoSelect(video.id.videoId, video.snippet.title)
              }
            >
              {/* Thumbnail */}
              <div className="yt-thumbnail">
                <img
                  src={video.snippet.thumbnails.medium.url}
                  alt={video.snippet.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                  <div className="w-12 h-12 bg-[#FF0000] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100">
                    <Play className="w-6 h-6 text-white ml-1" />
                  </div>
                </div>
              </div>

              {/* Video Info */}
              <div className="mt-2 px-1">
                <h4 className="yt-video-title mb-1">{video.snippet.title}</h4>
                <p className="yt-metadata">{video.snippet.channelTitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
