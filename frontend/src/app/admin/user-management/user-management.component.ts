// src/app/admin/user-management/user-management.component.ts
import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { response } from 'express';
import { AdminServiceService } from '../admin-service.service';
import { environment } from '../../../environments/environment';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../Rh/confirm-dialog/confirm-dialog.component';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'rh' | 'collaborateur';
  status: 'active' | 'inactive';
  profileImage?: string;
  isVerified: boolean;
  isApproved: boolean;
}

type TabType = 'all' | 'admin' | 'rh' | 'collaborateur' | 'isApproved';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',  
  styleUrls: ['./user-management.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,FormsModule]
})
export class UserManagementComponent implements OnInit {
  private userobserv!: Subscription;
  activeTab: TabType = 'all';
  tabs: TabType[] = ['all', 'admin', 'rh', 'collaborateur','isApproved'];
  isMobile: boolean = false;
  isTableScrollable: boolean = false;
  readonly defaultAvatar = 'assets/images/icon/man.png';
  users: User[] = [];
  isLoading = true;
  readonly apiUrl = environment.apiUrl;
  readonly baseUrl = environment.baseUrl || environment.apiUrl;
  showAddUserForm = false;
  addUserForm: FormGroup;

  private readonly labels: Record<TabType, string> = {
    'all': 'Tous les utilisateurs',
    'admin': 'Administrateurs',
    'rh': 'Ressources Humaines',
    'collaborateur': 'Collaborateurs',
    'isApproved': 'Non vérifiés'
  };

  constructor(private share: AdminServiceService, private fb: FormBuilder, private dialog: MatDialog, private router: Router) {
    this.checkScreenSize();
    this.addUserForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      role: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.fetchUsers();
    this.checkScreenSize();
  }

  fetchUsers(): void {
    this.isLoading = true;
    this.userobserv = this.share.getUsers().subscribe({
      next: (response:any) => {
        console.log("response", response);
        this.users =[
          ...response.collaborator.map((user:any) => ({
            ...user,
            profileImage: user.profileImage ? `${this.baseUrl}${user.profileImage}?t=${Date.now()}` : this.defaultAvatar,
          })),
          ...response.admin.map((user:any) => ({
            ...user,
            profileImage: user.profileImage ? `${this.baseUrl}${user.profileImage}?t=${Date.now()}` : this.defaultAvatar,
          })),
          ...response.rh.map((user:any) => ({
            ...user,
            profileImage: user.profileImage ? `${this.baseUrl}${user.profileImage}?t=${Date.now()}` : this.defaultAvatar,
          })),
          ...response.unverifiedUsers.map((user:any) => ({
            ...user,
            profileImage: user.profileImage ? `${this.baseUrl}${user.profileImage}?t=${Date.now()}` : this.defaultAvatar,
          }))
        ];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching users:', error);
        this.isLoading = false;
      }
    });
  }

  get filteredUsers(): User[] {
    if (this.activeTab === 'all') return this.users.filter(user => user.isApproved===true);
    if (this.activeTab === 'isApproved') return this.users.filter(user => user.isApproved===false);
    return this.users.filter(user => user.role === this.activeTab && user.isApproved===true);
  }

  getTabLabel(tab: TabType): string {
    if (this.isMobile) {
      const mobileLabels: Record<TabType, string> = {
        'all': 'Tous',
        'admin': 'admin',
        'rh': 'rh',
        'collaborateur': 'collaborateur.',
        'isApproved': 'non vérifiés'
      };
      return mobileLabels[tab];
    }
    return this.labels[tab];
  }

  @HostListener('window:resize')
  checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
    this.isTableScrollable = window.innerWidth < 1024;
  }

  setActiveTab(tab: TabType): void {
    this.activeTab = tab;
  }
  
  // Add this property to track the open modal
  activeModalId: string | null = null;
  
  // Update the openModal method
  openModal(modalId: string): void {
    this.activeModalId = modalId;
  }
  
  // Update the closeModal method
  closeModal(modalId: string): void {
    this.activeModalId = null;
  }
  
  // Add this method to check if a modal is open
  isModalOpen(userId: string): boolean {
    return this.activeModalId === 'editUser' + userId;
  }

  getTabCount(tab: TabType): number {
    
    if (tab === 'all'){
      console.log("tab", tab);
      console.log("this.users.length", this.users);
      return this.users.filter(user => user.isApproved===true).length;
      
    }
    if (tab === 'isApproved'){
      return this.users.filter(user => 
        user.isApproved === false
      ).length;
    }
    return this.users.filter(user => 
      user.role.toLowerCase().includes(tab.toLowerCase()) && user.isApproved===true
    ).length;
  }

  toggleAddUserForm() {
    this.showAddUserForm = !this.showAddUserForm;
    if (!this.showAddUserForm) {
      this.addUserForm.reset();
    }
  }

  onSubmit() {
    this.isLoading = true;
    this.showAddUserForm=!this.showAddUserForm
    if (this.addUserForm.valid) {
      const userData = {
        firstName: this.addUserForm.get('firstName')?.value,
        lastName: this.addUserForm.get('lastName')?.value,
        email: this.addUserForm.get('email')?.value,
        password: this.addUserForm.get('password')?.value,
        role: this.addUserForm.get('role')?.value
      };
      
      // Call your service to add the user
      this.share.addUser(userData).subscribe({
        next: (response:any) => {
          console.log('User added successfully:', response);
          this.toggleAddUserForm();
          this.fetchUsers(); // Refresh the user list
          this.isLoading = false;
          this.showAddUserForm=false

        },
        error: (error:any) => {
          console.error('Error adding user:', error);
          this.isLoading = false;

        }
      });
    }
  }
  ngOnDestroy(): void {
    this.userobserv.unsubscribe();
    this.addUserForm.reset();
    this.showAddUserForm=false
    this.isLoading=false
    this.users=[]
    this.activeTab='all'
    this.isMobile=false
    this.isTableScrollable=false
  
    
  }


// Add this method to update user role
updateUserRole(userId: string): void {
  console.log("user", userId);

  const user = this.users.find(u => u._id === userId);
  if (!user) return;
  this.isLoading = true;
  this.share.updateUserRole(userId, user.role).subscribe({
    next: (response) => {
      this.closeModal('editUser' + userId);
      this.fetchUsers(); // Refresh the user list
      this.isLoading = false;
      alert(response.message)
    },
    error: (error) => {
      console.error('Error updating user role:', error);
      this.isLoading = false;
    }
  });
}
// Add this method to delete user
deleteUser(userId: string): void {
  const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    width: '350px',
    data: { message: 'Êtes-vous sûr de vouloir supprimer cet utilisateur ?' }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.isLoading = true;
      this.share.deleteU(userId).subscribe({
        next: (response) => {
          this.fetchUsers(); // Refresh the user list
          this.isLoading = false;
          
          if (userId === localStorage.getItem('loggedInUserId')) {
            localStorage.removeItem('token');
            localStorage.removeItem('loggedInUserId');
            localStorage.removeItem('role');
            this.router.navigate(['/login']);
          }
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.isLoading = false;
        }
      });
    }
  });
}
}