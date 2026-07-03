import {useEffect, useRef, useState, useCallback} from 'react';
import type { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket } from '../services/socket';

interface InterventionMessage {
    user_id: number;
    intervention_id: number;
    content: string | null;
    photo_url: string | null;
    created_at: string;
}

export function useSocket() {
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('hch_token');
    if (!token)return;

    const socket = getSocket(token);
    socketRef.current = socket;
    socket.connect();

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    return () => {
        socket.off('connect');
        socket.off('disconnect');
        disconnectSocket();
        socketRef.current = null;
    };
}, []);

const joinIntervention = useCallback((interventionId: number) => {
    socketRef.current?.emit('join:intervention', { intervention_id: interventionId});
}, []);

const sendMessage = useCallback ((interventionId: number, content: string | null, photoUrl: string | null =null) => {
    socketRef.current?.emit('message:send', { intervention_id: interventionId , content, photo_url: photoUrl});
}, []);

const onMessage = useCallback((callback: (message: InterventionMessage) => void) => {
    socketRef.current?.on('message:new', callback);
    return () => socketRef.current?.off('message:new', callback);
}, []);
return { connected, joinIntervention, sendMessage, onMessage };
}