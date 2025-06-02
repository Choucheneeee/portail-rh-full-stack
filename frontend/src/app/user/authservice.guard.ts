import { Injectable } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor() {}

  isAuthenticated(): boolean {
    console.log("isAuthenticated");

    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      return !!localStorage.getItem('token'); 
    } else {
      return false;  // In case localStorage is not available (e.g., SSR or server-side)
    }
  }
  isNotAuthenticated(): boolean {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      return !localStorage.getItem('token'); // Returns true if there's no token (user is not authenticated)
    }
    return true; // Assume not authenticated in non-browser environments (e.g., SSR)
  }
  
}

