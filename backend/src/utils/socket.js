import { Server } from 'socket.io';

let io;

export function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
        },
    });
    return io;
}

export function getIO() {
    return io;
}