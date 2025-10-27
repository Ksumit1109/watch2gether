"use client";

import { useEffect, useRef, useState } from "react";
import YouTube, { YouTubePlayer } from "react-youtube";
import { Socket } from "socket.io-client";

interface VideoPlayerProps {
  socket: Socket | null;
  currentVideoId: string;
  isHost: boolean;
}

export default function VideoPlayer({ socket, currentVideoId, isHost }: VideoPlayerProps) {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const isSyncing = useRef(false);

  useEffect(() => {
    if (!socket) return;

    const handlePlay = ({ time }: { time: number }) => {
      if (!playerRef.current || !isReady) return;
      isSyncing.current = true;
      playerRef.current.seekTo(time, true);
      playerRef.current.playVideo();
      setTimeout(() => (isSyncing.current = false), 500);
    };

    const handlePause = ({ time }: { time: number }) => {
      if (!playerRef.current || !isReady) return;
      isSyncing.current = true;
      playerRef.current.seekTo(time, true);
      playerRef.current.pauseVideo();
      setTimeout(() => (isSyncing.current = false), 500);
    };

    const handleSeek = ({ time }: { time: number }) => {
      if (!playerRef.current || !isReady) return;
      isSyncing.current = true;
      playerRef.current.seekTo(time, true);
      setTimeout(() => (isSyncing.current = false), 500);
    };

    const handleSyncState = async (state: { videoId: string; currentTime: number; isPlaying: boolean }) => {
      if (!playerRef.current || !isReady) return;
      isSyncing.current = true;
      playerRef.current.seekTo(state.currentTime, true);
      if (state.isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
      setTimeout(() => (isSyncing.current = false), 1000);
    };

    socket.on("play", handlePlay);
    socket.on("pause", handlePause);
    socket.on("seek", handleSeek);
    socket.on("sync_state", handleSyncState);

    return () => {
      socket.off("play", handlePlay);
      socket.off("pause", handlePause);
      socket.off("seek", handleSeek);
      socket.off("sync_state", handleSyncState);
    };
  }, [socket, isReady]);

  const onReady = (event: { target: YouTubePlayer }) => {
    playerRef.current = event.target;
    setIsReady(true);

    if (!isHost && socket) {
      setTimeout(() => {
        socket.emit("request_sync");
      }, 500);
    }
  };

  const onStateChange = async (event: { target: YouTubePlayer; data: number }) => {
    if (!socket || isSyncing.current || !isHost) return;

    const currentTime = await event.target.getCurrentTime();

    if (event.data === 1) {
      socket.emit("play", { time: currentTime });
    } else if (event.data === 2) {
      socket.emit("pause", { time: currentTime });
    }
  };

  useEffect(() => {
    if (!socket || !isHost) return;

    const handleRequestSync = async ({ toSocket }: { toSocket: string }) => {
      if (!playerRef.current) return;

      try {
        const currentTime = await playerRef.current.getCurrentTime();
        const playerState = await playerRef.current.getPlayerState();
        const isPlaying = playerState === 1;

        socket.emit("sync_state", {
          toSocket,
          state: {
            videoId: currentVideoId,
            currentTime,
            isPlaying,
          },
        });
      } catch (error) {
        console.error("Error syncing state:", error);
      }
    };

    socket.on("request_sync_from_host", handleRequestSync);

    return () => {
      socket.off("request_sync_from_host", handleRequestSync);
    };
  }, [socket, isHost, currentVideoId]);

  if (!currentVideoId) {
    return (
      <div className="w-full aspect-video bg-slate-900 rounded-lg flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-slate-400 text-lg">No video selected</p>
          <p className="text-slate-500 text-sm">Search for a video to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
      <YouTube
        videoId={currentVideoId}
        opts={{
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
          },
        }}
        onReady={onReady}
        onStateChange={onStateChange}
        className="w-full h-full"
      />
    </div>
  );
}
