import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ServiceRHService } from '../service-rh.service';
import { SocketService } from '../../service/socket.service';
import { take } from 'rxjs/operators';
import { StatsComponent } from '../stats/stats.component';
import { Router } from '@angular/router';

interface MyData {
  request: any,
  Numbercollaborators: any,
  collaborator: any,
  unverifiedUsers: any
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  imports: [StatsComponent],
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private onlineUsersSubscription!: Subscription;
  private userobserv!: Subscription;
  private onlineUsersSub!: Subscription;

  public notifications: any[] = [];
  nb_rh: any;
  Nbcollaborators: any;
  rh: any;
  request: any;
  count: any;
  collaborator: any;
  onlineUsers: string[] = [];
  isAdmin: boolean = false;

  constructor(
    private share: ServiceRHService,
    private cdRef: ChangeDetectorRef,
    private router: Router,
    private socketService: SocketService  
  ) {}

  ngOnInit(): void {
    this.fetchUserData();
    this.setupSocketListeners();
    this.listenToOnlineUsers();

  }

  private fetchUserData(): void {
    this.userobserv = this.share.getUsers().subscribe(
      (data: MyData) => {
        console.log("dataaa",data)
        this.Nbcollaborators = data.Numbercollaborators;
        this.request = data.request;
        this.collaborator = data.collaborator;
        this.cdRef.detectChanges();
      },
      (error) => {
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
    );
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

    this.onlineUsersSubscription = this.socketService.on('onlineUsers').subscribe(
      (count: number) => {
        this.count = count;
        this.cdRef.detectChanges();
      },
      (error) => console.error('Error:', error)
    );
  
    
  }
  ngOnDestroy(): void {
    
  }

  private sortNotifications(): void {
    this.notifications.sort((a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }
}
