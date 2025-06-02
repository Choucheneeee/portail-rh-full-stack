import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { EmployeServiceService } from '../../service/employe-service.service';
import { Subscription } from 'rxjs';
import { error } from 'console';
import { Router } from '@angular/router';



interface error{
  message:string
}

@Component({
  selector: 'app-register',
  
  imports: [
    CommonModule,
    ReactiveFormsModule,  // Ensure this is listed here to use ReactiveForms
    RouterModule
    
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})

export class RegisterComponent implements OnInit {
  hidealert(){
    this.str = '';    
    }
  isLoading = false;  // Loader state

  registerForm!: FormGroup;
  res: any;
  str:any
  private passwordPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  constructor(private fb: FormBuilder,private share: EmployeServiceService ,private router: Router) {}

  ngOnInit() {

    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(this.passwordPattern)
      ]],    }, {
      validators: this.passwordMatchValidator
    });
    
  }
  hasSpecialCharacter(value: string | null): boolean {
    if (!value) return false;
    const specialCharacterRegex = /[@$!%*?&]/;
    return specialCharacterRegex.test(value);
  }

  hasNumber(value: string | null): boolean {
    if (!value) return false;
    return /\d/.test(value);
  }

  hasUppercase(value: string | null): boolean {
    return value ? /[A-Z]/.test(value) : false;
  }
  hasLowercase(value: string | null): boolean {
  return value ? /[a-z]/.test(value) : false;
}
  private passwordMatchValidator(form: FormGroup): ValidationErrors | null {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  // Helper method to get password error message
  getPasswordErrorMessage(): string {
    const password = this.registerForm.get('password');
    if (password?.errors) {
      if (password.errors['required']) return 'Password is required';
      if (password.errors['minlength']) return 'Password must be at least 8 characters';
      if (password.errors['pattern']) return 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character';
    }
    return '';
  }

  onSubmit() {


    if (this.registerForm.invalid || this.isLoading) return;

    this.isLoading = true;

    const profileData = this.registerForm.value;

    this.share.addNewStudent(profileData).subscribe(
      (data:any) => {
        setTimeout(() => {
          this.isLoading = false;
          this.router.navigate(['/verif'], { state: { welcomeMessage: `${data.message}` } });

        }, 3000);
        
      },
      (error) => {
        console.error("Error in registration:", error.message[0]); 

        // Log the error message
        if (error.status === 400) {
          console.error("Bad Request - Missing or incorrect fields.");
          this.str =error.error.message;
          setTimeout(() => {
            this.isLoading = false;
  
          }, 3000);
        } else {
          console.error("Unexpected error occurred.");
          this.str =error.error.message;
          setTimeout(() => {
            this.isLoading = false;
  
          }, 3000);
        }
      }
    );
  }
  showPassword: boolean = false;
  password: string = '';

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
