// app/room/create/page.tsx (adapted with red theme)
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSocket } from "@/lib/socket";
import { Loader2 } from "lucide-react";

const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000";

export default function CreateRoom() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = searchParams.get("username") || "Guest";

  useEffect(() => {
    const socket = getSocket(SERVER_URL);

    socket.connect();

    socket.emit("create_room", (response: { roomId: string }) => {
      if (response.roomId) {
        socket.emit("set_username", { username });
        router.push(
          `/room/${response.roomId}?username=${encodeURIComponent(username)}`
        );
      }
    });

    return () => {
      // Don't disconnect here as we're navigating to the room page
      // The room page will handle the connection
    };
  }, [router, username]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-red-600 mx-auto" />
        <p className="text-lg font-medium text-gray-700">
          Creating your room...
        </p>
      </div>
    </div>
  );
}
