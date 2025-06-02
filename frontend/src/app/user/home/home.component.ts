import { ChangeDetectorRef, Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import { SidebarComponent } from "../sidebar/sidebar.component";
import { PersonelInfoComponent } from "../personel-info/personel-info.component";
import { AuthService } from '../authservice.guard';
import { Router } from '@angular/router';
import { NavbarComponent } from "../navbar/navbar.component";
import { ProfileComponent } from "../profile/profile.component";
import { EmployeServiceService } from '../../service/employe-service.service';
import { Subscription } from 'rxjs';
import { ChatComponent } from '../../Rh/chat/chat.component';
import { DocumentComponent } from "../document/document.component";
import { environment } from '../../../environments/environment';
import { FormationComponent } from "../formation/formation.component";
import { CongeComponent } from '../conge/conge.component';
import { AvanceComponent } from "../avance/avance.component";
import { BotComponent } from '../bot/bot.component';
import { ListRequestComponent } from '../request/request.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    PersonelInfoComponent,
    NavbarComponent,
    ProfileComponent,
    ListRequestComponent,
    ChatComponent,
    DocumentComponent,
    FormationComponent,
    CongeComponent,
    AvanceComponent,
    BotComponent
],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [DatePipe]
  
})
export class HomeComponent implements OnInit, OnDestroy {
  user: any;
  infoItems: any = {};
  allinfo: any = {};
  isProfileVisible = false;
  isPersonelInfoVisible = true;
  isRequestVisible = false;
  isChatVisible = false;
  isDocumentVisible = false;
  isFormationVisible = false;
  isCongeVisible = false;
  isPretAvanceVisible = false;
  imageUrl: string = '';
  userFirstName: string = '';
  userLastName: string = '';

  isMenuDisplayed = false;
  str: string = '';
  isSidebarOpen = true;
  isMobileView = false;
  readonly defaultAvatar = 'assets/images/icon/man.png';


  private userSubscription!: Subscription;
  private searchUserSubscription!: Subscription;

