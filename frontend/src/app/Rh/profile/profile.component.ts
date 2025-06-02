import { Component, Input, SimpleChanges, OnInit, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';  // Import the camera icon
import { EmployeServiceService } from '../../service/employe-service.service';
import { CommonModule, DatePipe } from '@angular/common';
import { minimumAgeValidator } from '../../custom.validators' // Adjust the path
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import SignaturePad from 'signature_pad';
import { Subscription } from 'rxjs';
import { PhoneInputComponent } from '../../user/phone.component';

const POSITIONS_BY_DEPARTMENT = {
  'HR': ['Recruiter', 'HR Manager', 'Training Specialist'],
  'IT': ['Developer', 'System Admin', 'Network Engineer'],
  'Finance': ['Accountant', 'Financial Analyst', 'Auditor'],
  'Sales': ['Sales Manager', 'Account Executive', 'Sales Representative']
};
type Department = keyof typeof POSITIONS_BY_DEPARTMENT;

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [LucideAngularModule, CommonModule, ReactiveFormsModule,PhoneInputComponent],
  templateUrl: './profile.component.html',
  providers: [DatePipe],
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit, AfterViewInit {
  @ViewChild('signaturePad') signaturePadElement!: ElementRef;
  signaturePad: any;
  readonly apiUrl = environment.apiUrl;
  readonly baseUrl = environment.baseUrl || environment.apiUrl;  
  readonly defaultAvatar = 'assets/images/icon/man.png';
  private financialFields = ['bankAccount', 'taxId', 'CNSS', 'transportAllowance', 'paymentMethod', 'RIB'];
  imageUrl!: string;
  selectedFile: File | null = null;
  isLoading = false;  // Loader state
  isSubmitting = false;
  private observablesignature=Subscription
  isPersonalInfoVisible = true;
  isProfessionalInfoVisible = false;
  isSocialInfoVisible = false;
  public isFinancialInfoVisible = false;
  isSignatureVisible = false;
  showRawData : boolean = false;
  signatureType: 'signature' | 'stamp' = 'signature';
  stampFile: File | null = null;
  stampPreview: string | null = null;
  departments = Object.keys(POSITIONS_BY_DEPARTMENT);
  positions: string[] = [];                       
  allinfo: any = {};  // Default empty object to prevent errors
  userForm!: FormGroup;  // Reactive form group
  str: string = '';  // Message for alert
  preventSubmit = false;  // Prevent form submission if hidealert is triggered
  message: string = '';
  messageType: 'success' | 'error' = 'success';
  showMessage: boolean = false;
  showCinField: boolean = false;
  private searchUserSubscription!: Subscription;

  hidealert() {
    this.str = '';  // Hide the alert message
    if (history != undefined) {
      history.state.welcomeMessage = null;
    }
    this.preventSubmit = true;  // Prevent form submission if hidealert was called
  }

  constructor(
    private fb: FormBuilder,
    private share: EmployeServiceService,
    private router: Router,
    private http: HttpClient,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef


  ) {}
  onSignatureTypeChange(type: 'signature' | 'stamp'): void {
    this.signatureType = type;
    if (type === 'signature') {
      setTimeout(() => this.initializeSignaturePad(), 0);
    }
  }
  onStampSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.stampFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.stampPreview = reader.result as string;
        this.userForm.patchValue({ signature: this.stampPreview });
      };
      reader.readAsDataURL(file);
    }
  }
  clearStamp(): void {
    this.stampFile = null;
    this.stampPreview = null;
    this.userForm.patchValue({ signature: null });
  }
  
  isTabActive(tab: string): boolean {
    switch(tab) {
      case 'personnel': return this.isPersonalInfoVisible;
      case 'professionnel': return this.isProfessionalInfoVisible;
      case 'social': return this.isSocialInfoVisible;
      case 'financier': return this.isFinancialInfoVisible;
      case 'signature': return this.isSignatureVisible;
      default: return false;
    }
  }

  ngOnInit(): void {
    console.log("cor")
    this.searchUserSubscription = this.share.searchUserByToken().subscribe(
      (data) => {
        if (data) {
          this.allinfo = data;
          this.initializeForm(); // Déplacer l'initialisation du formulaire ici
          this.initializeImage();
          this.cdr.detectChanges();
          console.log("all info", this.allinfo);
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
    // Ne pas initialiser le formulaire ici
    // this.initializeForm();
    // this.initializeImage();
    
    // Log form values after initialization (déplacer ceci dans le callback)
    // console.log('Form initial values:', this.userForm.getRawValue());
  }

  ngAfterViewInit(): void {
    // Add window resize event listener
    window.addEventListener('resize', () => {
      if (this.isSignatureVisible) {
        this.initializeSignaturePad();
      }
    });
    
    // Initial initialization
    setTimeout(() => {
      if (this.isSignatureVisible) {
        this.initializeSignaturePad();
      }
    }, 300);
  }

  private initializeSignaturePad(): void {
    if (this.isSignatureVisible && this.signaturePadElement) {
      const canvas = this.signaturePadElement.nativeElement;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      
      // Get the canvas container width
      const container = canvas.parentElement;
      const width = container.clientWidth - 2; // Subtract border width
      const height = canvas.offsetHeight;
      
      // Set canvas display size
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      // Scale canvas context
      const context = canvas.getContext('2d');
      context.scale(ratio, ratio);
      
      // Initialize signature pad with proper size
      if (this.signaturePad) {
        this.signaturePad.clear(); // Clear existing pad
      }
      
      this.signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
        velocityFilterWeight: 0.7,
        minWidth: 0.5,
        maxWidth: 2.5,
        throttle: 16 // Increase responsiveness
      });
      
      // Load existing signature if available
      this.loadExistingSignature();
    }
  }

  private loadExistingSignature(): void {
    // Check if user has a saved signature
    if (this.allinfo.signature) {
      // Create an image object
      const image = new Image();
      
      // When the image loads, draw it on the canvas
      image.onload = () => {
        if (this.signaturePad) {
          // Clear the pad first
          this.signaturePad.clear();
          
          // Get canvas context and draw the image
          const canvas = this.signaturePadElement.nativeElement;
          const ctx = canvas.getContext('2d');
          
          // Calculate dimensions to maintain aspect ratio
          const ratio = Math.min(
            canvas.width / image.width,
            canvas.height / image.height
          );
          
          const centerX = (canvas.width - image.width * ratio) / 2;
          const centerY = (canvas.height - image.height * ratio) / 2;
          
          // Draw the image centered and scaled
          ctx.drawImage(
            image,
            0, 0, image.width, image.height,
            centerX, centerY, image.width * ratio, image.height * ratio
          );
          
          // Update signature pad's data
          this.signaturePad._isEmpty = false;
        }
      };
      
      // Set the source of the image to the base64 data
      image.src = this.allinfo.signature;
    }
  }

  private initializeImage(): void {
    if (this.allinfo.profileImage) {
      this.imageUrl = this.allinfo.profileImage ? `${this.baseUrl}${this.allinfo.profileImage}?t=${Date.now()}` : this.defaultAvatar;
    }
  }

  private updatePositions(department: string | null) {
    const positionControl = this.userForm.get('position');
    
    // Reset positions and disable control if no valid department
    if (!this.isValidDepartment(department)) {
      this.positions = [];
      positionControl?.disable();
      positionControl?.reset();
      return;
    }

    // We've confirmed department is valid via type guard
    const validDept = department as Department;
    this.positions = POSITIONS_BY_DEPARTMENT[validDept];
    
    // Only enable if there are positions available
    if (this.positions.length > 0) {
      positionControl?.enable();
      
      // Reset if current value is invalid for new department
      if (positionControl?.value && !this.positions.includes(positionControl.value)) {
        positionControl.reset();
      }
    } else {
      positionControl?.disable();
      positionControl?.reset();
    }
  }
    
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
    if (!this.selectedFile || !this.allinfo?._id) return;

    const formData = new FormData();
    formData.append('profileImage', this.selectedFile);

    this.http.put(`${this.apiUrl}/users/${this.allinfo._id}/profile-image`, formData)
      .subscribe({
        next: (res: any) => {
          this.imageUrl = `${this.baseUrl}${res.profileImage}?t=${Date.now()}`;
          this.allinfo.profileImage = res.profileImage;
          this.selectedFile = null;
        },
        error: (err) => {
          console.error('Image upload failed:', err);
          this.selectedFile = null;
          this.initializeImage();
        }
      });
  }

  // Add type guard method
  private isValidDepartment(dept: string | null): dept is Department {
    return !!dept && Object.keys(POSITIONS_BY_DEPARTMENT).includes(dept);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('allinfo' in changes) {
      // Handle changes if needed
    }
  }

  private convertToDateInputFormat(dateString: string): string | null {
    try {
      if (!dateString) return null;
  
      // Extract the date part before 'T' (e.g., "2003-05-23")
      const [datePart] = dateString.split('T');
      if (!datePart) return null;
  
      // Split into parts to validate structure
      const [year, month, day] = datePart.split('-');
      
      // Basic validation (ensure all parts exist and have correct lengths)
      if (!year || !month || !day || year.length !== 4 || month.length !== 2 || day.length !== 2) {
        return null;
      }
  
      // Return the correctly formatted date (already in YYYY-MM-DD)
      return datePart;
    } catch (error) {
      console.error('Error converting date:', error);
      return null;
    }
  }

  onSubmit(): void {
   
  
    this.isLoading = true;
    this.isSubmitting = true;
  
    const formData = new FormData();
    const formValues = this.userForm.getRawValue();
  
    // Keep the existing hiring date if no new value is provided
    const hiringDate = formValues.hiringDate || 
                      this.convertToDateInputFormat(this.allinfo.professionalInfo?.hiringDate) || 
                      null;
  
    if (hiringDate) {
      formData.append('professionalInfo.hiringDate', new Date(hiringDate).toISOString());
    } else {
      // If somehow both current and existing values are null, keep the original value
      formData.append('professionalInfo.hiringDate', 
        this.allinfo.professionalInfo?.hiringDate || new Date().toISOString());
    }
  
    // Rest of your field mappings
    const fieldMappings = {
      // Personal info
      'phone': 'personalInfo.phone',
      'countryCode': 'personalInfo.countryCode',
      'address': 'personalInfo.address',
      'birthDate': 'personalInfo.birthDate',
      
      // Professional info
      'department': 'professionalInfo.department',
      'position': 'professionalInfo.position',
      'responsibilities': 'professionalInfo.jobDescription.responsibilities',
      'qualifications': 'professionalInfo.jobDescription.qualifications',
      'salary': 'professionalInfo.salary',
      // Financial info
      'taxId': 'financialInfo.taxId',
      'CNSS': 'financialInfo.CNSS',
      'transportAllowance': 'financialInfo.transportAllowance',
      'paymentMethod': 'financialInfo.paymentMethod',
      'RIB': 'financialInfo.RIB',
      'contractType': 'financialInfo.contractType',
      'contractEndDate': 'financialInfo.contractEndDate',

      
      // Social info
      'maritalStatus': 'socialInfo.maritalStatus',
      'children': 'socialInfo.children',
      
      // Direct fields
      'email': 'email',
      'cin': 'cin',
      'firstName': 'firstName',
      'lastName': 'lastName',
      'signature':'signature'
    };
  
    // Continue with the rest of your form submission logic
    Object.entries(formValues).forEach(([key, value]) => {
      if (value !== null && value !== undefined && 
          fieldMappings[key as keyof typeof fieldMappings] && 
          key !== 'hiringDate') { // Skip hiringDate as we handled it above
        formData.append(fieldMappings[key as keyof typeof fieldMappings], String(value));
      }
    });
  
    if (this.selectedFile) {
      formData.append('profileImage', this.selectedFile);
    }
  
    // Log the form data to verify content
    formData.forEach((value, key) => {
      console.log(`${key}: ${value}`);
    });

    console.log('Form data:', formData);
  
    this.share.updateEmployee(this.allinfo._id, formData).subscribe({
      next: (response: any) => {
        this.allinfo = response; // Update the local data with the response
        this.isLoading = false;
        this.isSubmitting = false;
        this.showMessage = true;
        this.messageType = 'success';
        this.message = 'Profile updated successfully';
        this.initializeImage();
      },
      error: (error) => {
        this.isLoading = false;
        this.isSubmitting = false;
        this.showMessage = true;
        this.messageType = 'error';
        this.message = 'Error updating profile';
        console.error('Error updating profile:', error);
      }
    });
  }
  
  toggleView(section: string) {
    // Don't show loading spinner for section changes
    this.isPersonalInfoVisible = section === 'personnel';
    this.isProfessionalInfoVisible = section === 'professionnel';
    this.isSocialInfoVisible = section === 'social';
    this.isFinancialInfoVisible = section === 'financier';
    this.isSignatureVisible = section === 'signature';
    
    // Initialize SignaturePad when switching to signature tab
    if (section === 'signature') {
      setTimeout(() => {
        this.initializeSignaturePad();
      }, 300); // Increased timeout to ensure DOM is ready
    }
  }
  user: any;

  

  // Ensure submission happens only on explicit action (button click)
  onFormSubmit(event: Event) {
    event.preventDefault();  // Prevent default form submission behavior
    this.onSubmit();  // Call the onSubmit method only after validation and checking
  }

  // Add helper method for phone length validation
  private getMinLength(countryCode: string): number {
    const lengths: { [key: string]: number } = {
      'TN': 8,  // Tunisia
      'FR': 9,  // France
      'US': 10, // United States
      // Add more countries as needed
    };
    return lengths[countryCode] || 8; // Default to 8 if country not found
  }

  // Update form initialization to include phone validators
  private initializeForm(): void {
    this.userForm = this.fb.group({
      email: [this.allinfo.email ?? '', [ Validators.email]],
      cin: [{ value: this.allinfo?.cin ?? '', disabled: !this.showCinField }, [
        
        Validators.pattern('^[0-9]{8}$')
      ]],
      firstName: [this.allinfo.firstName ?? '', [Validators.required]],
      lastName: [this.allinfo.lastName ?? '', [Validators.required]],
      countryCode: [this.allinfo.personalInfo?.countryCode || 'TN'],
      phone: [this.allinfo.personalInfo?.phone || '', [
        Validators.required,  
        Validators.pattern('^[0-9]+$'),
        Validators.minLength(8),
        Validators.maxLength(15)
      ]],
      responsibilities: [
        this.allinfo.professionalInfo?.jobDescription?.responsibilities ?? 
        this.allinfo.professionalInfo?.responsibilities ?? '', 
        [Validators.required]
      ],
      qualifications: [
        this.allinfo.professionalInfo?.jobDescription?.qualifications ?? 
        this.allinfo.professionalInfo?.qualifications ?? '', 
        [Validators.required]
      ],
      address: [this.allinfo.personalInfo?.address ?? '', [Validators.required]],
      birthDate: [
        this.convertToDateInputFormat(this.allinfo.personalInfo?.birthDate) ?? null,
        [Validators.required, minimumAgeValidator(18)]
      ],
      department: [this.allinfo.professionalInfo?.department ?? '', [Validators.required]],
      signature:[this.allinfo.signature ?? null ,[Validators.required]],
      position: [this.allinfo.professionalInfo?.position ?? '', [Validators.required]],
      hiringDate: [this.convertToDateInputFormat(this.allinfo.professionalInfo?.hiringDate) ?? null, [Validators.required]],
      salary: [this.allinfo.professionalInfo?.salary ?? this.allinfo.financialInfo?.salary ?? '', [Validators.required, Validators.min(0)]],
      maritalStatus: [this.allinfo.socialInfo?.maritalStatus ?? '', [Validators.required]],
      children: [this.allinfo.socialInfo?.children ?? ''],
      bankAccount: [this.allinfo.financialInfo?.bankAccount ?? ''],
      taxId: [this.allinfo.financialInfo?.taxId ?? ''],
      CNSS: [this.allinfo.financialInfo?.CNSS ?? '', ],
      transportAllowance: [this.allinfo.financialInfo?.transportAllowance ?? 0],
      paymentMethod: [this.allinfo.financialInfo?.paymentMethod ?? ''],
      contractType: [this.allinfo.financialInfo?.contractType ?? ''],
      RIB: [this.allinfo.financialInfo?.RIB ?? ''],
      contractEndDate: [this.convertToDateInputFormat(this.allinfo.financialInfo?.contractEndDate) ?? null],
    });
    this.updatePositions(this.allinfo.professionalInfo?.department);
    this.userForm.get('department')?.valueChanges.subscribe((value) => {
      this.updatePositions(value);
    });
  
    // Add listener for contract type changes
    this.userForm.get('contractType')?.valueChanges.subscribe(type => {
      const endDateControl = this.userForm.get('contractEndDate');
      if (type === 'CDD' || type === 'Stage') {
        endDateControl?.enable();
        endDateControl?.setValidators([
          Validators.required,
          // Add validator to ensure end date is after hiring date
          (control) => {
            const hiringDate = this.userForm.get('hiringDate')?.value;
            const endDate = control.value;
            if (!hiringDate || !endDate) return null;
            return new Date(endDate) <= new Date(hiringDate) ? 
              { 'endDateBeforeHiring': true } : null;
          }
        ]);
      } else {
        endDateControl?.clearValidators();
        endDateControl?.setValue(null);
      }
      endDateControl?.updateValueAndValidity();
      
      // Handle other financial fields
      this.financialFields.forEach(field => {
        const control = this.userForm.get(field);
        if (type === 'Stage') {
          control?.setValue(null); // Clear existing values
        }
      });
    });
  
    // If CIN is already set, enable the field
    if (!this.allinfo?.cin) {
      this.showCinField = true;
      const cinControl = this.userForm.get('cin');
      if (cinControl) {
        cinControl.enable();
      }
    }
  
    console.log("Form initialized with data:", this.userForm.getRawValue());
  }

  formatRIB() {
    let ribControl = this.userForm.get('RIB');
    let value = ribControl?.value?.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Auto-add TN prefix if missing
    if (value && !value.startsWith('TN')) {
      value = 'TN' + value.replace(/^TN/, '');
    }
    
    // Limit to 24 characters (TN + 22 digits)
    if (value.length > 24) {
      value = value.slice(0, 24);
    }
    
    ribControl?.setValue(value, { emitEvent: false });
  }

  ngOnDestroy(): void {
    this.userForm.reset();
    this.isLoading = false;
    this.isSubmitting = false;
    this.str = '';
    this.preventSubmit = false;
  }

  // Add method to close message
  closeMessage(): void {
    this.showMessage = false;
  }

  // Add this method to your component class
  clearSignature(): void {
    if (this.signaturePad) {
      this.signaturePad.clear();
      // Also clear the signature value in the form
      this.userForm.patchValue({ signature: null });
    }
  }


