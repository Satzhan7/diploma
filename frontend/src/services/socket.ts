import { io, Socket } from 'socket.io-client';

// Socket.io namespace lives at <origin>/chats; the socket.io HTTP path is
// always /socket.io. The API base URL may contain a path (e.g. https://host/api
// in prod) — appending the namespace to it would silently change the namespace
// to /api/chats and the backend would reject the connection. Use the origin only.
const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005';
const socketOrigin = new URL(apiUrl).origin;

class SocketService {
  private socket: Socket | null = null;
  private listeners: { event: string; callback: (data: any) => void }[] = [];

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        reject(new Error('Authentication token not found'));
        return;
      }

      if (this.socket) {
        this.socket.disconnect();
      }

      this.socket = io(`${socketOrigin}/chats`, {
        path: '/socket.io',
        auth: {
          token,
        },
      });

      this.socket.on('connect', () => {
        console.log('Socket connected successfully');
        
        // Reattach all listeners
        this.listeners.forEach(({ event, callback }) => {
          this.socket?.on(event, callback);
        });
        
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reject(error);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinChat(chatId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('joinChat', chatId);
    } else {
      console.error('Socket not connected, cannot join chat');
    }
  }

  leaveChat(chatId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leaveChat', chatId);
    }
  }

  on(event: string, callback: (data: any) => void): void {
    // Store the listener so we can reattach it on reconnect
    this.listeners.push({ event, callback });
    
    // Attach listener if socket exists
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (data: any) => void): void {
    // Remove from stored listeners
    this.listeners = this.listeners.filter(
      (listener) => !(listener.event === event && (!callback || listener.callback === callback))
    );
    
    // Remove from socket if it exists
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Create a singleton instance
const socketService = new SocketService();

export default socketService; 