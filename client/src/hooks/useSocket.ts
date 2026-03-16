import { useEffect, useCallback, useRef } from 'react';
import { getSocket, disconnectSocket } from '../lib/socket';
import type { Socket } from 'socket.io-client';

interface UseSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { autoConnect = true, onConnect, onDisconnect } = options;
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!autoConnect) return;

    const socket = getSocket();
    socketRef.current = socket;

    if (onConnect) socket.on('connect', onConnect);
    if (onDisconnect) socket.on('disconnect', onDisconnect);

    return () => {
      if (onConnect) socket.off('connect', onConnect);
      if (onDisconnect) socket.off('disconnect', onDisconnect);
    };
  }, [autoConnect, onConnect, onDisconnect]);

  const joinTable = useCallback((tableId: string, playerId: string, seat: number, chips: number) => {
    socketRef.current?.emit('joinTable', { tableId, playerId, seat, chips });
  }, []);

  const leaveTable = useCallback((tableId: string, playerId: string) => {
    socketRef.current?.emit('leaveTable', { tableId, playerId });
  }, []);

  const placeBet = useCallback((tableId: string, playerId: string, action: string, amount: number) => {
    socketRef.current?.emit('playerBet', { tableId, playerId, action, amount });
  }, []);

  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  }, []);

  const disconnect = useCallback(() => {
    disconnectSocket();
  }, []);

  return { joinTable, leaveTable, placeBet, on, disconnect };
}
