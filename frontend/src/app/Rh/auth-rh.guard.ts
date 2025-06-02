import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ServiceRHService } from './service-rh.service';

@Injectable({
  providedIn: 'root'
})
export class authRhGuard implements CanActivate {

  constructor(private authService: ServiceRHService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    console.log("guard rh");
    if (!this.authService.isAuthenticated()) {
      console.log("User is not authenticated rh");
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }
}
