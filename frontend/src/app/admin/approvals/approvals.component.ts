// src/app/admin/approvals/approvals.component.ts
import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CloudCog, LucideAngularModule } from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminServiceService } from '../admin-service.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../../services/user.service';
import { ConfirmDialogComponent } from '../../Rh/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarConfig, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';


interface Approval {
  name: string;
  email: string;
  role: string;
  status: "Pending" | "Approved" | "Rejected";
  date: Date;
  _id: string;
}

@Component({
  selector: 'app-approvals',
  templateUrl: './approvals.component.html',
  imports: [
    LucideAngularModule,
    CommonModule,
    FormsModule,
    MatSnackBarModule // Add this import
  ],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('0.3s ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class ApprovalsComponent implements OnInit {
  pendingApprovals: Approval[] = [];
  filteredApprovals: Approval[] = [];
  searchTerm: string = '';
  filterRole: string = '';
  roles: string[] = ['admin', 'rh', 'collaborateur'];
  users: User[] = [];
  isLoading = true;
  readonly apiUrl = environment.apiUrl;
  readonly baseUrl = environment.baseUrl || environment.apiUrl;
  private userobserv!: Subscription;
  readonly defaultAvatar = 'assets/images/icon/man.png';
  private approveobserv!: Subscription;

  ngOnInit() {
    // Initialize your data here
    this.loadApprovals();
  }
constructor(
  private share: AdminServiceService,
  private dialog: MatDialog,
  private router: Router,
  private snackBar: MatSnackBar
) {}

// Replace the alert in approveUser method with a snackbar
approveUserNotif(userId: any) {
  this.isLoading = true;
  const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    width: '350px',
    data: { message: 'Are you sure you want to approve this user?' }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.approveobserv = this.share.approveU(userId).subscribe(
        (response: any) => {
          this.fetchUsers();
          this.isLoading = false;
          this.showNotification('User approved successfully', 'success');
        },
        (error) => {
          this.isLoading = false;
          this.showNotification('Failed to approve user', 'error');
        }
      );
    } else {
      this.isLoading = false;
      this.showNotification('User approval cancelled', 'info');
    }
  });
}

// Add a helper method for showing notifications
// Add these imports at the top of the file

// Update the showNotification method
showNotification(message: string, type: 'success' | 'error' | 'info') {
  const config: MatSnackBarConfig = {
    duration: 4000,
    horizontalPosition: 'end' as MatSnackBarHorizontalPosition,
    verticalPosition: 'top' as MatSnackBarVerticalPosition,
    panelClass: [
      'notification-snackbar',
      type === 'success' ? 'snackbar-success' :
      type === 'error' ? 'snackbar-error' :
      'snackbar-info'
    ]
  };
  this.snackBar.open(message, 'Fermer', config);
}
  loadApprovals() {
    // Mock data with various scenarios
    this.fetchUsers();
    this.filterApprovals();
  }

  filterApprovals() {
    const searchLower = this.searchTerm.toLowerCase().trim();
    console.log("searchLower", this.pendingApprovals);
    this.filteredApprovals = this.pendingApprovals.filter(approval => {
      // Search in multiple fields
      const searchMatches = !searchLower || [
        approval.name,
        approval.email,
        approval.role,
        approval.status,
        approval._id
      ].some(field => field.toLowerCase().includes(searchLower));

      
      const roleMatches = !this.filterRole || approval.role === this.filterRole;

      return searchMatches && roleMatches;
    });

    // Sort by date (most recent first) and status priority
    this.filteredApprovals.sort((a, b) => {
      // Status priority: Pending > Approved > Rejected
      const statusPriority = {
        'Pending': 0,
        'Approved': 1,
        'Rejected': 2
      };

      // First sort by status priority
      const statusDiff = statusPriority[a.status] - statusPriority[b.status];
      if (statusDiff !== 0) return statusDiff;

      // Then sort by date
      return b.date.getTime() - a.date.getTime();
    });
  }

  // Add a method to handle search input changes
  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.filterApprovals();
  }

  // Add a method to handle role filter changes
  onRoleFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.filterRole = target.value;
    this.filterApprovals();
  }

  getTodayApprovals(): number {
    const today = new Date().setHours(0, 0, 0, 0);
    return this.pendingApprovals.filter(approval => 
      new Date(approval.date).setHours(0, 0, 0, 0) === today
    ).length;
  }

  getStatusClass(status: 'Pending' | 'Approved' | 'Rejected'): string {
    const classes: { [key in 'Pending' | 'Approved' | 'Rejected']: string } = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  approveUser(userId: any) {
    this.isLoading = true;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: { message: 'Are you sure you want to approve this user?' }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.approveobserv = this.share.approveU(userId).subscribe(
          (response: any) => {
            this.fetchUsers();
            this.isLoading = false;
          }
        );
      }
      else{
        this.showNotification('User approval cancelled', 'info');
        this.isLoading = false;
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
        this.approveobserv = this.share.deleteU(userId).subscribe(
          (response:any) => {
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
          (error:any) => {
            console.error('Error deleting user:', error);
          }
          );
          }
          
  
    });
  
  }

  viewDetails(email: string) {
    // TODO: Implement view details logic
    console.log('Viewing details for:', email);
  }

  fetchUsers(): void {
    this.isLoading = true;
    this.userobserv = this.share.getUsers().subscribe({
      next: (response: any) => {
        console.log("response", response);
        this.pendingApprovals = response.unverifiedUsers.map((user: any) => ({
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
          _id: user._id,
          status: "Pending",
          date: new Date(user.createdAt || Date.now()),
          profileImage: user.profileImage ? `${this.baseUrl}${user.profileImage}?t=${Date.now()}` : this.defaultAvatar
        }));
        this.filterApprovals();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching users:', error);
        this.isLoading = false;
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
  ngOnDestroy(): void {
    this.userobserv.unsubscribe();
    
  }

}