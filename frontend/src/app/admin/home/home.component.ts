import { ChangeDetectorRef, Component, OnDestroy, OnInit, HostListener } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { AdminServiceService } from '../admin-service.service';
import { Subscription } from 'rxjs';
import { SocketService } from '../../service/socket.service';

export interface Notification {
  id?: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface StatCard {
  label: string;
  count: number;
  icon: string;
  iconColor?: string;
  bgColor?: string;
}

@Component({
  selector: 'app-home',
  imports: [
    RouterOutlet,
    CommonModule,
    SidebarComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('0.3s ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ],
})
export class HomeComponent implements OnInit, OnDestroy {
  isSidebarOpen = false;
  showAddUserForm = false;
  private userobserv!: Subscription;
  Numbercollaborators: any;
  NumberAdmin: any;
  statCards: any;
  NumberRh: any;
  count: any;
  isNotificationDropdownOpen = false;
  private getnotification!: Subscription;
  private notificationSound = new Audio('assets/audio/sound.mp3');

  private notifSubscription!: Subscription;
  notifications: Notification[] = [];
  unreadCount = 0;

  private onlineUsersSubscription!: Subscription;
  private onlineUsersSub!: Subscription;

  constructor(
    private share: AdminServiceService,
    private cdRef: ChangeDetectorRef,
    private router: Router,
    private socketService: SocketService
  ) {
    this.setupNotificationListener();
  }

  private setupNotificationListener(): void {
    this.notifSubscription = this.socketService
      .on('notif')
      .subscribe({
        next: (data) => {
          this.playNotificationSound(); // Play sound here

          const newNotification: Notification = {
            message: data.message,
            timestamp: new Date(),
            read: false
          };
          alert(newNotification.message)
          this.notifications.unshift(newNotification);

          this.unreadCount++;
          this.cdRef.detectChanges();
        },
        error: (error) => {
          console.error('Error receiving notification:', error);
        }
      });
  }


   private playNotificationSound() {
    try {
      this.notificationSound.currentTime = 0;
      this.notificationSound.play();
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleAddUserForm() {
    this.showAddUserForm = !this.showAddUserForm;
  }

  ngOnInit(): void {
    this.fetchUserData();
    this.listenToOnlineUsers();
    this.setupSocketListeners();
    this.getnotifications()

  }
  displayedNotifsCount = 3;
  private scrollDebounceTime = 200;

  private getnotifications() {
    this.getnotification = this.share.getnotifications().subscribe({
      next: (data: any) => {
        this.notifications = data;
        this.displayedNotifsCount = 5;
        this.cdRef.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching notifications:', error);
      }
    });
  }
  openModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('show');
    }
  }

  toggleNotificationDropdown(event: Event) {
    event.stopPropagation();
    this.isNotificationDropdownOpen = !this.isNotificationDropdownOpen;
    if (this.isNotificationDropdownOpen) {
      this.markNotificationsAsRead();
    }
  }

  private markNotificationsAsRead(): void {
    this.notifications = this.notifications.map(notification => ({
      ...notification,
      read: true
    }));
    this.unreadCount = 0;
    this.cdRef.detectChanges();
  }

  private fetchUserData(): void {
    this.userobserv = this.share.getData().subscribe({
      next: (data: any) => {
        this.Numbercollaborators = data.Numbercollaborators;
        this.NumberRh = data.NumberRh;
        this.NumberAdmin = data.NumberAdmin;
        this.cdRef.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching user data:', error);
        if(error.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('loggedInUserId');
          localStorage.removeItem('role');
          this.router.navigate(['/login'], { 
            state: { welcomeMessage: 'Vous avez été déconnecté avec succès.' } 
          });
        }
      }
    });
  }

  private listenToOnlineUsers(): void {
    this.onlineUsersSub = this.socketService.getOnlineUsersNumber()
      .subscribe({
        next: (userIds: string[]) => {
          this.count = userIds.length;
          this.cdRef.detectChanges();
        },
        error: (err) => console.error('Online users error:', err)
      });
  }

  private setupSocketListeners(): void {
    this.onlineUsersSubscription = this.socketService.on('onlineUsers').subscribe({
      next: (count: number) => {
        this.count = count;
        this.cdRef.detectChanges();
      },
      error: (error) => console.error('Error in online users socket:', error)
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const notificationButton = target.closest('button[class*="notification"]');
    const notificationDropdown = target.closest('.notification-dropdown');
    
    if (!notificationButton && !notificationDropdown) {
      this.isNotificationDropdownOpen = false;
    }
  }

  ngOnDestroy(): void {
    this.userobserv?.unsubscribe();
    this.onlineUsersSub?.unsubscribe();
    this.onlineUsersSubscription?.unsubscribe();
    this.notifSubscription?.unsubscribe();
  }
}
