import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { getRoleFromToken } from '../auth.util';

@Injectable({
  providedIn: 'root',
})

export class ServiceRHService {
  constructor(private http: HttpClient) {

  }

  deleteMessage(id: string): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return new Observable(); // Return an empty observable to avoid further errors
    }
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.delete(`${this.apiUrl}/message/delete/${id}`, { headers });
  }
  readonly apiUrl = environment.apiUrl;
  
  private role = getRoleFromToken();
  isAuthenticated(): boolean {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined' && this.role === 'admin') {
      return !!localStorage.getItem('token');
    } else {
      return false;
    }
  }

  isNotAuthenticated(): boolean {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      return !localStorage.getItem('token'); // Returns true if there's no token (user is not authenticated)
    }
    return true; // Assume not authenticated in non-browser environments (e.g., SSR)
  }
  sentnotif(message:string,recipientId:string): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return new Observable(); // Retu+
      // rn an empty observable to avoid further errors
    }
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.post(`${this.apiUrl}/notification/send-notification`,{message,recipientId}, { headers });

    
  }
  getnotification(): Observable<any> {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('Token not found');
        return of(null); // Prevent app crash
      }
      const headers = new HttpHeaders().set('Authorization', `${token}`);
      const id = localStorage.getItem('loggedInUserId');
      return this.http.get(`${this.apiUrl}/notification/get-notification/${id}`, { headers });
    }

  getUsers(): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return new Observable(); // Return an empty observable to avoid further errors
    }
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    
    return this.http.get(`${this.apiUrl}/user/rh/allusers`, { headers });
  }
  getUsersChat(): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return new Observable(); // Return an empty observable to avoid further errors
    }
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    
    return this.http.get(`${this.apiUrl}/message/rh/allusers`, { headers });
  }


  hasCachedCredentials(): boolean {
    return !!localStorage.getItem('token');
  }

  approveUser(userId: string): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return new Observable(); // Return an empty observable to avoid further errors
    }
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.put(`${this.apiUrl}/user/approveuser`, { userId }, { headers });
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

  deleteUser(userId: string): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return new Observable(); // Return an empty observable to avoid further errors
    }
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.delete(`${this.apiUrl}/user/deleteuser/${userId}`, { headers });
  }

  getAllRequests(): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return new Observable(); // Return an empty observable to avoid further errors
    }
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.get(`${this.apiUrl}/demande`, { headers });
  }

  updateUser(userId: string, formData: FormData): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return new Observable();
    }
    
     const headers = new HttpHeaders().set('Authorization', `${token}`);


     return this.http.put(`${this.apiUrl}/user/updateuser/${userId}`, formData, { headers });
  }

  updateRequest(id: string, status: string, type?: string): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return new Observable();
    }
    
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    console.log("request type", type);

    // Determine the endpoint based on type
    let endpoint: string;
    const requestType = type ? type.toLowerCase() : '';

    if (requestType === 'internal' || requestType === 'external') {
      endpoint = 'Formation';
    } else if (['annuel', 'maladie', 'sans_solde', 'maternité', 'paternité'].includes(requestType)) {
      endpoint = 'Conge';
    } else if (requestType === 'pret' || requestType === 'avance') {
      endpoint = 'Avance';
    } else if (['attestation', 'fiche_paie', 'attestation_de_stage'].includes(requestType)) {
      endpoint = 'Document';
    } else {
      endpoint = ''; // default case
    }

    return this.http.put(`${this.apiUrl}/demande/${id}`, { status,endpoint }, { headers }).pipe(
      switchMap((updatedData: any) => {
        return [updatedData];
      })
    );
  }

  getMessages(currentUserId: string): Observable<any> {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('loggedInUserId');
    if (!token || !userId) {
        console.warn('Token or User ID not found');
        return new Observable();
    }
    const headers = new HttpHeaders().set('Authorization', token);
    // Add currentUserId as a query parameter
    const params = new HttpParams().set('currentUserId', currentUserId);
    return this.http.get(`${this.apiUrl}/message/${userId}`, { headers, params });
}
  deleteRequest(id: any,type:any): Observable<any> {

    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return new Observable(); // Return an empty observable to avoid further errors
    }
    let endpoint: string;
    const requestType = type ? type.toLowerCase() : '';

    if (requestType === 'internal' || requestType === 'external') {
      endpoint = 'Formation';
    } else if (['annuel', 'maladie', 'sans_solde', 'maternité', 'paternité'].includes(requestType)) {
      endpoint = 'Conge';
    } else if (requestType === 'pret' || requestType === 'avance') {
      endpoint = 'Avance';
    } else if (['attestation', 'fiche_paie', 'certificat'].includes(requestType)) {
      endpoint = 'Document';
    } else {
      endpoint = ''; // default case
    }
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.delete(`${this.apiUrl}/demande/deletereq/${endpoint}/${id}`, { headers });
  }

  sendMessage(message: any): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return new Observable(); // Return an empty observable to avoid further errors
    }
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.post(`${this.apiUrl}/message`, message, { headers });

} 
  getUserById(userId: string): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return new Observable(); // Return an empty observable to avoid further errors
    }
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.get(`${this.apiUrl}/user/getuserRh/${userId}`, { headers });
  
  }
}