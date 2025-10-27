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

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg">Chat</h3>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div ref={scrollRef} className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm text-blue-600">{msg.user}</span>
                  <span className="text-xs text-slate-400">{formatTime(msg.timestamp)}</span>
                </div>
                <p className="text-sm text-slate-700 break-words">{msg.text}</p>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={!inputText.trim()} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
