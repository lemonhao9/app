import { io, type Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
    if (socket) return socket;
    socket = io(SOCKET_URL, {
        auth: { token },
        autoConnect: false,
    });
    return socket;
}

export function disconnectSocket(){
    socket?.disconnect();
    socket = null;
}
