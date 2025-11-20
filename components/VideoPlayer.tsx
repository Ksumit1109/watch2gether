"use client";

import { useEffect, useRef, useState } from "react";
import YouTube, { YouTubePlayer } from "react-youtube";
import { Socket } from "socket.io-client";
import { Video } from "lucide-react";

interface VideoPlayerProps {
  socket: Socket | null;
  currentVideoId: string;
  setCurrentVideoId: (videoId: string) => void;
  isHost: boolean;
}

export default function VideoPlayer({
  socket,
  currentVideoId,
  setCurrentVideoId,
  isHost,
}: VideoPlayerProps) {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const isSyncing = useRef(false);
  const lastSeekTime = useRef<number>(0);
  const syncTimeout = useRef<NodeJS.Timeout | null>(null);

  // Handle incoming sync events from other users
  useEffect(() => {
    if (!socket) return;

    const handleChangeVideo = ({
      videoId,
      startTime = 0,
    }: {
      videoId: string;
      startTime?: number;
    }) => {
      console.log("Received change_video:", videoId, startTime);
      setCurrentVideoId(videoId);

      // When video changes, reset player and seek to start time
      if (playerRef.current && isReady) {
        setTimeout(() => {
          if (playerRef.current) {
            isSyncing.current = true;
            playerRef.current.seekTo(startTime, true);
            setTimeout(() => {
              isSyncing.current = false;
            }, 500);
          }
        }, 1000); // Give time for new video to load
      }
    };

    const handlePlay = ({ time }: { time: number }) => {
      console.log("Received play at:", time);
      if (!playerRef.current || !isReady || isSyncing.current) return;

      isSyncing.current = true;
      playerRef.current.seekTo(time, true);
      playerRef.current.playVideo();

      if (syncTimeout.current) clearTimeout(syncTimeout.current);
      syncTimeout.current = setTimeout(() => {
        isSyncing.current = false;
      }, 1000);
    };

    const handlePause = ({ time }: { time: number }) => {
      console.log("Received pause at:", time);
      if (!playerRef.current || !isReady || isSyncing.current) return;

      isSyncing.current = true;
      playerRef.current.seekTo(time, true);
      playerRef.current.pauseVideo();

      if (syncTimeout.current) clearTimeout(syncTimeout.current);
      syncTimeout.current = setTimeout(() => {
        isSyncing.current = false;
      }, 1000);
    };

    const handleSeek = ({ time }: { time: number }) => {
      console.log("Received seek to:", time);
      if (!playerRef.current || !isReady || isSyncing.current) return;

      const currentTime = playerRef.current.getCurrentTime();
      const timeDiff = Math.abs(currentTime - time);

      // Only sync if time difference is significant (more than 2 seconds)
      if (timeDiff > 2) {
        isSyncing.current = true;
        playerRef.current.seekTo(time, true);

        if (syncTimeout.current) clearTimeout(syncTimeout.current);
        syncTimeout.current = setTimeout(() => {
          isSyncing.current = false;
        }, 1000);
      }
    };

    const handleSyncState = async (state: {
      videoId: string;
      currentTime: number;
      isPlaying: boolean;
      time?: number;
      playing?: boolean;
    }) => {
      console.log("Received sync_state:", state);
      if (!playerRef.current || !isReady) return;

      // Handle different state formats
      const time = state.currentTime ?? state.time ?? 0;
      const playing = state.isPlaying ?? state.playing ?? false;

      isSyncing.current = true;

      // If video changed, update it
      if (state.videoId && state.videoId !== currentVideoId) {
        setCurrentVideoId(state.videoId);
      }

      playerRef.current.seekTo(time, true);

      if (playing) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }

      if (syncTimeout.current) clearTimeout(syncTimeout.current);
      syncTimeout.current = setTimeout(() => {
        isSyncing.current = false;
      }, 1500);
    };

    socket.on("change_video", handleChangeVideo);
    socket.on("play", handlePlay);
    socket.on("pause", handlePause);
    socket.on("seek", handleSeek);
    socket.on("sync_state", handleSyncState);

    return () => {
      socket.off("change_video", handleChangeVideo);
      socket.off("play", handlePlay);
      socket.off("pause", handlePause);
      socket.off("seek", handleSeek);
      socket.off("sync_state", handleSyncState);

      if (syncTimeout.current) {
        clearTimeout(syncTimeout.current);
      }
    };
  }, [socket, isReady, currentVideoId, setCurrentVideoId]);

  // Player ready handler
  const onReady = (event: { target: YouTubePlayer }) => {
    console.log("YouTube player ready");
    playerRef.current = event.target;
    setIsReady(true);

    // Request sync if not host
    if (!isHost && socket) {
      setTimeout(() => {
        console.log("Requesting sync from host...");
        socket.emit("request_sync");
      }, 1000);
    }
  };

  // Handle player state changes (play/pause) - only for host
  const onStateChange = async (event: {
    target: YouTubePlayer;
    data: number;
  }) => {
    if (!socket || isSyncing.current || !isHost) return;

    const currentTime = await event.target.getCurrentTime();

    console.log("Player state changed:", event.data, "time:", currentTime);

    // 1 = playing, 2 = paused
    if (event.data === 1) {
      console.log("Emitting play event");
      socket.emit("play", { time: currentTime });
    } else if (event.data === 2) {
      console.log("Emitting pause event");
      socket.emit("pause", { time: currentTime });
    }
  };

  // Handle seeking - only for host
  useEffect(() => {
    if (!socket || !isHost || !playerRef.current || !isReady) return;

    const checkSeek = async () => {
      if (!playerRef.current || isSyncing.current) return;

      try {
        const currentTime = await playerRef.current.getCurrentTime();
        const timeDiff = Math.abs(currentTime - lastSeekTime.current);

        // If time jumped more than 2 seconds, it's a seek
        if (timeDiff > 2) {
          console.log(
            "Detected seek from",
            lastSeekTime.current,
            "to",
            currentTime
          );
          socket.emit("seek", { time: currentTime });
        }

        lastSeekTime.current = currentTime;
      } catch (error) {
        // Player might not be ready yet
      }
    };

    // Check for seeks every 500ms
    const interval = setInterval(checkSeek, 500);

    return () => clearInterval(interval);
  }, [socket, isHost, isReady]);

  // Handle sync requests from new joiners (host only)
  useEffect(() => {
    if (!socket || !isHost) return;

    const handleRequestSync = async ({ toSocket }: { toSocket: string }) => {
      if (!playerRef.current || !isReady) {
        console.log("Player not ready for sync");
        return;
      }

      try {
        console.log("Sync requested by", toSocket);
        const currentTime = await playerRef.current.getCurrentTime();
        const playerState = await playerRef.current.getPlayerState();
        const isPlaying = playerState === 1;

        const state = {
          videoId: currentVideoId,
          currentTime,
          isPlaying,
        };

        console.log("Sending sync state:", state);
        socket.emit("sync_state", {
          toSocket,
          state,
        });
      } catch (error) {
        console.error("Error syncing state:", error);
      }
    };

    socket.on("request_sync_from_host", handleRequestSync);

    return () => {
      socket.off("request_sync_from_host", handleRequestSync);
    };
  }, [socket, isHost, currentVideoId, isReady]);

  if (!currentVideoId) {
    return (
      <div className="w-full aspect-video bg-[#0f0f0f] rounded-xl flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-[#272727] rounded-full flex items-center justify-center mx-auto">
            <Video className="w-8 h-8 text-[#717171]" />
          </div>
          <p className="text-[#aaaaaa] text-lg font-medium">
            No video selected
          </p>
          <p className="text-[#717171] text-sm">
            Search for a video to get started
          </p>
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
            fs: 1,
          },
        }}
        onReady={onReady}
        onStateChange={onStateChange}
        className="w-full h-full"
      />
    </div>
  );
}
