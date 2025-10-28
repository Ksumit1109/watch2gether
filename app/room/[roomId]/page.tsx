"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import { Socket } from "socket.io-client";
import VideoPlayer from "@/components/VideoPlayer";
import ChatPanel from "@/components/ChatPanel";
import VideoSearch from "@/components/VideoSearch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Users, Crown, CheckCircle2 } from "lucide-react";
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-lg font-medium text-slate-700">
            {isConnected ? "Joining room..." : "Connecting to room..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">
                Room: {roomId}
              </h1>
              {isHost && (
                <Badge
                  variant="default"
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  <Crown className="w-3 h-3 mr-1" />
                  Host
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="px-3 py-1.5">
                <Users className="w-4 h-4 mr-1.5" />
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </Badge>

              <Button onClick={copyRoomLink} variant="outline" size="sm">
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Share Link
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-4">
              <VideoPlayer
                socket={socket}
                currentVideoId={currentVideoId}
                setCurrentVideoId={setCurrentVideoId}
                isHost={isHost}
              />
            </Card>

            <Card className="p-4 lg:hidden">
              <div className="h-96">
                <ChatPanel socket={socket} />
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="h-96">
              <VideoSearch
                socket={socket}
                serverUrl={SERVER_URL}
                onVideoSelect={(videoId) => {
                  setCurrentVideoId(videoId);
                }}
              />
            </div>

            <div className="hidden lg:block h-96">
              <ChatPanel socket={socket} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
