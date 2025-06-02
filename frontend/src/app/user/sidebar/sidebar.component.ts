import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PersonelInfoComponent } from '../personel-info/personel-info.component';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { EmployeServiceService } from '../../service/employe-service.service';

@Component({
  selector: 'app-sidebar',
  imports: [
    CommonModule,
                ReactiveFormsModule,
                RouterModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
  userAvatar: string  | null = null; // Declare the userAvatar property
  @Input() firstName: string = '';
  @Input() userData: any;  // Add this to receive full user data
  private logoutSubscription!: Subscription;

  @Input() lastName: string = '';
  @Input() imageUrl: string = '';
  currentImageUrl: string = '/assets/default-avatar.jpg';
  @Output() profileToggled = new EventEmitter<boolean>();
  @Output() requestToggled = new EventEmitter<void>();
  @Output() chatToggled = new EventEmitter<void>(); 
  @Output() documentsToggled = new EventEmitter<void>();
  @Output() formationToggled = new EventEmitter<void>();
  @Output() congeToggled = new EventEmitter<void>();
  @Output() pretAvanceToggled = new EventEmitter<void>();

  showProfile() {
    this.profileToggled.emit(true);  
  }
  
  isOpen = false;
  isMobileScreen = false;

  toggleSidebar() {
    this.isOpen = !this.isOpen;
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobileScreen = window.innerWidth < 768; // md breakpoint
    if (this.isMobileScreen) {
      this.isOpen = false;
    }
  }

  handleNavigation(route: string) {
    this.router.navigate([route]);
    if (this.isMobileScreen) {
      this.toggleSidebar(); // Close sidebar after navigation on mobile
    }
  }

  // Update your navigation methods
  showPersonelInfo() {
    this.profileToggled.emit(false); 
  }

  showRequest() {
    this.requestToggled.emit(); 
    if (this.isMobileScreen) this.isOpen = false;

  }

  showChat() {
    this.chatToggled.emit(); 
    if (this.isMobileScreen) this.isOpen = false;

  }
  
  showDocuments() {
    this.documentsToggled.emit();
    if (this.isMobileScreen) this.isOpen = false;

  }

  showFormation() {
    this.formationToggled.emit();
    if (this.isMobileScreen) this.isOpen = false;

  }

  showConge() {
    this.congeToggled.emit();
    if (this.isMobileScreen) this.isOpen = false;

  }

  showPretAvance() {
    this.pretAvanceToggled.emit();
    if (this.isMobileScreen) this.isOpen = false;

  }
  
  constructor(private router: Router,private share:EmployeServiceService){
    this.checkScreenSize();

  }


  @Output() menuToggled = new EventEmitter<boolean>();
  isMenuDisplayed: boolean = false;

  toggleMenu() {
    this.isMenuDisplayed = !this.isMenuDisplayed;
    this.menuToggled.emit(this.isMenuDisplayed); 
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

    ngOnInit() {
      this.checkScreenSize();
      window.addEventListener('resize', () => this.checkScreenSize());
            if (this.imageUrl) {
        this.currentImageUrl = this.imageUrl;
      }
      if (this.userData) {
        this.firstName = this.userData.firstName || '';
        this.lastName = this.userData.lastName || '';
        this.imageUrl = this.userData.imageUrl || this.currentImageUrl;
      }
    }
    

    ngOnChanges(changes: SimpleChanges) {
      if (changes['imageUrl']?.currentValue) {
        this.currentImageUrl = changes['imageUrl'].currentValue;
        this.validateImageUrl(this.currentImageUrl);
      }
      
        
      if (changes['userData'] && this.userData) {
        this.firstName = changes['userData'].currentValue.firstName || this.firstName;
        this.lastName = changes['userData'].currentValue.lastName || this.lastName;
        this.imageUrl = changes['userData'].currentValue.imageUrl || this.currentImageUrl; // Update imageUrl if provided
      }
      
      
      
      // Fallback to userData if direct props aren't provided
    }
  
    private validateImageUrl(url: string) {
      const img = new Image();
      img.onload = () => console.log("Image loads successfully");
      img.onerror = () => {
        console.error("Failed to load image");
        this.currentImageUrl = '/assets/default-avatar.jpg';
      };
      img.src = url;
    }
    
}
