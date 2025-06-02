import { Component, Input, SimpleChanges, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';  // Import the camera icon
import { EmployeServiceService } from '../../service/employe-service.service';
import { CommonModule } from '@angular/common';
import { minimumAgeValidator } from '../../custom.validators' // Adjust the path
import { PhoneInputComponent } from '../phone.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import SignaturePad from 'signature_pad';
import { Subscription } from 'rxjs';

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
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit, AfterViewInit {
  @ViewChild('signaturePad') signaturePadElement!: ElementRef;
  signaturePad: any;
  @ Input() allinfo: any;
  readonly apiUrl = environment.apiUrl;
  readonly baseUrl = environment.baseUrl || environment.apiUrl;  
  readonly defaultAvatar = 'assets/images/icon/man.png';
  private financialFields = ['taxId', 'CNSS', 'transportAllowance', 'paymentMethod', 'RIB'];
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

  departments = Object.keys(POSITIONS_BY_DEPARTMENT);
  positions: string[] = [];
  userForm!: FormGroup;  // Reactive form group
  str: string = '';  // Message for alert
  preventSubmit = false;  // Prevent form submission if hidealert is triggered
  message: string = '';
  messageType: 'success' | 'error' = 'success';
  showMessage: boolean = false;
  showCinField: boolean = false;
  
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
    private http: HttpClient
  ) {}

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
    console.log('Initial allinfo:', this.allinfo);
    this.initializeForm();
    this.initializeImage();
    
    console.log('Form initial values:', this.userForm.getRawValue());
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
      email: [this.allinfo.email ?? '', [Validators.required, Validators.email]],
      cin: [{ value: this.allinfo?.cin ?? '', disabled: !this.showCinField }, [
        Validators.required,
        Validators.pattern('^[0-9]{8}$')
      ]],
      firstName: [this.allinfo.firstName ?? '', [Validators.required]],
      lastName: [this.allinfo.lastName ?? '', [Validators.required]],
      countryCode: [this.allinfo.personalInfo?.countryCode || 'TN', [Validators.required]],
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
      signature:[this.allinfo.signature ?? null ],
      position: [{ 
        value: this.allinfo.professionalInfo?.position ?? '', 
        disabled: !this.allinfo.professionalInfo?.department
      }, [Validators.required]],
      hiringDate: [{ 
        value: this.convertToDateInputFormat(this.allinfo.professionalInfo?.hiringDate) ?? null,
        disabled: true 
      }],
      salary: [{ 
        value: this.allinfo.professionalInfo?.salary ?? 
               this.allinfo.financialInfo?.salary ?? '', 
        disabled: true 
      }],
      maritalStatus: [this.allinfo.socialInfo?.maritalStatus ?? '', [Validators.required]],
      children: [this.allinfo.socialInfo?.children ?? '', [Validators.min(0)]],
      taxId: [{ 
        value: this.allinfo.financialInfo?.taxId ?? '', 
        disabled: true 
      }],
      CNSS: [{ 
        value: this.allinfo.financialInfo?.CNSS ?? '', 
        disabled: true 
      }],
      transportAllowance: [{ 
        value: this.allinfo.financialInfo?.transportAllowance ?? 0, 
        disabled: true 
      }],
      paymentMethod: [{ 
        value: this.allinfo.financialInfo?.paymentMethod ?? '', 
        disabled: true 
      }],
      contractType: [{ 
        value: this.allinfo.financialInfo?.contractType ?? '', 
        disabled: true 
      }],
      RIB: [{ 
        value: this.allinfo.financialInfo?.RIB ?? '', 
        disabled: true 
      }],
      
      contractEndDate: [{ 
        value: this.convertToDateInputFormat(this.allinfo.financialInfo?.contractEndDate) ?? null, 
        disabled: true 
      }],
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
        endDateControl?.disable();
        endDateControl?.clearValidators();
        endDateControl?.setValue(null);
      }
      endDateControl?.updateValueAndValidity();
      
      // Handle other financial fields
      this.financialFields.forEach(field => {
        const control = this.userForm.get(field);
        if (type === 'Stage') {
          control?.disable();
          control?.setValue(null); // Clear existing values
        } else {
          control?.enable();
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

    console.log("first", this.allinfo);
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

  clear() {
  if (this.signaturePad) {
    this.signaturePad.clear();
  }
}

save() {
  if (!this.signaturePad || this.signaturePad.isEmpty()) {
    alert('Veuillez fournir une signature d\'abord');
    return;
  }
  
  // Get signature image in base64 format
  const signatureData = this.signaturePad.toDataURL('image/png');
  console.log('Signature data:', signatureData);
  
  // Show loading indicator
  this.isLoading = true;
  
  this.share.sendsignature(signatureData).subscribe({
    next: (response: any) => {
      // Update the local data with the response
      this.allinfo = response; 
      // Or just update the signature part
      // this.allinfo.signature = signatureData;
      
      this.isLoading = false;
      this.showMessage = true;
      this.messageType = 'success';
      this.message = 'Signature enregistrée avec succès';
    },
    error: (error: any) => {
      this.isLoading = false;
      this.showMessage = true;
      this.messageType = 'error';
      this.message = 'Erreur lors de l\'enregistrement de la signature';
      console.error('Error saving signature:', error);
    }
  });
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
}
