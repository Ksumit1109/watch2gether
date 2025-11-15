// app/page.tsx (Home - adapted from RoomSetup with auth and red theme)
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { Video, Users, LogOut } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const session = useSession();
  const supabase = useSupabaseClient();
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [mode, setMode] = useState<"select" | "create" | "join">("select");
  const [isLoading, setIsLoading] = useState(true);

  // useEffect(() => {
  //   if (session === null) {
  //     router.push("/login");
  //   } else {
  //     setIsLoading(false);
  //   }
  // }, [session, router]);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      router.push(
        `/room/create?username=${encodeURIComponent(username.trim())}`
      );
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && roomId.trim()) {
      router.push(
        `/room/${roomId.trim()}?username=${encodeURIComponent(username.trim())}`
      );
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
  //         <p className="text-gray-600">Loading...</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <>
      {/* <div className="fixed top-4 right-4 flex items-center gap-3 bg-white rounded-lg shadow-md px-4 py-3 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-red-600" />
          </div>
          <span className="text-sm font-medium text-gray-700 max-w-[150px] truncate">
            {session.user.email}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div> */}

      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Video className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Watch Together
            </h1>
            <p className="text-gray-600">
              Watch YouTube videos with friends in real-time
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {mode === "select" && (
              <div className="space-y-4">
                <button
                  onClick={() => setMode("create")}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-3"
                >
                  <Video className="w-5 h-5" />
                  Create New Room
                </button>
                <button
                  onClick={() => setMode("join")}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-3"
                >
                  <Users className="w-5 h-5" />
                  Join Existing Room
                </button>
              </div>
            )}
            {mode === "create" && (
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <label
                    htmlFor="userName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Your Name
                  </label>
                  <input
                    id="userName"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Create Room
                </button>
                <button
                  type="button"
                  onClick={() => setMode("select")}
                  className="w-full text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                >
                  Back
                </button>
              </form>
            )}
            {mode === "join" && (
              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div>
                  <label
                    htmlFor="roomCode"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Room Code
                  </label>
                  <input
                    id="roomCode"
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none uppercase text-center text-2xl tracking-widest"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="joinUserName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Your Name
                  </label>
                  <input
                    id="joinUserName"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Join Room
                </button>
                <button
                  type="button"
                  onClick={() => setMode("select")}
                  className="w-full text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                >
                  Back
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
