import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (
  serverUrl: string = "http://localhost:5000"
): Socket => {
  if (!socket) {
    socket = io(serverUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
