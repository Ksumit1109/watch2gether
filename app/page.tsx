"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Video, Play, UserPlus } from "lucide-react";
import { useSession } from "@supabase/auth-helpers-react";
import YouTubeHeader from "@/components/YouTubeHeader";

export default function Home() {
  const router = useRouter();
  const session = useSession();
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");

  const handleCreateRoom = () => {
    const name =
      username.trim() || `User${Math.floor(Math.random() * 9000) + 1000}`;
    router.push(`/room/create?username=${encodeURIComponent(name)}`);
  };

  const handleJoinRoom = () => {
    if (!roomId.trim()) return;
    const name =
      username.trim() || `User${Math.floor(Math.random() * 9000) + 1000}`;
    router.push(`/room/${roomId}?username=${encodeURIComponent(name)}`);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <YouTubeHeader />

      {/* Main Content */}
      <main className="pt-[var(--yt-header-height)] min-h-screen flex items-center justify-center p-4">
        <div className="max-w-6xl w-full">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#FF0000] to-[#CC0000] rounded-full mb-6 shadow-lg">
              <Video className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#f1f1f1] mb-4">
              Watch Together, Anywhere
            </h1>
            <p className="text-lg text-[#aaaaaa] max-w-2xl mx-auto">
              Create a room, share the link, and watch YouTube videos in perfect
              sync with your friends
            </p>
          </div>

          {/* Username Input */}
          <div className="max-w-md mx-auto mb-8">
            <label className="block text-sm font-medium text-[#aaaaaa] mb-2">
              Display Name (Optional)
            </label>
            <Input
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="yt-input h-12 text-base"
            />
            <p className="text-xs text-[#717171] mt-2">
              Leave empty for a random name
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Create Room Card */}
            <div
              className="yt-card group cursor-pointer"
              onClick={handleCreateRoom}
            >
              <div className="p-8">
                <div className="w-16 h-16 bg-[#FF0000] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-[#f1f1f1] mb-3 group-hover:text-white transition-colors">
                  Create New Room
                </h2>
                <p className="text-[#aaaaaa] mb-6">
                  Start a new watch party and invite your friends to join
                </p>
                <Button className="w-full bg-[#FF0000] hover:bg-[#CC0000] text-white h-12 text-base font-medium">
                  <Play className="w-5 h-5 mr-2" />
                  Create Room
                </Button>
              </div>
            </div>

            {/* Join Room Card */}
            <div className="yt-card">
              <div className="p-8">
                <div className="w-16 h-16 bg-[#3ea6ff] rounded-full flex items-center justify-center mb-6">
                  <UserPlus className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-[#f1f1f1] mb-3">
                  Join Existing Room
                </h2>
                <p className="text-[#aaaaaa] mb-6">
                  Enter a room code to join your friends
                </p>
                <div className="space-y-3">
                  <Input
                    placeholder="Enter room code"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                    className="yt-input h-12 text-base"
                  />
                  <Button
                    onClick={handleJoinRoom}
                    disabled={!roomId.trim()}
                    className="w-full bg-[#272727] hover:bg-[#3f3f3f] text-[#f1f1f1] h-12 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Join Room
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#272727] rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-6 h-6 text-[#FF0000]" />
              </div>
              <h3 className="text-lg font-semibold text-[#f1f1f1] mb-2">
                Synchronized Playback
              </h3>
              <p className="text-sm text-[#aaaaaa]">
                Watch videos in perfect sync with all room members
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-[#272727] rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-[#FF0000]" />
              </div>
              <h3 className="text-lg font-semibold text-[#f1f1f1] mb-2">
                Live Chat
              </h3>
              <p className="text-sm text-[#aaaaaa]">
                Chat with friends while watching together
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-[#272727] rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-6 h-6 text-[#FF0000]" />
              </div>
              <h3 className="text-lg font-semibold text-[#f1f1f1] mb-2">
                Easy Sharing
              </h3>
              <p className="text-sm text-[#aaaaaa]">
                Share room links instantly with anyone
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
