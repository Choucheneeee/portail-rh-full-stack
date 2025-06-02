import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminServiceService {

  constructor(private http: HttpClient) {}
  readonly apiUrl = environment.apiUrl;

  getUsers(): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return new Observable(); // Return an empty observable to avoid further errors
    }
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.get(`${this.apiUrl}/admin/allusers`, { headers });
  }
  getData():Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return new Observable(); // Return an empty observable to avoid further errors
    }
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.get(`${this.apiUrl}/admin/dashData`, { headers });
  }
  updateUserRole(userId: string, newRole: string): Observable<any> {
    console.log("user", userId);
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return new Observable(); // Return an empty observable to avoid further errors
    }
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.put(`${this.apiUrl}/admin/updateruser/${userId}`, { newRole }, { headers });
    
  }
  approveU(userId: string): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return new Observable(); // Return an empty observable to avoid further errors
    }

    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.put(`${this.apiUrl}/user/approveuser`, { userId }, { headers });
  }

  deleteU(userId: string): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');    
      return new Observable(); // Return an empty observable to avoid further errors
    }
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.delete(`${this.apiUrl}/user/deleteuser/${userId}`, { headers });
  }

  addUser(userData: any): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return new Observable(); // Return an empty observable to avoid further errors
    }
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.post(`${this.apiUrl}/auth/register`, userData, { headers });
  }
  
  getnotifications(): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return of(null); // Prevent app crash
    }
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    const id = localStorage.getItem('loggedInUserId');
    return this.http.get(`${this.apiUrl}/notification/get-notification/${id}`, { headers });
  }
  logout(): Observable<any> { 
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return of(null); // Prevent app crash
    }
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.put(`${this.apiUrl}/auth/logout`, {}, { headers });
  }

}
