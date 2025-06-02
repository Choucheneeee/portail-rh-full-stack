import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidatorFn, Validators, ValidationErrors } from '@angular/forms';
import { CountryCode, getCountries, getCountryCallingCode, parsePhoneNumberFromString, getExampleNumber } from 'libphonenumber-js/max';
import examples from 'libphonenumber-js/examples.mobile.json';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="phone-input-container" [class.invalid]="showErrors()">
      <label class="input-label">Phone Number</label>
      <div class="input-wrapper">
        <!-- Country Selector -->
        <div class="country-selector">
          <div class="selected-country" [class.readonly]="readonly" [class.clickable]="!readonly">
            <span class="country-flag">{{ getFlagEmoji(countryCodeControl.value) }}</span>
            <span class="country-code">+{{ getCallingCode(countryCodeControl.value) }}</span>
            <span class="dropdown-icon" *ngIf="!readonly">{{ isDropdownOpen ? '▲' : '▼' }}</span>
          </div>
          
          <!-- Country Dropdown - Only show if not readonly -->
          <div *ngIf="isDropdownOpen && !readonly" 
               class="country-dropdown"
               (clickOutside)="isDropdownOpen = false">
            <input type="text" 
                   class="country-search" 
                   placeholder="Search country..."
                   [(ngModel)]="countrySearch"
                   (input)="filterCountries()"
                   (click)="$event.stopPropagation()">
            
            <div class="country-list">
              <div *ngFor="let country of filteredCountries" 
                   class="country-option"
                   (click)="selectCountry(country.code)"
                   [class.selected]="country.code === countryCodeControl.value">
                <span class="country-flag">{{ getFlagEmoji(country.code) }}</span>
                <span class="country-name">{{ country.name }}</span>
                <span class="country-calling-code">+{{ country.callingCode }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Phone Input -->
        <input type="tel" 
               class="phone-number-input"
               [formControl]="phoneControl"
               [attr.placeholder]="getPlaceholder()"
               [maxLength]="maxPhoneLength"
               [readonly]="readonly"
               [class.readonly]="readonly"
               (keypress)="onKeyPress($event)"
               (focus)="onPhoneInputFocus()">
      </div>

      <!-- Error Messages - Only show if not readonly -->
      <div class="error-messages" *ngIf="showErrors() && !readonly">
        <!-- Required Error -->
        <div class="error-message" 
             [class.visible]="hasError('required')">
          <div class="error-content">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>Phone number is required</span>
          </div>
        </div>

        <!-- Pattern Error -->
        <div class="error-message" 
             [class.visible]="hasError('pattern')">
          <div class="error-content">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>Phone number must contain only digits</span>
          </div>
        </div>

        <!-- Length Error -->
        <div class="error-message" 
             [class.visible]="hasError('invalidLength')">
          <div class="error-content">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>Phone number must be {{ phoneControl.errors?.['invalidLength']?.required }} digits</span>
          </div>
        </div>

        <!-- Invalid Format Error -->
        <div class="error-message" 
             [class.visible]="hasError('invalidPhone')">
          <div class="error-content">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>Invalid phone number format for {{ getCountryName(countryCodeControl.value) }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .phone-input-container {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin-bottom: 1.5rem;
      width: 100%;
    }

    .input-label {
      display: block;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      color: #4a5568;
      font-weight: 500;
    }

    .input-wrapper {
      display: flex;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      transition: border-color 0.2s;
    }

    .phone-input-container.invalid .input-wrapper {
      border-color: #e53e3e;
    }

    .country-selector {
      position: relative;
      min-width: 120px;
    }

    .selected-country {
      display: flex;
      align-items: center;
      padding: 0.5rem 0.75rem;
      background-color: #f7fafc;
      border-right: 1px solid #e2e8f0;
      border-radius: 0.375rem 0 0 0.375rem;
      cursor: pointer;
      user-select: none;
    }

    .country-flag {
      margin-right: 0.5rem;
      font-size: 1.2em;
    }

    .country-code {
      margin-right: 0.5rem;
      font-weight: 500;
    }

    .dropdown-icon {
      font-size: 0.75rem;
      color: #718096;
    }

    .country-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      width: 280px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      z-index: 10;
      margin-top: 0.25rem;
    }

    .country-search {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: none;
      border-bottom: 1px solid #e2e8f0;
      outline: none;
    }

    .country-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .country-option {
      display: flex;
      align-items: center;
      padding: 0.5rem 0.75rem;
      cursor: pointer;
    }

    .country-option:hover {
      background-color: #f7fafc;
    }

    .country-option.selected {
      background-color: #ebf8ff;
    }

    .country-name {
      flex: 1;
      margin: 0 0.5rem;
    }

    .country-calling-code {
      color: #718096;
    }

    .phone-number-input {
      flex: 1;
      padding: 0.5rem 0.75rem;
      border: none;
      outline: none;
      border-radius: 0 0.375rem 0.375rem 0;
    }

    .error-messages {
      margin-top: 0.5rem;
      overflow: hidden;
    }

    .error-message {
      height: 0;
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.2s ease-in-out;
      margin-top: 0;
    }

    .error-message.visible {
      height: auto;
      opacity: 1;
      transform: translateY(0);
      margin-top: 0.5rem;
    }

    .error-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #e53e3e;
      font-size: 0.875rem;
    }

    .readonly {
      background-color: #f3f4f6;
      cursor: not-allowed;
      opacity: 0.7;
    }

    .clickable {
      cursor: pointer;
    }

    .phone-number-input.readonly {
      background-color: #f3f4f6;
      cursor: not-allowed;
    }
  `]
})
export class PhoneInputComponent implements OnInit, OnDestroy {
  @Input() parentForm!: FormGroup;
  @Input() readonly: boolean = false; // Add this input property

  countries: { code: CountryCode; name: string; callingCode: string }[] = [];
  filteredCountries: { code: CountryCode; name: string; callingCode: string }[] = [];
  maxPhoneLength = 15;
  isDropdownOpen = false;
  countrySearch = '';

  private destroy$ = new Subject<void>();

  get countryCodeControl(): FormControl {
    return this.parentForm?.get('countryCode') as FormControl;
  }

  get phoneControl(): FormControl {
    return this.parentForm?.get('phone') as FormControl;
  }

  ngOnInit() {
    if (!this.parentForm) {
      throw new Error('Parent form is required');
    }
    
    if (!this.parentForm.contains('countryCode') || !this.parentForm.contains('phone')) {
      throw new Error('Parent form must contain countryCode and phone controls');
    }

    this.initializeCountries();
    this.setupPhoneValidation();
    this.setupValueChanges();
  }

  private setupValueChanges() {
    // Update parent form validity when phone number changes
    this.phoneControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.phoneControl.invalid) {
          this.parentForm.setErrors({ invalidPhone: true });
        } else {
          const currentErrors = this.parentForm.errors || {};
          delete currentErrors['invalidPhone'];
          this.parentForm.setErrors(Object.keys(currentErrors).length ? currentErrors : null);
        }
      });
  }

  private setupPhoneValidation() {
    this.countryCodeControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((countryCode: CountryCode) => {
        const exampleNumber = getExampleNumber(countryCode, examples);
        if (exampleNumber) {
          this.maxPhoneLength = exampleNumber.nationalNumber.length;
        }

        // Set validators
        this.phoneControl.setValidators([
          Validators.required,
          Validators.pattern(/^[0-9]+$/),
          this.phoneValidator()
        ]);
        this.phoneControl.updateValueAndValidity();
      });
  }

  getPlaceholder(): string {
    const countryCode = this.countryCodeControl.value as CountryCode;
    const example = getExampleNumber(countryCode, examples);
    return example ? `e.g. ${example.nationalNumber}` : 'Enter phone number';
  }

  private initializeCountries() {
    this.countries = getCountries().map(countryCode => ({
      code: countryCode,
      name: this.getCountryName(countryCode),
      callingCode: getCountryCallingCode(countryCode)
    })).sort((a, b) => a.name.localeCompare(b.name));

    this.filteredCountries = [...this.countries];
    
    // Set Tunisia as default country if no value is set
    if (!this.countryCodeControl.value) {
      this.countryCodeControl.setValue('TN' as CountryCode);
    }
  }

  private getMinLength(countryCode: CountryCode): number {
    // Define minimum lengths for different countries
    const minLengths: { [key: string]: number } = {
      'TN': 8,  // Tunisia
      'FR': 9,  // France
      'US': 10, // United States
      // Add more countries as needed
    };
    return minLengths[countryCode] || 5; // Default minimum length
  }

  // Prevent non-numeric input
  onKeyPress(event: KeyboardEvent): boolean {
    if (this.readonly) {
      event.preventDefault();
      return false;
    }
    const pattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.charCode);

    if (!pattern.test(inputChar)) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  private phoneValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return { required: true };
      }

      const countryCode = this.countryCodeControl.value as CountryCode;
      if (!countryCode) {
        return { invalidPhone: true };
      }

      try {
        const phoneNumber = parsePhoneNumberFromString(
          `+${this.getCallingCode(countryCode)}${control.value}`, 
          countryCode
        );

        if (!phoneNumber?.isValid()) {
          return { invalidPhone: true };
        }

        const nationalNumber = phoneNumber.nationalNumber;
        const minLength = this.getMinLength(countryCode);

        if (nationalNumber.length < minLength) {
          return {
            invalidLength: {
              required: minLength,
              current: nationalNumber.length
            }
          };
        }

        return null;
      } catch (e) {
        return { invalidPhone: true };
      }
    };
  }

  getFlagEmoji(countryCode: CountryCode | string): string {
    if (!countryCode) return '';
    const code = typeof countryCode === 'string' ? countryCode : countryCode;
    return code
      ? String.fromCodePoint(...[...code.toUpperCase()].map(c => 127397 + c.charCodeAt(0)))
      : '';
  }

  getCallingCode(countryCode: CountryCode | string): string {
    if (!countryCode) return '';
    try {
      return getCountryCallingCode(countryCode as CountryCode);
    } catch {
      return '';
    }
  }

  getCountryName(countryCode: CountryCode | string): string {
    if (!countryCode) return '';
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return regionNames.of(countryCode as string) || countryCode as string;
  }

  toggleDropdown(): void {
    if (this.readonly) return; // Don't toggle if readonly
    this.isDropdownOpen = !this.isDropdownOpen;
    if (this.isDropdownOpen) {
      this.filterCountries();
    }
  }

  selectCountry(countryCode: CountryCode): void {
    if (this.readonly) return; // Don't select if readonly
    this.countryCodeControl.setValue(countryCode);
    this.isDropdownOpen = false;
    this.phoneControl.markAsTouched();
  }

  filterCountries(): void {
    if (!this.countrySearch) {
      this.filteredCountries = [...this.countries];
      return;
    }
    
    const searchTerm = this.countrySearch.toLowerCase();
    this.filteredCountries = this.countries.filter(country => 
      country.name.toLowerCase().includes(searchTerm) || 
      country.code.toLowerCase().includes(searchTerm) ||
      country.callingCode.includes(this.countrySearch)
    );
  }

  onPhoneInputFocus(): void {
    if (this.readonly) return; // Don't auto-fill if readonly
    if (!this.phoneControl.value && this.countryCodeControl.value === 'TN') {
      this.phoneControl.setValue('2'); // Common starting digit for Tunisian numbers
    }
  }

  showErrors(): boolean {
    return Boolean(
      this.phoneControl?.invalid && 
      (this.phoneControl?.touched || this.phoneControl?.dirty)
    );
  }

  hasError(errorType: string): boolean {
    return Boolean(
      this.phoneControl?.errors?.[errorType] && 
      (this.phoneControl?.touched || this.phoneControl?.dirty)
    );
  }

  getErrorMessage(): string {
    if (!this.phoneControl || !this.phoneControl.errors) return '';
    
    const errors = this.phoneControl.errors;
    const countryName = this.getCountryName(this.countryCodeControl.value);

    if (errors['required']) {
      return `Phone number is required`;
    }
    
    if (errors['pattern']) {
      return `Phone number must contain only digits`;
    }

    if (errors['invalidLength']) {
      const { required, current } = errors['invalidLength'];
      return `Phone number for ${countryName} must be ${required} digits (current: ${current})`;
    }

    if (errors['invalidPhone']) {
      return `Invalid phone number format for ${countryName}`;
    }

    return `Invalid phone number`;
  }

  // Update getValue method to return formatted number only if valid
  getValue(): string | null {
    if (this.phoneControl.valid && this.countryCodeControl.valid) {
      const countryCode = this.countryCodeControl.value;
      const phoneNumber = parsePhoneNumberFromString(
        `+${this.getCallingCode(countryCode)}${this.phoneControl.value}`,
        countryCode
      );
      return phoneNumber?.format('E.164') || null;
    }
    return null;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}