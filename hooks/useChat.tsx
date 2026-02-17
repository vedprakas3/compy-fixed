'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from './useAuth';
import { IChatMessage, IChatRoom } from '@/types';

interface UseChatReturn {
  rooms: IChatRoom[];
  messages: IChatMessage[];
  currentRoom: IChatRoom | null;
  loading: boolean;
  error: string | null;
  connected: boolean;
  typingUsers: string[];
  fetchRooms: () => Promise<void>;
  fetchMessages: (roomId: string, page?: number) => Promise<void>;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (content: string, type?: string, fileUrl?: string) => void;
  startTyping: () => void;
  stopTyping: () => void;
  markAsRead: (roomId: string) => Promise<void>;
}

export function useChat(): UseChatReturn {
  const [rooms, setRooms] = useState<IChatRoom[]>([]);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [currentRoom, setCurrentRoom] = useState<IChatRoom | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  const socketRef = useRef<Socket | null>(null);
  const { firebaseUser, user } = useAuth();

  // Initialize socket connection
  useEffect(() => {
    if (!firebaseUser) return;

    const initSocket = async () => {
      const token = await firebaseUser.getIdToken();
      
      socketRef.current = io(process.env.NEXT_PUBLIC_APP_URL || '', {
        auth: { token },
        transports: ['websocket'],
      });

      socketRef.current.on('connect', () => {
        setConnected(true);
      });

      socketRef.current.on('disconnect', () => {
        setConnected(false);
      });

      socketRef.current.on('message', (message: IChatMessage) => {
        setMessages((prev) => [...prev, message]);
      });

      socketRef.current.on('user_typing', ({ userId }: { userId: string }) => {
        setTypingUsers((prev) => [...new Set([...prev, userId])]);
      });

      socketRef.current.on('user_stopped_typing', ({ userId }: { userId: string }) => {
        setTypingUsers((prev) => prev.filter((id) => id !== userId));
      });

      socketRef.current.on('error', (err: any) => {
        setError(err.message || 'Socket error');
      });
    };

    initSocket();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [firebaseUser]);

  const fetchRooms = useCallback(async () => {
    if (!firebaseUser) return;

    setLoading(true);
    try {
      const token = await firebaseUser.getIdToken();
      const response = await axios.get('/api/chat/rooms', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setRooms(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch chat rooms');
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  const fetchMessages = useCallback(async (roomId: string, page: number = 1) => {
    if (!firebaseUser) return;

    setLoading(true);
    try {
      const token = await firebaseUser.getIdToken();
      const response = await axios.get(`/api/chat/rooms/${roomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page },
      });

      if (response.data.success) {
        if (page === 1) {
          setMessages(response.data.data);
        } else {
          setMessages((prev) => [...response.data.data, ...prev]);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  const joinRoom = useCallback((roomId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join_room', { roomId });
      const room = rooms.find((r) => r._id === roomId);
      setCurrentRoom(room || null);
    }
  }, [rooms]);

  const leaveRoom = useCallback((roomId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave_room', { roomId });
      setCurrentRoom(null);
      setMessages([]);
    }
  }, []);

  const sendMessage = useCallback((content: string, type: string = 'text', fileUrl?: string) => {
    if (socketRef.current && currentRoom) {
      socketRef.current.emit('send_message', {
        roomId: currentRoom._id,
        content,
        type,
        fileUrl,
      });
    }
  }, [currentRoom]);

  const startTyping = useCallback(() => {
    if (socketRef.current && currentRoom && user) {
      socketRef.current.emit('typing', {
        roomId: currentRoom._id,
        userId: user._id,
      });
    }
  }, [currentRoom, user]);

  const stopTyping = useCallback(() => {
    if (socketRef.current && currentRoom && user) {
      socketRef.current.emit('stop_typing', {
        roomId: currentRoom._id,
        userId: user._id,
      });
    }
  }, [currentRoom, user]);

  const markAsRead = useCallback(async (roomId: string) => {
    if (!firebaseUser) return;

    try {
      const token = await firebaseUser.getIdToken();
      await axios.post(
        `/api/chat/rooms/${roomId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err: any) {
      console.error('Failed to mark as read:', err);
    }
  }, [firebaseUser]);

  return {
    rooms,
    messages,
    currentRoom,
    loading,
    error,
    connected,
    typingUsers,
    fetchRooms,
    fetchMessages,
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
  };
}

export default useChat;
