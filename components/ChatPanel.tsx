// components/ChatPanel.tsx (adapted from first code UI with second socket functionality, no full users list)
"use client";

import { useState, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { Send, Users, Copy, Check } from "lucide-react";
import { ChatMessage } from "@/types/room"; // Assume { user: string, text: string, timestamp: number }

interface ChatPanelProps {
  socket: Socket | null;
  currentUser: string;
  roomId: string;
  memberCount: number;
}

export default function ChatPanel({
  socket,
  currentUser,
  roomId,
  memberCount,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) {
      socket?.emit("chat_message", { text: messageText.trim() });
      setMessageText("");
    }
  };

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full lg:w-96 bg-white border-l border-gray-200 flex flex-col h-full">
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Room Chat
          </h3>
          <button
            onClick={copyRoomId}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors text-sm font-medium"
            title="Copy room code"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span className="font-mono">{roomId}</span>
              </>
            )}
          </button>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-gray-600 font-medium">
            MEMBERS ({memberCount})
          </p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm mt-8">
            <p>No messages yet</p>
            <p className="text-xs mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isCurrentUser = message.user === currentUser;
            return (
              <div
                key={index}
                className={`flex gap-2 ${
                  isCurrentUser ? "flex-row-reverse" : ""
                }`}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                  {message.user.charAt(0).toUpperCase()}
                </div>
                <div className={`flex-1 ${isCurrentUser ? "text-right" : ""}`}>
                  {/* <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-semibold text-gray-900 ${
                        isCurrentUser ? "order-2" : ""
                      }`}
                    >
                      {message.user}
                    </span>
                  </div> */}
                  <div
                    className={`inline-block px-4 py-2 rounded-2xl ${
                      isCurrentUser
                        ? "bg-red-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm break-words">{message.text}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-red-500"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!messageText.trim()}
            className="p-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full transition-colors"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </form>
      </div>
    </div>
  );
}
