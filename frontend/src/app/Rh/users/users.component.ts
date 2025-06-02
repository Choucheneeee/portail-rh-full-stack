import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ServiceRHService } from '../service-rh.service';
import { Subscription } from 'rxjs';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { Router, RouterModule } from '@angular/router';


// Updated User interface with avatar
interface User {
  _id: string;
  createdAt: string;
  email: string;
  firstName: string;
  isApproved: boolean;
  isVerified: boolean;
  lastName: string;
  role: string;
  avatar: string;
}

interface MyData {
  request: any,
  Numbercollaborators: any,
  collaborator: User[],
  unverifiedUsers: any,
  rh:User[]
}


@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterModule],
  animations: [
    // Card entrance animation
    trigger('cardAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger('100ms', [
            animate('0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),

    // Button scale animation
    trigger('buttonScale', [
      transition(':enter', [
        style({ transform: 'scale(0)' }),
        animate('0.2s cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ transform: 'scale(1)' }))
      ])
    ])
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit, OnDestroy {
  private userobserv!: Subscription;
  private approveobserv!: Subscription;
  users: User[] = [];
  readonly defaultAvatar = 'assets/images/icon/man.png'; // Default avatar

  // Filter controls
  

  constructor(private share: ServiceRHService,private dialog: MatDialog, private http: HttpClient ,private router:Router) {


  }

  ngOnInit(): void {
    this.fetchUsers();

  }

  fetchUsers(): void {
    this.userobserv = this.share.getUsers().subscribe(
      (data: MyData) => {
        
        this.users = [
          ...data.collaborator.map(user => ({
            ...user,
            avatar: user.avatar || this.defaultAvatar,
          }))
        ];
      },
      (error:any) => {
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

  searchText = '';
  selectedRole = '';
  selectedApproval = '';  // Changed from 'approved' to empty string
  selectedVerification = 'verified';  // Changed from 'verified' to empty string

filteredUsers(): User[] {
  const searchTextLower = this.searchText.toLowerCase();
  

  const filtered = this.users.filter(user => {
    const matchesRole = this.selectedRole === '' || user.role?.toLowerCase() === this.selectedRole.toLowerCase();
    const matchesApproval = this.selectedApproval === '' ||
      (this.selectedApproval === 'approved' ? user.isApproved : !user.isApproved);
    const matchesVerification = this.selectedVerification === '' || 
      (this.selectedVerification === 'verified' ? user.isVerified : !user.isVerified);
    const matchesSearch = !searchTextLower || 
      (user.firstName?.toLowerCase().includes(searchTextLower)) ||
      (user.lastName?.toLowerCase().includes(searchTextLower)) ||
      (user.email?.toLowerCase().includes(searchTextLower));

  
    return matchesRole && matchesApproval && matchesVerification && matchesSearch;
  });

  return filtered;
}
approveUser(userId: string): void {

  const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    width: '350px',
    data: { message: 'Are you sure you want to approve this user?' }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.approveobserv = this.share.approveUser(userId).subscribe(
        (response) => {
          this.fetchUsers();

        }
      );
    }

  });

}

deleteUser(userId: string): void {
  const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    width: '350px',
    data: { message: 'Are you sure you want to delete this user?' }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.approveobserv = this.share.deleteUser(userId).subscribe(
        (response) => {
          this.fetchUsers();

          if (userId === localStorage.getItem('loggedInUserId')) {  // Assuming you have the logged-in user ID stored
            // Remove the token to log the user out
            localStorage.removeItem('token'); 
    
            // Optionally, you can clear other user-related data as well
            localStorage.removeItem('loggedInUserId'); // If you store the user ID in local storage
    
            // Redirect to the login page
            this.router.navigate(['/login']);
            
          }
        },
        error => {
          console.error('Error deleting user:', error);
        }
        );
        }
        

  });

}
  viewProfile(userId: string): void {
    this.router.navigate(['/rh/profile', userId]);
  }


  ngOnDestroy(): void {
    if (this.userobserv) {
      this.userobserv.unsubscribe(); // Prevent memory leaks
    }
  }
}
