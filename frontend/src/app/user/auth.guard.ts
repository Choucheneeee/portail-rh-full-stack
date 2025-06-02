// auth.guard.ts (updated)
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './authservice.guard'; // Import the AuthService
import { getRoleFromToken } from '../auth.util';


@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    console.log("guard user");
    // Check authentication
    if(localStorage.getItem('token') === null) {
      console.log("User is not authenticated");
      this.router.navigate(['/login']);
      return false;
    }

    // Get required role from route data
    const requiredRole = route.data['role'];
    const userRole = getRoleFromToken();

    // Check if user has the required role
    if (requiredRole && userRole !== requiredRole) {
      console.log("User is not authenticated 222222222222");

      this.router.navigate([userRole?.toLowerCase() || '/login']);
            return false;
    }

    return true;
  }
}