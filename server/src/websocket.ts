import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { SocketEvent } from '@mock-crm/shared';

export function setupWebSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Helper to emit events to all clients
  const emitEvent = <T>(event: SocketEvent<T>) => {
    io.emit('event', event);
  };

  return {
    io,
    emitEvent,
  };
}

