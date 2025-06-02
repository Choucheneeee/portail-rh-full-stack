import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { EmployeServiceService } from '../../service/employe-service.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CloudCog } from 'lucide-angular';

@Component({
  selector: 'app-personel-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './personel-info.component.html',
  styleUrls: ['./personel-info.component.css']
})
export class PersonelInfoComponent implements OnChanges {
  readonly apiUrl = environment.apiUrl;
  readonly baseUrl = environment.baseUrl || environment.apiUrl;
  @Input() userData: any;
  profileCompletion: number = 0;
  user: any = this.createEmptyUser();
  imageUrl!: string;
  selectedFile: File | null = null;
  readonly defaultAvatar = 'assets/images/icon/man.png';
  showProfileWarning: boolean = false;
  warningMessage: string = '';

  constructor(
    private share: EmployeServiceService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.initializeImage();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userData'] && this.userData) {
      this.user = this.parseUserData(this.userData);
      this.calculateProfileCompletion();
      this.initializeImage();
      this.checkProfileCompletion();
    }
  }

  private checkProfileCompletion(): void {
    if (this.profileCompletion < 100) {
      this.showProfileWarning = true;
      this.warningMessage = this.getWarningMessage();
    } else {
      this.showProfileWarning = false;
    }
  }

  private getWarningMessage(): string {
    const missingFields = this.getMissingFields();
    if (missingFields.length > 0) {
      return `Veuillez compléter votre profil en ajoutant les informations suivantes : ${missingFields.join(', ')}. 
      Un profil incomplet peut causer des problèmes lors de l'utilisation de certaines fonctionnalités.`;
    }
    return '';
  }

  private getMissingFields(): string[] {
    const missingFields: string[] = [];
    const isStageContract = this.user.financialInfo?.contractType === 'Stage';
    const isSingle = this.user.socialInfo?.maritalStatus === 'single';
    
    if (!this.user.firstName || !this.user.lastName) {
      missingFields.push('Nom et Prénom');
    }
    if (!this.user.personalInfo?.phone) {
      missingFields.push('Numéro de téléphone');
    }
    if (!this.user.personalInfo?.address) {
      missingFields.push('Adresse');
    }
    if (!this.user.personalInfo?.birthDate) {
      missingFields.push('Date de naissance');
    }
    if (!this.user.professionalInfo?.position) {
      missingFields.push('Poste');
    }
    if (!this.user.professionalInfo?.department) {
      missingFields.push('Département');
    }
      console.log("contacttype",isStageContract)
    console.log("contr", this.user.financialInfo?.contractType)
    if (!isStageContract) {
      if (!this.user?.financialInfo?.RIB) {
        missingFields.push(' RIB  bancaire');
      }
      if (!this.user.financialInfo?.taxId) {  
        missingFields.push('Numéro fiscal');
      }
    }

    return missingFields;
  }

  closeWarning(): void {
    this.showProfileWarning = false;
  }

  // Add these image handling methods
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.previewImage(file);
    }
  }

  private previewImage(file: File): void {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.imageUrl = reader.result as string;
    };
  }

  uploadImage(): void {
    if (!this.selectedFile || !this.userData?._id) return;

    const formData = new FormData();
    formData.append('profileImage', this.selectedFile);

    this.http.put(`/api/users/${this.userData._id}/profile-image`, formData)
      .subscribe({
        next: (res: any) => {
          this.imageUrl = `${this.baseUrl}${res.profileImage}?t=${Date.now()}`;
          this.selectedFile = null;
          // Update user data with new image
          if (this.userData) {
            this.userData.profileImage = res.profileImage;
          }
        },
        error: (err) => console.error('Image upload failed:', err)
      });
  }

  private initializeImage(): void {
    if (this.userData?.profileImage) {
      this.imageUrl = this.userData.profileImage ? `${this.baseUrl}${this.userData.profileImage}?t=${Date.now()}` : this.defaultAvatar;
    }
  }

  // Rest of your existing methods
  private createEmptyUser(): any {
    return {
      _id: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      isVerified: false,
      isApproved: false,
      role: '',
      personalInfo: {},
      financialInfo: {},
      professionalInfo: {},
      socialInfo: {},
      timeOffBalance: 28,
      createdAt: new Date()
    };
  }

  private parseUserData(data: any): any {
    return {
      ...data,
      personalInfo: {
        ...data.personalInfo,
        birthDate: data.personalInfo?.birthDate ? new Date(data.personalInfo.birthDate) : undefined
      },
      professionalInfo: {
        ...data.professionalInfo,
        hiringDate: data.professionalInfo?.hiringDate ? new Date(data.professionalInfo.hiringDate) : undefined,
        jobDescription: data.professionalInfo?.jobDescription ? {
          ...data.professionalInfo.jobDescription,
          effectiveDate: new Date(data.professionalInfo.jobDescription.effectiveDate)
        } : undefined
      },
      createdAt: new Date(data.createdAt),
      resetTokenExpiration: data.resetTokenExpiration ? new Date(data.resetTokenExpiration) : undefined
    };
  }

  private calculateProfileCompletion(): void {
    // Déterminer si le type de contrat est Stage
    const isStageContract = this.user.professionalInfo?.contractType === 'Stage';
    // Déterminer si le statut matrimonial est Célibataire (single)
    const isSingle = this.user.socialInfo?.maritalStatus === 'single';
    
    // Liste des champs requis de base (seulement ceux qui sont vraiment nécessaires)
    let requiredFields = [
      this.user.firstName,
      this.user.lastName,
      this.user.cin,
      this.user.email,
      this.user.personalInfo?.phone,
      this.user.personalInfo?.address,
      this.user.personalInfo?.birthDate,
      this.user.professionalInfo?.position,
      this.user.professionalInfo?.department
    ];
  
    // Le mot de passe n'est pas nécessaire pour la complétion du profil si l'utilisateur est déjà connecté
    // Donc nous ne l'incluons pas dans les champs requis
    
    // Pour les contrats de type Stage, ajouter uniquement la date de fin de contrat si elle existe
    if (isStageContract && this.user.financialInfo?.contractEndDate !== undefined) {
      requiredFields.push(this.user.financialInfo.contractEndDate);
    }
    
    // Pour les contrats autres que Stage, ajouter les champs financiers s'ils existent
    if (!isStageContract && this.user.financialInfo) {
      if (this.user.financialInfo.bankAccount) {
        requiredFields.push(this.user.financialInfo.bankAccount);
      }
      if (this.user.financialInfo.taxId) {
        requiredFields.push(this.user.financialInfo.taxId);
      }
    }
    
    // Ajouter le champ children seulement si le statut n'est pas célibataire et si le champ existe
    if (!isSingle && this.user.socialInfo?.children) {
      requiredFields.push(this.user.socialInfo.children);
    }
        
    // Filtrer les champs non définis ou vides
    const validFields = requiredFields.filter(field => 
      field !== undefined && field !== null && field !== ''
    );
    
    // Filtrer les champs requis pour n'inclure que ceux qui sont définis
    const definedRequiredFields = requiredFields.filter(field => 
      field !== undefined && field !== null
    );
    
    // Calculer le pourcentage de complétion
    const completedFields = validFields.length;
    const totalRequiredFields = definedRequiredFields.length;
    
    console.log("champs complétés", completedFields);
    console.log("champs requis", totalRequiredFields);
    console.log("liste des champs requis", definedRequiredFields);
    
    // Si tous les champs définis sont remplis, le profil est complet à 100%
    if (completedFields >= totalRequiredFields) {
      this.profileCompletion = 100;
    } else {
      this.profileCompletion = totalRequiredFields > 0 ? 
        Math.round((completedFields / totalRequiredFields) * 100) : 100;
    }
  }

  getSafeDate(date: Date | undefined): Date | null {
    return date ? new Date(date) : null;
  }
}