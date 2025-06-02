import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './authservice.guard';
import { getRoleFromToken } from '../auth.util';

@Injectable({
  providedIn: 'root'
})
export class NotAuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    // Check if authenticated
    if (this.authService.isAuthenticated()) {
      const role = getRoleFromToken();
      console.log("User is authenticated 44", role);
      // Redirect based on user role
      switch(role?.toLowerCase()) {
        case 'admin':
          this.router.navigate(['/admin']);
          break;
        case 'rh':
          this.router.navigate(['/rh']);
          break;
        case 'collaborateur':
          this.router.navigate(['/collaborateur']);
          break;
        default:
          this.router.navigate(['/login']);
      }
      return false;
    }
    
    // Allow access to auth routes for non-authenticated users
    return true;
  }
}