  constructor(
    private datePipe: DatePipe,
    private authService: AuthService,
    private router: Router,
    private share: EmployeServiceService,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {}

  private processUserData(): void {
  }
  
  private updateImageUrl(newUrl: string) {
    this.imageUrl = newUrl ? `${environment.baseUrl}${newUrl}?t=${Date.now()}` : this.defaultAvatar;
    
    console.log("Full image URL:", this.imageUrl);

    this.cdr.detectChanges();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobileView = window.innerWidth < 1024; // lg breakpoint
    if (this.isMobileView) {
      this.isSidebarOpen = false;
    } else {
      this.isSidebarOpen = true;
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
  ngOnInit(): void {
    
    this.checkScreenSize();

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
    }

    // Subscribing to user data
    this.userSubscription = this.share.user$.subscribe((data) => {
      if (data) {
        this.userFirstName = data.firstName;
        this.userLastName = data.lastName;
        this.updateImageUrl(data.profileImage);

        this.user = data;
        this.processUserData();

        // Update infoItems with the new user data
        this.infoItems = {
          id:(this.user._id),
          firstName: (this.user.firstName),
          lastName: (this.user.lastName),
          email: (this.user.email),
          role: (this.user.role),
          createdAt: this.datePipe.transform(this.user.createdAt, 'dd/MM/yyyy'),
        };

        // Update allinfo with the new user data
        this.allinfo = {
          address: (this.user.personalInfo?.address || 'N/A'),
          birthDate: this.datePipe.transform(this.user.personalInfo?.birthDate, 'dd/MM/yyyy') || null,
          hiringDate: this.datePipe.transform(this.user.professionalInfo?.hiringDate, 'dd/MM/yyyy') || null,
          phone: (this.user.personalInfo?.phone || 'N/A'),
          position: (this.user.professionalInfo?.position || 'N/A'),
          department: (this.user.professionalInfo?.department || 'N/A'),
          salary: this.user.professionalInfo?.salary ?? 'N/A',
          maritalStatus: (this.user.socialInfo?.maritalStatus || 'N/A'),
          children: this.user.socialInfo?.children ?? 'N/A',
          userId: this.user?._id || 'N/A'
        };

        // Merge infoItems into allinfo
        this.allinfo = { ...this.allinfo, ...this.infoItems };
        // Trigger change detection
        this.cdr.detectChanges();
        
      } else {
        console.warn('User data is empty');
      }
    });

    // Subscribing to searchUserByToken observable
    this.searchUserSubscription = this.share.searchUserByToken().subscribe(
      (data) => {
        if (data) {
          this.user = data;

          console.log("user", this.user);
          // Update infoItems with the new user data
          this.infoItems = {
            id: (this.user._id),
            firstName: (this.user.firstName),
            lastName: (this.user.lastName),
            email: (this.user.email),
            role: (this.user.role),
            createdAt: this.datePipe.transform(this.user.createdAt, 'dd/MM/yyyy'),
            timeOffBalance: this.user.timeOffBalance || 0,
          };

          // Update allinfo with the new user data
          this.allinfo = {
            address: (this.user.personalInfo?.address || null ),
            birthDate: this.datePipe.transform(this.user.personalInfo?.birthDate, 'dd/MM/yyyy') || null,
            hiringDate: this.datePipe.transform(this.user.professionalInfo?.hiringDate, 'dd/MM/yyyy') || null,
            phone: (this.user.personalInfo?.phone || null),
            position: (this.user.professionalInfo?.position || null),
            department: (this.user.professionalInfo?.department || null),
            salary: this.user.professionalInfo?.salary ?? null,
            maritalStatus: (this.user.socialInfo?.maritalStatus || null),
            children: this.user.socialInfo?.children ?? null,
            userId: this.user?._id || null
          };

          // Merge infoItems into allinfo
          this.allinfo = { ...this.allinfo, ...this.infoItems };

          // Trigger change detection
          this.cdr.detectChanges();
        } else {
          console.warn('User data is empty');
        }
      },
      (error) => {
        console.error('Error fetching user:', error);
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

  ngOnDestroy(): void {
    // Unsubscribe from the subscriptions to avoid memory leaks
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }

    if (this.searchUserSubscription) {
      this.searchUserSubscription.unsubscribe();
    }
  }

  toggleView(showProfile: boolean): void {
    this.isProfileVisible = showProfile;
    this.isPersonelInfoVisible = !showProfile;
    this.isRequestVisible = false;
    this.isChatVisible = false;
    this.isDocumentVisible = false;
    this.isFormationVisible = false;
    this.isCongeVisible = false;
    this.isPretAvanceVisible = false;

  }

  showRequest(): void {
    this.isProfileVisible = false;
    this.isPersonelInfoVisible = false;
    this.isRequestVisible = true;
    this.isChatVisible = false;
    this.isDocumentVisible = false;
    this.isFormationVisible = false;
    this.isCongeVisible = false;
    this.isPretAvanceVisible = false;

  }
  showChat(): void {
    this.isProfileVisible = false;
    this.isPersonelInfoVisible = false;
    this.isRequestVisible = false
    this.isChatVisible = true;
    this.isDocumentVisible = false;
    this.isFormationVisible = false;
    this.isCongeVisible = false;
    this.isPretAvanceVisible = false;
  }
  showDocument(): void {
    this.isProfileVisible = false;
    this.isPersonelInfoVisible = false;
    this.isRequestVisible = false
    this.isChatVisible = false;
    this.isDocumentVisible = true;
    this.isFormationVisible = false;
    this.isCongeVisible = false;
    this.isPretAvanceVisible = false;
  }
  showFormation(): void {
    this.isProfileVisible = false;
    this.isPersonelInfoVisible = false;
    this.isRequestVisible = false;
    this.isChatVisible = false;
    this.isDocumentVisible = false;
    this.isFormationVisible = true;
    this.isCongeVisible = false;
    this.isPretAvanceVisible = false;
  }
  showConge(): void {
    this.isProfileVisible = false;
    this.isPersonelInfoVisible = false;
    this.isRequestVisible = false
    this.isChatVisible = false;
    this.isDocumentVisible = false;
    this.isFormationVisible = false;
    this.isCongeVisible = true;
    this.isPretAvanceVisible = false;
  }
  showPretAvance(): void {
    this.isProfileVisible = false;
    this.isPersonelInfoVisible = false;
    this.isRequestVisible = false
    this.isChatVisible = false;
    this.isDocumentVisible = false;
    this.isFormationVisible = false;
    this.isCongeVisible = false;
    this.isPretAvanceVisible = true;
  }

  toggleMenu(): void {
    this.isMenuDisplayed = !this.isMenuDisplayed;

  }

  hidealert(): void {
    this.str = '';
    if (history !== undefined) {
      history.state.welcomeMessage = null;
    }
  }

  
}
