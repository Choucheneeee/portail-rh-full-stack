import { Component, HostListener, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AdminServiceService } from '../admin-service.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class SidebarComponent implements OnInit {
  expanded = true;
  isMobile = window.innerWidth < 768;
  private logoutSubscription!: Subscription;
  @Input() isMobileOpen: boolean = false; // Define the isMobileOpen input property

  menuItems = [
    { 
      icon: 'users', 
      label: 'Gestion des utilisateurs', 
      route: '/admin', 
      exact: true 
    },
    { 
      icon: 'clipboard-check', 
      label: 'Approbations', 
      route: '/admin/approvals', 
      exact: false 
    },
    { 
      icon: 'activity', 
      label: 'Logs et activités', 
      route: '/admin/logs', 
      exact: false 
    }
  ];

  constructor(private router: Router,private share:AdminServiceService) {
    // Close sidebar on route change in mobile view
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.isMobile) {
        this.isMobileOpen = false;
      }
    });
  }

  ngOnInit() {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
    if (!this.isMobile) {
      this.isMobileOpen = false;
      this.expanded = true;
    }
  }

  toggleExpanded() {
    if (!this.isMobile) {
      this.expanded = !this.expanded;
    }
  }

  toggleMobile() {
    this.isMobileOpen = !this.isMobileOpen;
  }

  logout() {
    try{
      this.logoutSubscription=this.share.logout().subscribe((res:any)=>{
        console.log(res);
        this.logoutSubscription.unsubscribe();
        localStorage.removeItem('token');
      localStorage.removeItem('loggedInUserId');
      localStorage.removeItem('role');
      this.router.navigate(['/login'], { 
        state: { welcomeMessage: 'Vous avez été déconnecté avec succès.' } 
      });
      })
    }
    catch (error){
      alert(error);

    }
    
  }
}