import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: WebSocket;
  private messageSubject = new Subject<Message>();

  constructor(private http: HttpClient) {
    this.socket = new WebSocket(environment.socketUrl);
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.messageSubject.next(message);
    };
  }

  connect(): Observable<Message> {
    return this.messageSubject.asObservable();
  }

  getMessages(userId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${environment.apiUrl}/messages/${userId}`);
  }

  sendMessage(message: Partial<Message>): Observable<Message> {
    return this.http.post<Message>(`${environment.apiUrl}/messages`, message);
  }

  getUnreadCounts(): Observable<{ [key: string]: number }> {
    return this.http.get<{ [key: string]: number }>(`${environment.apiUrl}/messages/unread`);
  }

  markMessagesAsRead(userId: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/messages/read/${userId}`, {});
  }
} 