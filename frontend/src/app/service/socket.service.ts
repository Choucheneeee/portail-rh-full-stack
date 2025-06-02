import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { getRoleFromToken } from '../auth.util';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket!: Socket;
  private connectionSubject = new Subject<boolean>();
  readonly socketUrl = environment.socketUrl;

  private connectionEstablished = false;
  private messageSubject = new Subject<any>();
  private onlineUsersSubject = new Subject<any[]>();

  constructor(private http: HttpClient) {
    this.initializeSocket();

  }

  private initializeSocket(): void {
    const userId = localStorage.getItem('loggedInUserId');
    const role = getRoleFromToken();

    if (!userId || !role) {
      console.error('Socket connection failed: Missing user ID or role');
      return;
    }

    // Update socket initialization with proper namespace and configuration
    this.socket = io(environment.socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { userId, role },
      query: { userId, role }, // Add query parameters for legacy support
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: true
    });

    this.setupEventListeners();
  }
  getOnlineUsers(): Observable<string[]> {
    return new Observable(observer => {
      this.socket.on('online-users', (userIds: string[]) => {
        observer.next(userIds);
      });
    });
  }

  
  private setupEventListeners(): void {

    this.socket.on('connect', () => {
      console.log('Connected to server');
      if (!this.connectionEstablished) {
        this.connectionEstablished = true;
      }})

     this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.connectionEstablished = false;
    });
    
    

    this.socket.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
      setTimeout(() => this.socket.connect(), 5000);
    });

    this.socket.on('error', (err) => {
      console.error('Socket error:', err);
    });
  }

  // Public API
  connect(): void {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  disconnect(): void {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  emit(event: string, data: any): void {
    if (!this.socket.connected) {
      console.warn('Cannot emit - socket not connected');
      return;
    }
    this.socket.emit(event, data);
  }
  getOnlineUsersNumber(): Observable<string[]> {
    return new Observable(observer => {
      // Listen for updates
      this.socket.on('online-users', (userIds: string[]) => {
        observer.next(userIds);
      });
  
      // Request initial state
      this.socket.emit('request-online-users');
    });
  }
  
  requestOnlineUsers(): void {
    this.socket.emit('request-online-users');
  }
  sendMessage(recipientId: string, message: string): void {
    if (!this.socket.connected) {
      console.error('⚠️ Not connected to socket server');
      return;
    }
    
    this.socket.emit('chat-message', { 
      recipientId, 
      message,
      timestamp: new Date().toISOString()
    });
  }
  
  // Add the message handler observable
  onMessage(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('chat-message', (data) => {
        observer.next(data);
      });
  
      return () => {
        this.socket.off('chat-message');
      };
    });
  }

  on(event: string): Observable<any> {
    return new Observable(observer => {
      const handler = (data: any) => observer.next(data);
      this.socket.on(event, handler);
      
      return () => {
        this.socket.off(event, handler);
      };
    });
  }
  
  onUserOnline(): Observable<{ userId: string }> {
    return this.on('user-online');
  }
  
  onUserOffline(): Observable<{ userId: string }> {
    return this.on('user-offline');
  }
  get connectionState$(): Observable<boolean> {
    return this.connectionSubject.asObservable();
  }

  reconnect(): void {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }
}