save(): void {
  let signatureData: string | null = null;
  
  if (this.signatureType === 'signature' && this.signaturePad) {
    if (this.signaturePad.isEmpty()) {
      this.message = 'Veuillez signer avant d\'enregistrer';
      this.messageType = 'error';
      this.showMessage = true;
      return;
    }
    signatureData = this.signaturePad.toDataURL('image/png');
  } else if (this.signatureType === 'stamp' && this.stampPreview) {
    signatureData = this.stampPreview;
  }

  if (!signatureData) {
    this.message = 'Aucune signature ou cachet à enregistrer';
    this.messageType = 'error';
    this.showMessage = true;
    return;
  }

  this.isLoading = true;
  
  // Update the form value
  this.userForm.patchValue({ signature: signatureData });
  
  this.share.sendsignature(signatureData).subscribe({
    next: (response: any) => {
      // Update the local data with the response
      this.allinfo = response; 
      
      this.isLoading = false;
      this.showMessage = true;
      this.messageType = 'success';
      this.message = this.signatureType === 'signature' ? 
        'Signature enregistrée avec succès' : 
        'Cachet enregistré avec succès';
    },
    error: (error: any) => {
      this.isLoading = false;
      this.showMessage = true;
      this.messageType = 'error';
      this.message = this.signatureType === 'signature' ? 
        'Erreur lors de l\'enregistrement de la signature' : 
        'Erreur lors de l\'enregistrement du cachet';
      console.error('Error saving signature/stamp:', error);
    }
  });
}
clear(){
  this.signaturePad?.clear();
  this.userForm.patchValue({ signature: null });
  
}

toggleCinField(): void {
  this.showCinField = !this.showCinField;
  const cinControl = this.userForm.get('cin');
  if (cinControl) {
    if (this.showCinField) {
      cinControl.enable();
    } else {
      // Store the current value before disabling
      const currentValue = cinControl.value;
      cinControl.disable();
      // Restore the value after disabling
      cinControl.setValue(currentValue);
    }
  }
}
toggleRawData() {
  this.showRawData = !this.showRawData;
}
}


