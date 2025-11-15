"use client";

import { useState, useEffect } from "react";
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
import { Users, Video, LogOut, User } from "lucide-react";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";

export default function Home() {
  const router = useRouter();
  const session = useSession();
  const supabase = useSupabaseClient();
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // changes
  // useEffect(() => {
  //   if (session === null) {
  //     router.push("/login");
  //   } else {
  //     setIsLoading(false);
  //   }
  // }, [session, router]);

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

  const handleLogout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      {session?.user ? (
        <div className="absolute top-4 right-4 flex items-center gap-3 bg-white rounded-lg shadow-md px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-slate-700 max-w-[150px] truncate">
              {session.user.email || "Unknown user"}
            </span>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      ) : (
        <div className="absolute top-4 right-4 ">
          <Button
            onClick={() => router.push("/login")}
            variant="outline"
            size="sm"
            className="h-8 px-3 text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
          >
            <User className="w-4 h-4 mr-1" />
            Login
          </Button>
        </div>
      )}

      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
            <Video className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">Watch Together</CardTitle>
          <CardDescription className="text-base">
            Watch YouTube videos in sync with your friends
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <User className="w-4 h-4" />
              Your Display Name
            </label>
            <Input
              placeholder="Enter your name (optional)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-11"
            />
            <p className="text-xs text-slate-500">
              Leave empty for a random name
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleCreateRoom}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all"
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
              <label className="text-sm font-medium text-slate-700">
                Join Existing Room
              </label>
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
                className="w-full h-12 text-base font-semibold border-2 hover:bg-slate-50"
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
