import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SocketEvent } from '@mock-crm/shared';

// Use current origin (Vite will proxy WebSocket to backend)
const WS_URL = window.location.origin;

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SocketEvent | null>(null);

  useEffect(() => {
    const socketInstance = io(WS_URL);

    socketInstance.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    socketInstance.on('event', (event: SocketEvent) => {
      setLastEvent(event);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const subscribe = useCallback((callback: (event: SocketEvent) => void) => {
    if (!socket) return () => {};

    socket.on('event', callback);

    return () => {
      socket.off('event', callback);
    };
  }, [socket]);

  return {
    socket,
    connected,
    lastEvent,
    subscribe,
  };
}

