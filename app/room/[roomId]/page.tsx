"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import { Socket } from "socket.io-client";
import VideoPlayer from "@/components/VideoPlayer";
import ChatPanel from "@/components/ChatPanel";
import VideoSearch from "@/components/VideoSearch";
import YouTubeHeader from "@/components/YouTubeHeader";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";
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
  const [copied, setCopied] = useState(false);
  const [isJoining, setIsJoining] = useState(true);
  const [showSearch, setShowSearch] = useState<string>("");

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

  // Listen for global search events from header
  useEffect(() => {
    const handleGlobalSearch = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.query) {
        setShowSearch(customEvent.detail.query); // Pass the query
      }
    };

    window.addEventListener("global-search", handleGlobalSearch);
    return () =>
      window.removeEventListener("global-search", handleGlobalSearch);
  }, []);

  const copyRoomLink = () => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({
      title: "Link Copied!",
      description: "Share this link with your friends",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isConnected || isJoining) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#FF0000] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-lg font-medium text-[#f1f1f1]">
            {isConnected ? "Joining room..." : "Connecting to room..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <YouTubeHeader
        roomId={roomId}
        memberCount={memberCount}
        onShareRoom={copyRoomLink}
      />

      {/* Main Content */}
      <main className="pt-[var(--yt-header-height)] px-4 lg:px-6 py-6">
        <div className="max-w-[1920px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Video Player & Info */}
            <div className="lg:col-span-2 space-y-4">
              {/* Video Player */}
              <div className="bg-black rounded-xl overflow-hidden">
                <VideoPlayer
                  socket={socket}
                  currentVideoId={currentVideoId}
                  setCurrentVideoId={setCurrentVideoId}
                  isHost={isHost}
                />
              </div>

              {/* Video Info */}
              <div className="bg-[#212121] rounded-xl p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-semibold text-[#f1f1f1] mb-2">
                      Room: {roomId}
                    </h1>
                    {currentVideoId && (
                      <p className="text-sm text-[#aaaaaa]">
                        Watching together
                      </p>
                    )}
                  </div>
                  {isHost && (
                    <Badge className="bg-[#FF0000] hover:bg-[#CC0000] text-white flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      Host
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-[#aaaaaa]">
                  <span>
                    {memberCount} {memberCount === 1 ? "viewer" : "viewers"}
                  </span>
                  <span>•</span>
                  <span>Room ID: {roomId}</span>
                </div>
              </div>
            </div>

            {/* Right: Chat Only */}
            <div className="space-y-4">
              <div className="h-[calc(100vh-200px)]">
                <ChatPanel socket={socket} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Global Search Modal */}
      {showSearch && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center pt-20"
          onClick={() => setShowSearch("")}
        >
          <div
            className="bg-[#212121] rounded-xl w-full max-w-3xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <VideoSearch
              socket={socket}
              serverUrl={SERVER_URL}
              initialQuery={showSearch}
              onVideoSelect={(videoId) => {
                setCurrentVideoId(videoId);
                setShowSearch("");
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
