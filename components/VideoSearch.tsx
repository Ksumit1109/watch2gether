"use client";

import { useState } from "react";
import { Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Search, Loader2, Play } from "lucide-react";
import { SearchResult } from "@/types/room";

interface VideoSearchProps {
  socket: Socket | null;
  serverUrl: string;
}

export default function VideoSearch({ socket, serverUrl }: VideoSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `${serverUrl}/api/search?q=${encodeURIComponent(query)}&maxResults=10`
      );
      const data = await response.json();

      if (data.items) {
        setResults(data.items);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleVideoSelect = (videoId: string) => {
    if (!socket) return;
    socket.emit("change_video", { videoId, startTime: 0 });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border">
      <div className="p-4 border-b space-y-3">
        <h3 className="font-semibold text-lg">Search Videos</h3>
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search YouTube..."
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isSearching} size="icon">
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {results.length === 0 ? (
          <div className="text-center text-slate-400 text-sm py-8">
            Search for videos to watch together
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((item) => (
              <Card
                key={item.id.videoId}
                className="p-3 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => handleVideoSelect(item.id.videoId)}
              >
                <div className="flex gap-3">
                  <div className="relative flex-shrink-0 w-32 h-20 bg-slate-200 rounded overflow-hidden group">
                    <img
                      src={item.snippet.thumbnails.medium.url}
                      alt={item.snippet.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-2 mb-1">
                      {item.snippet.title}
                    </h4>
                    <p className="text-xs text-slate-500">{item.snippet.channelTitle}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
