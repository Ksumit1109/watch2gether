"use client";

import { useState, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { ChatMessage } from "@/types/room";

interface ChatPanelProps {
  socket: Socket | null;
}

export default function ChatPanel({ socket }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("chat_message", handleChatMessage);

    return () => {
      socket.off("chat_message", handleChatMessage);
    };
  }, [socket]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!socket || !inputText.trim()) return;

    socket.emit("chat_message", { text: inputText.trim() });
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#FFA07A",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E2",
      "#F8B739",
      "#52B788",
    ];
    const index = name
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  return (
    <div className="flex flex-col h-full bg-[#212121] rounded-xl overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-[#303030]">
        <h3 className="font-semibold text-lg text-[#f1f1f1]">Live Chat</h3>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div ref={scrollRef} className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-[#717171] text-sm py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className="flex gap-3 group">
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                  style={{ backgroundColor: getAvatarColor(msg.user) }}
                >
                  {getInitials(msg.user)}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-sm text-[#f1f1f1]">
                      {msg.user}
                    </span>
                    <span className="text-xs text-[#717171]">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-[#f1f1f1] break-words leading-relaxed">
                    {msg.text}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-[#303030]">
        <div className="flex gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Say something..."
            className="flex-1 bg-[#121212] border-[#303030] text-[#f1f1f1] placeholder:text-[#717171] focus-visible:ring-[#3ea6ff] focus-visible:border-[#3ea6ff]"
          />
          <Button
            onClick={sendMessage}
            disabled={!inputText.trim()}
            size="icon"
            className="bg-[#FF0000] hover:bg-[#CC0000] text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
