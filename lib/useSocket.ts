import { useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

interface UseSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketIOClient = io(undefined, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socketIOClient;

    socketIOClient.on('connect', () => {
      console.log('[Socket] Connected:', socketIOClient.id);
      setIsConnected(true);
      options.onConnect?.();
    });

    socketIOClient.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setIsConnected(false);
      options.onDisconnect?.();
    });

    socketIOClient.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
    });

    return () => {
      socketIOClient.disconnect();
    };
  }, [options]);

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  const off = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    emit,
    on,
    off,
  };
}
