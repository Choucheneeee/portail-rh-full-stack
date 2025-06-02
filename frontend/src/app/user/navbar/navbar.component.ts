import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../service/socket.service';
import { EmployeServiceService } from '../../service/employe-service.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(100%)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(100%)' }))
      ])
    ])
  ]
})
export class NavbarComponent implements OnInit {
  userAvatar: string | null = null; // Declare the userAvatar property
  private notificationSound = new Audio('assets/audio/sound.mp3');

  isDropdownOpen = false;
  isNotificationDropdownOpen = false;
  private notifSubscription!: Subscription;
  private getnotification!: Subscription;
  private logoutSubscription!: Subscription;

  newnotif: string = '';
  notifs: any[] = [];
  showAlert = false;
  alertMessage = '';
  alertTimeout: any;

  // In your constructor
  constructor(
    private router: Router,
    private cdRef: ChangeDetectorRef,
    private socketService: SocketService,
    private share: EmployeServiceService
  ) {
    this.notifSubscription = this.socketService
      .on('notif')
      .subscribe((data) => {
        console.log(data.message);
        this.notifs.unshift(data.message);
        this.showNotification(data.message);
        this.playNotificationSound();

      });
  }

  showNotification(message: string) {
    this.alertMessage = message;
    this.showAlert = true;
    
    // Clear any existing timeout
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
    }
    
    // Auto hide after 5 seconds
    this.alertTimeout = setTimeout(() => {
      this.showAlert = false;
      this.cdRef.detectChanges();
    }, 5000);
  }

  ngOnInit() {
    const userId = localStorage.getItem('loggedInUserId') || "";
    this.getnotifications()

    
  }
   private playNotificationSound() {
    try {
      this.notificationSound.currentTime = 0;
      this.notificationSound.play();
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  displayedNotifsCount = 3;
  private scrollDebounceTime = 200;

  private getnotifications() {
    if (this.getnotification) {
      this.getnotification.unsubscribe();
    }
    this.getnotification = this.share.getnotification().subscribe((data: any) => {
      this.notifs = data;
      this.displayedNotifsCount = 4;
      this.cdRef.detectChanges();
    });
  }
  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const atBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;

    if (atBottom) {
      this.loadMoreNotifications();
    }
  }

  loadMoreNotifications(): void {
    this.displayedNotifsCount += 3;
  }


  reconnectSocket() {
    this.socketService.reconnect();
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

  clearNotifications() {
    this.notifs = [];
    this.cdRef.detectChanges(); // Ensure UI updates when clearing
  }
  
  isMobileMenuOpen = false;
  toggleNotificationDropdown() {
    this.isNotificationDropdownOpen = !this.isNotificationDropdownOpen;
    this.isDropdownOpen = false;

    // Fetch latest notifications when opening the dropdown
    if (this.isNotificationDropdownOpen) {
      this.getnotifications();
      this.cdRef.detectChanges();
    }
  }

  closeNotificationDropdown() {
    this.isNotificationDropdownOpen = false;
  }

  private sortNotifications() {
    this.notifs.sort((a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }
}
