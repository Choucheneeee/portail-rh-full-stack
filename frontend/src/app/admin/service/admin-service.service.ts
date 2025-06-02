import { Injectable } from '@angular/core';
import { getRoleFromToken } from '../../auth.util';

@Injectable({
  providedIn: 'root'
})
export class AdminServiceService {

  constructor() { }
  private role = getRoleFromToken();

  isAuthenticated(): boolean {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined' && this.role === 'rh') {
      return !!localStorage.getItem('token');
    } else {
      return false;
    }
  }
}
