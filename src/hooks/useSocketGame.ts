import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketGameProps {
  onPublicState: (state: any) => void;
  onPrivateState: (state: any) => void;
}

export function useSocketGame({ onPublicState, onPrivateState }: UseSocketGameProps) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io('http://localhost:4000');
    socketRef.current.on('publicState', onPublicState);
    socketRef.current.on('privateState', onPrivateState);
    return () => {
      socketRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once

  return socketRef;
} 