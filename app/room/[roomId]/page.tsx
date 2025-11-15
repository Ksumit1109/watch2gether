"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import { Socket } from "socket.io-client";
import VideoPlayer from "@/components/VideoPlayer";
import ChatPanel from "@/components/ChatPanel";
import { MessageSquare, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000";

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const roomId = params.roomId as string;
  const username = searchParams.get("username") || "Guest";

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [memberCount, setMemberCount] = useState(1);
  const [currentVideoId, setCurrentVideoId] = useState("");
  const [showChat, setShowChat] = useState(true);
  const [isJoining, setIsJoining] = useState(true);

  useEffect(() => {
    const sock = getSocket(SERVER_URL);

    // Connect first
    sock.connect();

    // Wait for connection before joining room
    const handleConnect = () => {
      console.log("Socket connected:", sock.id);
      setIsConnected(true);

      // Now join the room
      sock.emit(
        "join_room",
        { roomId, username },
        (response: {
          ok: boolean;
          error?: string;
          isHost?: boolean;
          memberCount?: number;
        }) => {
          console.log("Join room response:", response);
          setIsJoining(false);

          if (!response.ok) {
            toast({
              title: "Error",
              description: response.error || "Failed to join room",
              variant: "destructive",
            });
            router.push("/");
            return;
          }

          // Set initial state
          if (response.isHost !== undefined) {
            setIsHost(response.isHost);
          }
          if (response.memberCount !== undefined) {
            setMemberCount(response.memberCount);
          }

          toast({
            title: "Joined Room",
            description: `Welcome to room ${roomId}!`,
          });
        }
      );
    };

    // Handle already connected
    if (sock.connected) {
      handleConnect();
    } else {
      sock.on("connect", handleConnect);
    }

    sock.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);

      toast({
        title: "Disconnected",
        description: "Connection lost. Attempting to reconnect...",
        variant: "destructive",
      });
    });

    sock.on("reconnect", () => {
      console.log("Socket reconnected");
      // Rejoin room after reconnection
      sock.emit(
        "join_room",
        { roomId, username },
        (response: { ok: boolean; error?: string }) => {
          if (response.ok) {
            toast({
              title: "Reconnected",
              description: "Successfully rejoined the room",
            });
          }
        }
      );
    });

    sock.on("you_are_host", () => {
      console.log("You are now the host");
      setIsHost(true);
      toast({
        title: "You are now the host",
        description: "The previous host has left the room",
      });
    });

    sock.on("member_update", ({ members }: { members: number }) => {
      console.log("Member update:", members);
      setMemberCount(members);
    });

    sock.on(
      "change_video",
      ({
        videoId,
        by,
        startTime,
      }: {
        videoId: string;
        by: string;
        startTime?: number;
      }) => {
        console.log(
          "Video changed:",
          videoId,
          "by:",
          by,
          "startTime:",
          startTime
        );
        setCurrentVideoId(videoId);

        // Don't show toast for your own actions
        if (by !== username) {
          toast({
            title: "Video Changed",
            description: `${by} changed the video`,
          });
        }
      }
    );

    sock.on("user_joined", ({ username: joinedUser }: { username: string }) => {
      toast({
        title: "User Joined",
        description: `${joinedUser} joined the room`,
      });
    });

    sock.on("user_left", ({ username: leftUser }: { username: string }) => {
      toast({
        title: "User Left",
        description: `${leftUser} left the room`,
      });
    });

    setSocket(sock);

    return () => {
      console.log("Cleaning up socket");
      sock.off("connect");
      sock.off("disconnect");
      sock.off("reconnect");
      sock.off("you_are_host");
      sock.off("member_update");
      sock.off("change_video");
      sock.off("user_joined");
      sock.off("user_left");
      sock.disconnect();
    };
  }, [roomId, username, router, toast]);

  if (!isConnected || isJoining) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-lg font-medium text-gray-700">
            {isConnected ? "Joining room..." : "Connecting to room..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        <VideoPlayer
          socket={socket}
          currentVideoId={currentVideoId}
          setCurrentVideoId={setCurrentVideoId}
          isHost={isHost}
          memberCount={memberCount}
          serverUrl={SERVER_URL}
        />
        {showChat && (
          <div className="hidden lg:block">
            <ChatPanel
              socket={socket}
              currentUser={username}
              roomId={roomId}
              memberCount={memberCount}
            />
          </div>
        )}
      </div>
      <div className="lg:hidden fixed inset-0 pointer-events-none">
        {!showChat && (
          <button
            onClick={() => setShowChat(true)}
            className="pointer-events-auto fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 text-white rounded-full p-4 shadow-lg transition-colors"
          >
            <MessageSquare className="w-6 h-6" />
          </button>
        )}
        {showChat && (
          <div className="pointer-events-auto fixed inset-0 bg-black bg-opacity-50 flex items-end">
            <div className="w-full h-2/3 bg-white rounded-t-2xl flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Chat</h3>
                <button
                  onClick={() => setShowChat(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                <ChatPanel
                  socket={socket}
                  currentUser={username}
                  roomId={roomId}
                  memberCount={memberCount}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
