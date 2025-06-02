import { Component, Input, SimpleChanges, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';  // Import the camera icon
import { EmployeServiceService } from '../../service/employe-service.service';
import { CommonModule } from '@angular/common';
import { minimumAgeValidator } from '../../custom.validators' // Adjust the path
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PhoneInputComponent } from '../../user/phone.component';
import { ServiceRHService } from '../service-rh.service';
import { ActivatedRoute } from '@angular/router';  // Add this line

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
  templateUrl: './profile-user.component.html',
  styleUrls: ['./profile-user.component.css'],
})
export class ProfileUserComponent implements OnInit {
  readonly apiUrl = environment.apiUrl;
  readonly baseUrl = environment.baseUrl || environment.apiUrl;  
  readonly defaultAvatar = 'assets/images/icon/man.png';
  private financialFields = ['taxId', 'CNSS', 'paymentMethod', 'RIB', 'transportAllowance'];

  imageUrl!: string;
  selectedFile: File | null = null;
  isLoading = false;  // Loader state
  isSubmitting = false;

  isPersonalInfoVisible = true;
  isProfessionalInfoVisible = false;
  isSocialInfoVisible = false;
  public isFinancialInfoVisible = false;

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
  
  hidealert() {
    this.str = '';  // Hide the alert message
    if (history != undefined) {
      history.state.welcomeMessage = null;
    }
    this.preventSubmit = true;  // Prevent form submission if hidealert was called
  }

