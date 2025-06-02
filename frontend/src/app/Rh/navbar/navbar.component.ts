import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, HostListener, Renderer2, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SocketService } from '../../service/socket.service';
import { ServiceRHService } from '../service-rh.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  
  isMobileMenuOpen = false;
  private logoutSubscription!: Subscription;
  isDropdownVisible: boolean = false;
  isDropdownOpenNotif=false
  isDropdownOpen = false;
  private notifSubscription!: Subscription;
  private notificationSound = new Audio('assets/audio/sound.mp3');

  private getnotification!: Subscription;
  newnotif: string = '';
  notifs: any[] = [];
  public notifications: any[] = [];

  showAlert = false;
  alertMessage = '';
  alertTimeout: any;

  constructor(
    private router: Router,
    private socketService: SocketService,
    private cdRef: ChangeDetectorRef,
    private share: ServiceRHService
  ) {
    this.notifSubscription = this.socketService
      .on('notif')
      .subscribe((data) => {
        this.playNotificationSound();
        this.notifs.unshift(data.message);
        this.showNotification(data.message);
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
    this.getnotifications()
  }

  private playNotificationSound() {
    try {
      // Reset audio to start and play
      this.notificationSound.currentTime = 0;
      this.notificationSound.play();
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    this.isDropdownOpenNotif=false;

  }
  toggleDropdownNotif() {
    this.isDropdownOpenNotif = !this.isDropdownOpenNotif;
    this.isDropdownOpen = false;

    // Fetch latest notifications when opening the dropdown
    if (this.isDropdownOpenNotif) {
      this.getnotifications();
      this.cdRef.detectChanges();
    }

  }
  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
  isActive(route: string): boolean {
    // Implement your route checking logic here
    return false;
  }
  
  

  displayedNotifsCount = 3;
  private scrollDebounceTime = 200;
  private scrollTimeout: any;
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

  
  logout() {
    try{
      localStorage.removeItem('token');
      localStorage.removeItem('loggedInUserId');
      localStorage.removeItem('role');
      this.router.navigate(['/login'], { 
        state: { welcomeMessage: 'Vous avez été déconnecté avec succès.' } 
      });
      this.logoutSubscription=this.share.logout().subscribe((res:any)=>{
        console.log(res);
        this.logoutSubscription.unsubscribe();
        
      })
    }
    catch (error){
      alert(error);

    }
  }

  goToRequest() {
    this.router.navigate(['rh/request']);
  }

  goToUsers() {
    this.router.navigate(['rh/users']);
  }

  goToChat() {
    this.router.navigate(['rh/chat']);
  }

  goDashboard(){
    this.router.navigate(['rh/']);
  }


}
