import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AdminServiceService } from '../service/admin-service.service';

@Injectable({
  providedIn: 'root'
})
export class authAdminGuard implements CanActivate {

  constructor(private authService: AdminServiceService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    if (!this.authService.isAuthenticated()) {
      console.log("User is not authenticated admin");
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }
}
