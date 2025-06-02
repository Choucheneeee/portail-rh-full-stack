import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../environments/environment";
import { catchError, throwError } from "rxjs";

// auth.service.ts
@Injectable({ providedIn: 'root' })
export class AuthService {
    readonly apiUrl = environment.apiUrl;
  
  constructor(private http: HttpClient) {}

  forgotPassword(email: string) {
    return this.http.post(`${this.apiUrl}/auth/forgot-password`, { email }).pipe(
      catchError(error => {
        console.error('Password reset error:', error);
        // Handle specific error messages from server
        const message = error.error?.message || 'An unknown error occurred';
        return throwError(() => new Error(message));
      })
    );
  }
  resetPassword(token: string, newPassword: string) {
    return this.http.post(`${this.apiUrl}/auth/reset-password`, { token, newPassword });
  }
}