"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Video } from "lucide-react";

export default function Home() {
  const router = useRouter();
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Video className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">Watch Together</CardTitle>
          <CardDescription className="text-base">
            Watch YouTube videos in sync with your friends
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Your Name
            </label>
            <Input
              placeholder="Enter your name (optional)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleCreateRoom}
              className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <Users className="w-5 h-5 mr-2" />
              Create New Room
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">Or</span>
              </div>
            </div>

            <div className="space-y-2">
              <Input
                placeholder="Enter room code"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                className="h-11"
              />
              <Button
                onClick={handleJoinRoom}
                variant="outline"
                className="w-full h-12 text-base font-semibold"
                size="lg"
                disabled={!roomId.trim()}
              >
                Join Room
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
