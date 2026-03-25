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
    console.log('[Admin Socket.IO] Connected successfully');
    isInitialized = true;
  });
  
  socket.on('disconnect', (reason) => {
    console.log('[Admin Socket.IO] Disconnected:', reason);
  });
  
  socket.on('connect_error', (error) => {
    // Silently handle connection errors to avoid console spam
    if (console.warn) {
      console.warn('[Admin Socket.IO] Connection error (will retry):', error.message);
    }
  });
  
  return socket;
};

/**
 * Hook for admin real-time updates via Socket.IO
 * @param {string} adminId - The admin user ID
 * @param {function} onAdminNotification - Callback for admin notifications
 */
export const useAdminRealTimeUpdates = (adminId, onAdminNotification) => {
  useEffect(() => {
    if (!adminId) return;
    
    // Initialize socket if not already done
    const socketInstance = initSocket();
    if (!socketInstance) return;
    
    // Join admin-specific room and admin-room
    socketInstance.emit('join-admin', adminId);
    console.log('[Admin Socket.IO] Joined admin-room for admin:', adminId);
    
    // Handle admin notifications
    const handleAdminNotification = (data) => {
      console.log('[Admin Socket.IO] Admin notification received:', data);
      
      // Show toast notification based on type
      if (data.type === 'new_verification') {
        toast.info(data.message || data.title, {
          icon: '📄',
          autoClose: 8000,
          position: 'top-right',
        });
      } else if (data.type === 'new_deposit') {
        toast.info(data.message || data.title, {
          icon: '💰',
          autoClose: 8000,
          position: 'top-right',
        });
      } else if (data.type === 'new_withdrawal') {
        toast.warning(data.message || data.title, {
          icon: '💸',
          autoClose: 8000,
          position: 'top-right',
        });
      } else {
        toast.info(data.message || data.title, {
          autoClose: 5000,
          position: 'top-right',
        });
      }
      
      // Call custom notification handler
      if (onAdminNotification && typeof onAdminNotification === 'function') {
        onAdminNotification(data);
      }
    };
    
    // Subscribe to admin events
    socketInstance.on('admin_notification', handleAdminNotification);
    
    // Cleanup function
    return () => {
      socketInstance.off('admin_notification', handleAdminNotification);
      socketInstance.emit('leave-admin', adminId);
      console.log('[Admin Socket.IO] Left admin-room for admin:', adminId);
    };
  }, [adminId, onAdminNotification]);
  
  // Return socket instance for manual operations if needed
  return useCallback(() => socket, []);
};

// Export disconnect function for logout scenarios
export const disconnectAdminSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    isInitialized = false;
    console.log('[Admin Socket.IO] Manually disconnected');
  }
};
