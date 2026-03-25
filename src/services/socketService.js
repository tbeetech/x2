/**
 * Socket.IO Client Service
 * 
 * Manages real-time WebSocket connections for live updates
 */

import { io } from 'socket.io-client';
import { logger } from './logger';

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Initialize Socket.IO connection
 */
export function initializeSocket(token) {
  if (socket?.connected) {
    logger.info('Socket already connected');
    return socket;
  }

  const socketUrl = import.meta.env.VITE_API_BASE_URL || 
                   window.location.origin || 
                   'http://localhost:5003';

  logger.info('Initializing Socket.IO connection', { url: socketUrl });

  socket = io(socketUrl, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
  });

  socket.on('connect', () => {
    logger.info('Socket.IO connected', { socketId: socket.id });
    reconnectAttempts = 0;
  });

  socket.on('disconnect', (reason) => {
    logger.warn('Socket.IO disconnected', { reason });
  });

  socket.on('connect_error', (error) => {
    reconnectAttempts++;
    logger.error('Socket.IO connection error', { 
      error: error.message, 
      attempts: reconnectAttempts 
    });
    
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      logger.error('Max reconnection attempts reached, giving up');
      socket.disconnect();
    }
  });

  socket.on('error', (error) => {
    logger.error('Socket.IO error', error);
  });

  return socket;
}

/**
 * Get the current socket instance
 */
export function getSocket() {
  return socket;
}

/**
 * Disconnect socket
 */
export function disconnectSocket() {
  if (socket) {
    logger.info('Disconnecting Socket.IO');
    socket.disconnect();
    socket = null;
    reconnectAttempts = 0;
  }
}

/**
 * Subscribe to real-time events
 */
export function subscribeToEvents(handlers) {
  if (!socket) {
    logger.warn('Cannot subscribe to events: socket not initialized');
    return () => {};
  }

  // Balance updates
  if (handlers.onBalanceUpdate) {
    socket.on('balance_update', handlers.onBalanceUpdate);
  }

  // Portfolio updates
  if (handlers.onPortfolioUpdate) {
    socket.on('portfolio_update', handlers.onPortfolioUpdate);
  }

  // Notifications
  if (handlers.onNotification) {
    socket.on('notification', handlers.onNotification);
  }

  // New notification (alternative event name)
  if (handlers.onNewNotification) {
    socket.on('new_notification', handlers.onNewNotification);
  }

  // Transaction updates
  if (handlers.onTransactionUpdate) {
    socket.on('transaction_update', handlers.onTransactionUpdate);
  }

  // Transaction status change
  if (handlers.onTransactionStatusChange) {
    socket.on('transaction_status_change', handlers.onTransactionStatusChange);
  }

  // Verification updates
  if (handlers.onVerificationUpdate) {
    socket.on('verification_update', handlers.onVerificationUpdate);
  }

  // Position updates (for live trading)
  if (handlers.onPositionUpdate) {
    socket.on('position_update', handlers.onPositionUpdate);
  }

  // Market data updates
  if (handlers.onMarketUpdate) {
    socket.on('market_update', handlers.onMarketUpdate);
  }

  // Admin notifications (for admin panel)
  if (handlers.onAdminNotification) {
    socket.on('admin_notification', handlers.onAdminNotification);
  }

  // Investment updates
  if (handlers.onInvestmentUpdate) {
    socket.on('investment_update', handlers.onInvestmentUpdate);
  }

  // Wallet transaction updates
  if (handlers.onWalletUpdate) {
    socket.on('wallet_update', handlers.onWalletUpdate);
  }

  // Account updates (profile changes, etc)
  if (handlers.onAccountUpdate) {
    socket.on('account_update', handlers.onAccountUpdate);
  }

  // Return cleanup function
  return () => {
    if (socket) {
      if (handlers.onBalanceUpdate) {
        socket.off('balance_update', handlers.onBalanceUpdate);
      }
      if (handlers.onPortfolioUpdate) {
        socket.off('portfolio_update', handlers.onPortfolioUpdate);
      }
      if (handlers.onNotification) {
        socket.off('notification', handlers.onNotification);
      }
      if (handlers.onNewNotification) {
        socket.off('new_notification', handlers.onNewNotification);
      }
      if (handlers.onTransactionUpdate) {
        socket.off('transaction_update', handlers.onTransactionUpdate);
      }
      if (handlers.onTransactionStatusChange) {
        socket.off('transaction_status_change', handlers.onTransactionStatusChange);
      }
      if (handlers.onVerificationUpdate) {
        socket.off('verification_update', handlers.onVerificationUpdate);
      }
      if (handlers.onPositionUpdate) {
        socket.off('position_update', handlers.onPositionUpdate);
      }
      if (handlers.onMarketUpdate) {
        socket.off('market_update', handlers.onMarketUpdate);
      }
      if (handlers.onAdminNotification) {
        socket.off('admin_notification', handlers.onAdminNotification);
      }
      if (handlers.onInvestmentUpdate) {
        socket.off('investment_update', handlers.onInvestmentUpdate);
      }
      if (handlers.onWalletUpdate) {
        socket.off('wallet_update', handlers.onWalletUpdate);
      }
      if (handlers.onAccountUpdate) {
        socket.off('account_update', handlers.onAccountUpdate);
      }
    }
  };
}

/**
 * Emit an event to the server
 */
export function emitEvent(eventName, data) {
  if (!socket) {
    logger.warn('Cannot emit event: socket not initialized');
    return;
  }

  socket.emit(eventName, data);
}

/**
 * Check if socket is connected
 */
export function isSocketConnected() {
  return socket?.connected || false;
}

/**
 * Join a specific room (for user-specific updates)
 */
export function joinRoom(roomId) {
  if (!socket) {
    logger.warn('Cannot join room: socket not initialized');
    return;
  }

  socket.emit('join', roomId);
  logger.info('Joined room', { roomId });
}

/**
 * Leave a specific room
 */
export function leaveRoom(roomId) {
  if (!socket) {
    logger.warn('Cannot leave room: socket not initialized');
    return;
  }

  socket.emit('leave', roomId);
  logger.info('Left room', { roomId });
}

/**
 * Reconnect socket manually
 */
export function reconnectSocket() {
  if (socket) {
    logger.info('Manually reconnecting socket');
    socket.connect();
  }
}
