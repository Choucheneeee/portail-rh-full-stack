import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface LoginResponse {
  token: string;
  name: string;
  role: string;
  userId:string
}

interface VerifResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeServiceService {
    readonly apiUrl = environment.apiUrl;
  
  private userSubject = new BehaviorSubject<any>(null);
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

  addNewStudent(profile: any): Observable<any> {
    console.log("profile", profile);
    return this.http.post(`${this.apiUrl}/auth/register`, profile);
  }
  getFormationById(id: string): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return of(null); // Prevent app crash
    }   
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.get(`${this.apiUrl}/formation/${id}`, { headers });
  }
  getCongeById(id:string):Observable<any>{
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return of(null); // Prevent app crash
    }
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.get(`${this.apiUrl}/conge/${id}`, { headers });  
  }
  updateConge(id: string, form: any): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return of(null); // Prevent app crash
    }   
    console.log("form", form);
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.put(`${this.apiUrl}/conge/update/${id}`, form, { headers });
  }
  getAvanceById(id:string):Observable<any>{
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return of(null); // Prevent app crash
    }
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.get(`${this.apiUrl}/avance/${id}`, { headers });  
  }
  updateDocument(id: string, form: any): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return of(null); // Prevent app crash
    }
    console.log("form", form);
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.put(`${this.apiUrl}/document/update/${id}`, form, { headers });
  }
  getDocumentById(id:string):Observable<any>{
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return of(null); // Prevent app crash
    }
    console.log("id", id);
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.get(`${this.apiUrl}/document/get/${id}`, { headers });  
    
  }
  updateAvance(id: string, form: any): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return of(null); // Prevent app crash
    }   
    console.log("form", form);  
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.put(`${this.apiUrl}/avance/update/${id}`, form, { headers });
  }
  updateFormation(id: string, form: any): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return of(null); // Prevent app crash
    }
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.put(`${this.apiUrl}/formation/update/${id}`, form, { headers });
  }
  deleteRequest(id: any): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return new Observable(); // Return an empty observable to avoid further errors
    }
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.delete(`${this.apiUrl}/document/deletereq/${id}`, { headers });
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
  sendsignature(signature:any):Observable<any>{
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return of(null); // Prevent app crash
    }
    console.log("lyyyy signaaa 2 ",signature)
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.post(`${this.apiUrl}/user/addsignature`, {signature} ,{ headers });
  }

  addDemande(form:any):Observable<any>{
    const token =localStorage.getItem("token");
    if(!token){
      return new Observable(); // Return an empty observable to avoid further errors
    }
    const headers=new HttpHeaders().set("Authorization",`${token}`)
    return this.http.post(`${this.apiUrl}/document/${form.documentType}`, form,{ headers });

  }
  
  getMyRequests(): Observable<any> {
    const token = localStorage.getItem('token');

    if (!token) {
      console.warn('Token not found');
      return of(null); // Prevent app crash
    }


    const headers = new HttpHeaders().set('Authorization', `${token}`);

    return this.http.get(`${this.apiUrl}/demande/myrequests`,{ headers });
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

  sentnotif(message:string,recipientId:string): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return new Observable(); // Return an empty observable to avoid further errors
    }
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.post(`${this.apiUrl}/notification/send-notification`,{message,recipientId}, { headers });

    
  }

  verifyemail(email: string, code: string): Observable<VerifResponse> {
    const verif = { email, code };
    return this.http.post<VerifResponse>(`${this.apiUrl}/auth/verify-email`, verif);
  }

  loginemployee(profile: any): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, profile);
  }

  searchUserByToken(): Observable<any> {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('Token not found');
      this.userSubject.next(null);
      return of(null); // Prevent error
    }

    const headers = new HttpHeaders().set('Authorization', `${token}`);

    return this.http.get<any>(`${this.apiUrl}/user/getuser`, { headers }).pipe(
      tap((data) => {
        this.userSubject.next(data); // Update the BehaviorSubject
      }),
      catchError((error) => {
        console.error('Error fetching user:', error);
        this.userSubject.next(null);
        return of(null);
      })
    );
  }

  // Allow other parts of the app to manually refresh user data
  refreshUserData(): void {
    this.searchUserByToken().subscribe();
  }

updateEmployee(id: string, formData: FormData) {
    const token = localStorage.getItem('token');

    if (!token) {
      console.warn('Token not found');
      return of(null); // Prevent app crash
    }

    const headers = new HttpHeaders().set('Authorization', `${token}`);

    return this.http.put(`${this.apiUrl}/user/updateuser`, formData, { headers }).pipe(
      tap(() => {
        this.refreshUserData();
      }),
      catchError((error) => {
        console.error('Error updating user:', error);
        return of(null);
      })
    );
  }



  addRequest(request: any): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      alert('Authentication error. Please login again.');
      return of(null); // Prevent app crash
    }
  
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    
    return this.http.post(`${this.apiUrl}/document`, request, { headers }).pipe(
      tap((response) => {
        this.refreshUserData(); // Ensure UI updates with latest data
      }),
      catchError((error) => {
        // Show user-friendly error message
        const errorMsg = error.error.error || 'Failed to submit request. Please try again.';
        alert(errorMsg);
        return of(null); // Return null to prevent subscription error
      })
    );
  }



    sendbotMessage(payload: { messages: Array<{ role: string, content: string }> }): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      return of(null); // Prevent app crash
    }
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.post(`${this.apiUrl}/bot/send-message`, { messages: payload.messages }, { headers });
  }

  sendNotificationToAdmin(userId: string, message: string): Observable<any> {
    const notificationData = { userId, message };
    return this.http.post<any>(`${this.apiUrl}/send-notificationAdmin`, notificationData);
  }

  createFormation(form:any):Observable<any>{

    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      alert('Authentication error. Please login again.');
      return of(null); // Prevent app crash
    }
  
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.post(`${this.apiUrl}/formation`, form, { headers })

  }
  createconges(form:any):Observable<any>{

    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      alert('Authentication error. Please login again.');
      return of(null); // Prevent app crash
    }
  
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.post(`${this.apiUrl}/conge`, form, { headers })

  }
createavance(form:any):Observable<any>{

    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token not found');
      alert('Authentication error. Please login again.');
      return of(null); // Prevent app crash
    }
  
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.post(`${this.apiUrl}/avance`, form, { headers })

  }
  

}


// msg

