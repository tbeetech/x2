import { useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

let socket = null;
let isInitialized = false;

// Get Socket.IO server URL
const getSocketUrl = () => {
  if (typeof window === 'undefined') return null;
  
  const { hostname, protocol } = window.location;
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
  
  if (isLocalHost) {
    return 'http://localhost:8080';
  }
  
  // Production: use same host
  return `${protocol}//${hostname}`;
};

// Initialize socket connection once
const initSocket = () => {
  if (isInitialized || socket) return socket;
  
  const socketUrl = getSocketUrl();
  if (!socketUrl) return null;
  
  socket = io(socketUrl, {
    transports: ['polling', 'websocket'], // Try polling first, then WebSocket
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    reconnectionAttempts: 3, // Reduce attempts to avoid console spam
    autoConnect: true,
    timeout: 10000,
  });
  
  socket.on('connect', () => {
    console.log('[Socket.IO] Connected successfully');
    isInitialized = true;
  });
  
  socket.on('disconnect', (reason) => {
    console.log('[Socket.IO] Disconnected:', reason);
  });
  
  socket.on('connect_error', (error) => {
    // Silently handle connection errors to avoid console spam
    if (console.warn) {
      console.warn('[Socket.IO] Connection error (will retry):', error.message);
    }
  });
  
  return socket;
};

/**
 * Hook for real-time updates via Socket.IO
 * @param {string} userId - The user ID to subscribe to updates for
 * @param {function} onBalanceUpdate - Callback for balance updates
 * @param {function} onNotification - Callback for notifications
 */
export const useRealTimeUpdates = (userId, onBalanceUpdate, onNotification) => {
  useEffect(() => {
    if (!userId) return;
    
    // Initialize socket if not already done
    const socketInstance = initSocket();
    if (!socketInstance) return;
    
    // Join user-specific room
    socketInstance.emit('join', userId);
    console.log('[Socket.IO] Joined room for user:', userId);
    
    // Handle balance updates
    const handleBalanceUpdate = (data) => {
      console.log('[Socket.IO] Balance update received:', data);
      if (onBalanceUpdate && typeof onBalanceUpdate === 'function') {
        onBalanceUpdate(data);
      }
    };
    
    // Handle notifications
    const handleNotification = (data) => {
      console.log('[Socket.IO] Notification received:', data);
      
      // Show toast notification based on type
      if (data.type === 'deposit_confirmed') {
        toast.success(data.message || data.title, {
          icon: '✅',
          autoClose: 7000,
        });
      } else if (data.type === 'deposit_declined') {
        toast.error(data.message || data.title, {
          icon: '❌',
          autoClose: 7000,
        });
      } else if (data.type === 'verification_approved') {
        toast.success(data.message || data.title, {
          icon: '🎉',
          autoClose: 10000,
        });
      } else if (data.type === 'verification_rejected') {
        toast.error(data.message || data.title, {
          icon: '⚠️',
          autoClose: 10000,
        });
      } else if (data.type === 'verification_in_review') {
        toast.info(data.message || data.title, {
          icon: '⏳',
          autoClose: 7000,
        });
      } else if (data.type === 'verification_submitted') {
        toast.info(data.message || data.title, {
          icon: '📄',
          autoClose: 7000,
        });
      } else {
        toast.info(data.message || data.title, {
          autoClose: 5000,
        });
      }
      
      // Call custom notification handler
      if (onNotification && typeof onNotification === 'function') {
        onNotification(data);
      }
    };
    
    // Handle verification updates
    const handleVerificationUpdate = (data) => {
      console.log('[Socket.IO] Verification update received:', data);
      
      // Show toast notification
      if (data.status === 'approved') {
        toast.success(data.message || data.title, {
          icon: '🎉',
          autoClose: 10000,
        });
      } else if (data.status === 'rejected') {
        toast.error(data.message || data.title, {
          icon: '⚠️',
          autoClose: 10000,
        });
      } else if (data.status === 'in_review') {
        toast.info(data.message || data.title, {
          icon: '⏳',
          autoClose: 7000,
        });
      }
      
      // Trigger custom callback if provided
      if (onNotification && typeof onNotification === 'function') {
        onNotification({ ...data, type: 'verification_update' });
      }
    };
    
    // Subscribe to events
    socketInstance.on('balance_update', handleBalanceUpdate);
    socketInstance.on('notification', handleNotification);
    socketInstance.on('verification_update', handleVerificationUpdate);
    
    // Cleanup function
    return () => {
      socketInstance.off('balance_update', handleBalanceUpdate);
      socketInstance.off('notification', handleNotification);
      socketInstance.off('verification_update', handleVerificationUpdate);
      socketInstance.emit('leave', userId);
      console.log('[Socket.IO] Left room for user:', userId);
    };
  }, [userId, onBalanceUpdate, onNotification]);
  
  // Return socket instance for manual operations if needed
  return useCallback(() => socket, []);
};

// Export disconnect function for logout scenarios
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    isInitialized = false;
    console.log('[Socket.IO] Manually disconnected');
  }
};
