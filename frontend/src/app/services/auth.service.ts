import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const userId = localStorage.getItem('loggedInUserId');
    const role = localStorage.getItem('role');
    if (userId && role) {
      this.currentUserSubject.next({
        _id: userId,
        firstName: '', // These will be updated when needed
        lastName: '',
        role: role
      });
    }
  }

  getCurrentUser(): User | null {
    const userId = localStorage.getItem('loggedInUserId');
    const role = localStorage.getItem('role');
    if (userId && role) {
      return {
        _id: userId,
        firstName: '',
        lastName: '',
        role: role
      };
    }
    return null;
  }

  login(credentials: { email: string; password: string }): Observable<User> {
    return this.http.post<User>(`${environment.apiUrl}/auth/login`, credentials);
  }

  
} 