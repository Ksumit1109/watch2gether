"use client";

import { useState } from "react";
import { Socket } from "socket.io-client";
import { Search, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface VideoSearchProps {
  socket: Socket | null;
  serverUrl: string;
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
  onVideoSelect,
}: VideoSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VideoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const searchVideos = async () => {
    if (!query.trim()) {
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
        `${serverUrl}/api/search?q=${encodeURIComponent(query)}&maxResults=10`
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
    <Card className="h-full flex flex-col p-4">
      <h3 className="text-lg font-semibold mb-4 text-slate-800">
        Search Videos
      </h3>

      <div className="flex gap-2 mb-4">
        <Input
          type="text"
          placeholder="Search YouTube..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
        />
        <Button onClick={searchVideos} disabled={loading} size="icon">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-3">
          {results.length === 0 && !loading && (
            <div className="text-center py-8 text-slate-500">
              <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Search for videos to add to your watch party</p>
            </div>
          )}

          {results.map((video) => (
            <div
              key={video.id.videoId}
              className="group cursor-pointer bg-slate-50 hover:bg-slate-100 rounded-lg overflow-hidden transition-all"
              onClick={() =>
                handleVideoSelect(video.id.videoId, video.snippet.title)
              }
            >
              <div className="flex gap-3 p-2">
                <div className="relative flex-shrink-0">
                  <img
                    src={video.snippet.thumbnails.medium.url}
                    alt={video.snippet.title}
                    className="w-32 h-20 object-cover rounded"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                    <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-all" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-slate-800 line-clamp-2 mb-1">
                    {video.snippet.title}
                  </h4>
                  <p className="text-xs text-slate-600">
                    {video.snippet.channelTitle}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