  constructor(
    private fb: FormBuilder,
    private share: ServiceRHService,
    private router: Router,
    private http: HttpClient,
    private route: ActivatedRoute  // Add this line
  ) {}
  // Add to profile.component.ts
isTabActive(tab: string): boolean {
  switch(tab) {
    case 'personnel': return this.isPersonalInfoVisible;
    case 'professionnel': return this.isProfessionalInfoVisible;
    case 'social': return this.isSocialInfoVisible;
    case 'financier': return this.isFinancialInfoVisible;
    default: return false;
  }
}

// Modify ngOnInit method
async ngOnInit(): Promise<void> {
  // Initialize empty form first
  this.initializeEmptyForm();
  
  const id = this.route.snapshot.paramMap.get('id') || 
             this.route.snapshot.url[this.route.snapshot.url.length - 1].path;
             
  if (id) {
    try {
      this.isLoading = true;
      await this.share.getUserById(id).toPromise().then((data: any) => {
        this.allinfo = data;
        console.log("Received user data:", this.allinfo);
        this.updateFormWithNewData();
        this.initializeImage();
      }).catch((err) => {
        console.error('Error fetching user data:', err);
        if(err.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('loggedInUserId');
          localStorage.removeItem('role');
          this.router.navigate(['/login'], { 
            state: { welcomeMessage: 'Vous avez été déconnecté avec succès.' } 
          });
        }
      }).finally(() => {
        this.isLoading = false;
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      this.isLoading = false;
    }
  }

  this.userForm.get('contractType')?.valueChanges.subscribe(type => {
  const endDateControl = this.userForm.get('contractEndDate');
  
  // Handle Contract End Date
  if (type === 'CDD' || type === 'Stage') {
    endDateControl?.enable();
    endDateControl?.setValidators([Validators.required]);
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
}

// Add new method to update form with data
private updateFormWithNewData(): void {
  if (!this.userForm || !this.allinfo) return;

  const formData = {
    // Read-only fields with current values
    email: this.allinfo.email || '' ,
    cin: this.allinfo.cin || '',
    firstName: this.allinfo.firstName || '',
    lastName: this.allinfo.lastName || '',
    phone: this.allinfo.personalInfo?.phone || '',
    countryCode: this.allinfo.personalInfo?.countryCode || 'TN' ,
    address: this.allinfo.personalInfo?.address || '',
    birthDate: this.convertToDateInputFormat(this.allinfo.personalInfo?.birthDate),
    department: this.allinfo.professionalInfo?.department || '',
    position: this.allinfo.professionalInfo?.position || '',
    jobResponsibilities: this.allinfo.professionalInfo?.jobDescription?.responsibilities?.[0] || '',
    jobQualifications: this.allinfo.professionalInfo?.jobDescription?.qualifications?.[0] || '',
    maritalStatus: this.allinfo.socialInfo?.maritalStatus || '',
    children: this.allinfo.socialInfo?.children || '',

    // Editable fields
    hiringDate: this.convertToDateInputFormat(this.allinfo.professionalInfo?.hiringDate),
    salary: this.allinfo.professionalInfo?.salary || '',
    taxId: this.allinfo.financialInfo?.taxId || '',
    CNSS: this.allinfo.financialInfo?.CNSS || '',
    transportAllowance: this.allinfo.financialInfo?.transportAllowance || 0,
    paymentMethod: this.allinfo.financialInfo?.paymentMethod || '',
    contractType: this.allinfo.financialInfo?.contractType || '',
    RIB: this.allinfo.financialInfo?.RIB || '',
    contractEndDate: this.convertToDateInputFormat(this.allinfo.financialInfo?.contractEndDate)
  };

  // Update form values while preserving disabled states
  Object.keys(formData).forEach(key => {
    const control = this.userForm.get(key);
    if (control) {
      const value = formData[key as keyof typeof formData];
      control.patchValue(value);
    }
  });

  // Update dependent fields
  if (this.allinfo.professionalInfo?.department) {
    this.updatePositions(this.allinfo.professionalInfo.department);
  }

  // Handle contract type specific logic
  if (this.allinfo.financialInfo?.contractType === 'CDD' || this.allinfo.financialInfo?.contractType === 'Stage') {
    const endDateControl = this.userForm.get('contractEndDate');
    if (endDateControl) {
      endDateControl.setValidators([Validators.required]);
      endDateControl.updateValueAndValidity();
    }
  }

  // Mark form as pristine and untouched
  this.userForm.markAsPristine();
  this.userForm.markAsUntouched();
}

  private initializeImage(): void {
      console.log("Image URL:", this.imageUrl);
    this.imageUrl = this.defaultAvatar;  // Default image

    if (this.allinfo.profileImage) {
      this.imageUrl = this.allinfo.profileImage ? `${this.baseUrl}${this.allinfo.profileImage}?t=${Date.now()}` : this.defaultAvatar;
    }
  }
// Removed duplicate implementation of initializeForm

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
        console.log("Image URL:", this.imageUrl);
        this.allinfo.profileImage = res.profileImage;
        this.selectedFile = null;
      },
      error: (err) => {
        console.error('Image upload failed:', err);
        this.selectedFile = null;
        this.initializeImage();
         console.log("Image URL:", this.imageUrl);

      }
    });
}


  // Add type guard method
  private isValidDepartment(dept: string | null): dept is Department {
    return !!dept && Object.keys(POSITIONS_BY_DEPARTMENT).includes(dept);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('allinfo' in changes) {
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
  if (this.preventSubmit) {
    return;
  }

  this.checkFormValidity(); // Add this line for debugging

  if (!this.userForm.valid) {
    console.log('Form is invalid:', this.userForm.errors);
    return;
  }

  this.isLoading = true;
  this.isSubmitting = true;

  const formData = new FormData();
  const formValues = this.userForm.getRawValue();

  // Only include these editable fields
  const editableFields: { [key: string]: string } = {
    // Financial Info
    'taxId': 'financialInfo.taxId',
    'CNSS': 'financialInfo.CNSS',
    'transportAllowance': 'financialInfo.transportAllowance',
    'paymentMethod': 'financialInfo.paymentMethod',
    'contractType': 'financialInfo.contractType',
    'RIB': 'financialInfo.RIB',
    'contractEndDate': 'financialInfo.contractEndDate',
    
    // Professional Info
    'hiringDate': 'professionalInfo.hiringDate',
    'salary': 'professionalInfo.salary'
  };

  // Keep existing values for read-only fields
  formData.append('professionalInfo.department', this.allinfo.professionalInfo?.department || '');
  formData.append('professionalInfo.position', this.allinfo.professionalInfo?.position || '');
  formData.append('professionalInfo.jobDescription.responsibilities', 
    this.allinfo.professionalInfo?.jobDescription?.responsibilities?.join(',') || '');
  formData.append('professionalInfo.jobDescription.qualifications', 
    this.allinfo.professionalInfo?.jobDescription?.qualifications?.join(',') || '');

  // Add editable fields that have values
  Object.entries(formValues).forEach(([key, value]) => {
    if (value !== null && value !== undefined && editableFields[key]) {
      if (key === 'hiringDate' || key === 'contractEndDate') {
        if (value) {
          if (typeof value === 'string' || typeof value === 'number') {
            formData.append(editableFields[key], new Date(value).toISOString());
          } else {
            console.error(`Invalid value for date conversion: ${value}`);
          }
        }
      } else if (key === 'salary' || key === 'transportAllowance') {
        formData.append(editableFields[key], String(value));
      } else {
        formData.append(editableFields[key], String(value));
      }
    }
  });

  // Add profile image if selected
  if (this.selectedFile) {
    formData.append('profileImage', this.selectedFile);
  }

  // Log formData content for debugging
  formData.forEach((value, key) => {
    console.log(`${key}: ${value}`);
  });

  // Call the service method to update user
  this.share.updateUser(this.allinfo._id, formData).subscribe({
    next: (response: any) => {
      this.isLoading = false;
      this.isSubmitting = false;
      this.showMessage = true;
      this.messageType = 'success';
      this.message = 'Profile updated successfully';
      
      // Update local data
      this.allinfo = response;
      this.initializeForm();
      this.initializeImage();
    },
    error: (error) => {
      this.isLoading = false;
      this.isSubmitting = false;
      this.showMessage = true;
      this.messageType = 'error';
      this.message = 'Error updating profile: ' + (error.message || 'Unknown error');
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
}

  // Ensure submission happens only on explicit action (button click)
  onFormSubmit(event: Event) {
    event.preventDefault();  // Prevent default form submission behavior
    // this.onSubmit();  // Call the onSubmit method only after validation and checking
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

// Add new method for empty form initialization
private initializeEmptyForm(): void {
  this.userForm = this.fb.group({
    // Personal Info (read-only)
    email: [{ value: '', disabled: true }],
    cin: [{ value: '', disabled: true }],
    firstName: [{ value: '', disabled: true }],
    lastName: [{ value: '', disabled: true }],
    phone: [{ value: '', disabled: true }],
    countryCode: [{ value: 'TN', disabled: true }],
    address: [{ value: '', disabled: true }],
    birthDate: [{ value: null, disabled: true }],
    
    // Professional Info (read-only)
    department: [{ value: '', disabled: true }],
    position: [{ value: '', disabled: true }],
    jobResponsibilities: [{ value: '', disabled: true }],
    jobQualifications: [{ value: '', disabled: true }],
    
    // Social Info (read-only)
    maritalStatus: [{ value: '', disabled: true }],
    children: [{ value: '', disabled: true }],
    
    // Editable Financial Info
    hiringDate: ['', [Validators.required]],
    salary: [''],
    taxId: ['', [Validators.required]],
    CNSS: ['', [Validators.required]],
    transportAllowance: [0, [Validators.required, Validators.max(40)]],
    paymentMethod: ['', [Validators.required]],
    contractType: ['', [Validators.required]],
    RIB: ['', [
      Validators.required,
      Validators.pattern(/^TN[0-9]{22}$/)
    ]],
    contractEndDate: [null]
  });

  // Set up form subscriptions
  this.setupFormSubscriptions();
}

// Remove loadUserData method since we're handling it in ngOnInit

// Update initializeForm to handle possible undefined values
private initializeForm(): void {
  this.userForm = this.fb.group({
    // Personal Info
    email: [{ value: this.allinfo.email ?? '', disabled: true }],
    cin: [{ value: this.allinfo?.cin ?? '', disabled: true }],
    phone: [{ value: this.allinfo.personalInfo?.phone ?? '', disabled: true }],
    countryCode: [{ value: this.allinfo.personalInfo?.countryCode ?? 'TN', disabled: true }],
    address: [{ value: this.allinfo.personalInfo?.address ?? '', disabled: true }],
    birthDate: [{ 
      value: this.convertToDateInputFormat(this.allinfo.personalInfo?.birthDate) ?? null, 
      disabled: true 
    }],
    
    // Professional Info
    department: [{ value: this.allinfo.professionalInfo?.department ?? '', disabled: true }],
    position: [{ value: this.allinfo.professionalInfo?.position ?? '', disabled: true }],
    jobResponsibilities: [{ 
      value: this.allinfo.professionalInfo?.jobDescription?.responsibilities?.[0] ?? '', 
      disabled: true 
    }],
    jobQualifications: [{ 
      value: this.allinfo.professionalInfo?.jobDescription?.qualifications?.[0] ?? '', 
      disabled: true 
    }],

    // Editable fields
    hiringDate: [this.convertToDateInputFormat(this.allinfo.professionalInfo?.hiringDate) ?? null],
    salary: [this.allinfo.professionalInfo?.salary ?? ''],
    taxId: [this.allinfo.financialInfo?.taxId ?? ''],
    CNSS: [this.allinfo.financialInfo?.CNSS ?? ''],
    transportAllowance: [this.allinfo.financialInfo?.transportAllowance ?? 0],
    paymentMethod: [this.allinfo.financialInfo?.paymentMethod ?? ''],
    contractType: [this.allinfo.financialInfo?.contractType ?? ''],
    RIB: [this.allinfo.financialInfo?.RIB ?? ''],
    contractEndDate: [this.convertToDateInputFormat(this.allinfo.financialInfo?.contractEndDate) ?? null],
  });
  this.updatePositions(this.allinfo.professionalInfo.department);
  this.userForm.get('department')?.valueChanges.subscribe((value) => {
    this.updatePositions(value);
  });

  // Add listener for contract type changes
  this.userForm.get('contractType')?.valueChanges.subscribe(type => {
    const endDateControl = this.userForm.get('contractEndDate');
    if (type === 'CDD') {
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
  });

  // If CIN is already set, enable the field
  if (!this.allinfo?.cin) {
    this.showCinField = true;
    const cinControl = this.userForm.get('cin');
    if (cinControl) {
      cinControl.enable();
    }
  }

  console.log("first",this.allinfo);
}

// Add new method for form subscriptions

private setupFormSubscriptions(): void {
  this.userForm.get('department')?.valueChanges.subscribe((value) => {
    this.updatePositions(value);
  });

  this.userForm.get('contractType')?.valueChanges.subscribe(type => {
    const endDateControl = this.userForm.get('contractEndDate');
    
    // Handle Contract End Date
    if (type === 'CDD' || type === 'Stage') {
      endDateControl?.enable();
      endDateControl?.setValidators([
        Validators.required,
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

    // Handle financial fields based on contract type
    this.financialFields.forEach(field => {
      const control = this.userForm.get(field);
      if (!control) return;

      if (type === 'Stage') {
        // Clear validators and disable for Stage
        control.disable();
        control.clearValidators();
        control.setValue(null);
      } else {
        // Enable and set validators for other contract types
        control.enable();
        switch(field) {
          case 'taxId':
          case 'CNSS':
          case 'paymentMethod':
          case 'RIB':
            control.setValidators([Validators.required]);
            break;
          case 'transportAllowance':
            control.setValidators([Validators.required, Validators.max(40)]);
            break;
        }
      }
      control.updateValueAndValidity();
    });
  });

  // Initial state setup
  const initialContractType = this.userForm.get('contractType')?.value;
  if (initialContractType === 'Stage') {
    this.financialFields.forEach(field => {
      const control = this.userForm.get(field);
      control?.disable();
      control?.clearValidators();
      control?.setValue(null);
      control?.updateValueAndValidity();
    });
  }
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

private checkFormValidity(): void {
  Object.keys(this.userForm.controls).forEach(key => {
    const control = this.userForm.get(key);
    if (control?.errors) {
      console.log(`Control ${key} errors:`, control.errors);
    }
  });
}

}
