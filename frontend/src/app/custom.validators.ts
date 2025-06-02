// custom.validators.ts
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
// custom.validators.ts
export function minimumAgeValidator(minAge: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
  
      // Parse input date (YYYY-MM-DD)
      const [year, month, day] = value.split('-').map(Number);
      const birthDate = new Date(year, month - 1, day);
      
      // Today's date at midnight (ignore time)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      // Calculate min allowed date (18 years ago)
      const minDate = new Date(
        today.getFullYear() - minAge,
        today.getMonth(),
        today.getDate()
      );
      minDate.setHours(0, 0, 0, 0);
  
      // Compare dates (time-agnostic)
      return birthDate <= minDate 
        ? null 
        : { minimumAge: { requiredAge: minAge } };
    };
  }