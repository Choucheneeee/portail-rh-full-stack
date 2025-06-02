// reset-password.component.ts
import { Component, OnInit } from "@angular/core";
import { FormGroup, FormControl, Validators, AbstractControl, ValidationErrors, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthService } from "../auth.service";
import { CommonModule } from "@angular/common";

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
  imports:[
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class ResetPasswordComponent implements OnInit {
  token: string = "";
  url: string = '/login';
  isLoading = false;

  // Password validation pattern
  private passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

  form = new FormGroup({
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(this.passwordPattern)
    ]),
    confirmPassword: new FormControl('', [
      Validators.required
    ])
  }, { validators: this.passwordMatchValidator });

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  // Custom validator for password match
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  get passwordErrorMessage(): string {
    const password = this.form.get('password');
    if (password?.errors) {
      if (password.errors['required']) return 'Password is required';
      if (password.errors['minlength']) return 'Password must be at least 8 characters';
      if (password.errors['pattern']) return 'Password must contain at least one letter, one number and one special character';
    }
    return '';
  }

  ngOnInit() {
    this.token = this.route.snapshot.queryParams['token'];
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
    });
  }

  onSubmit() {
    if (this.form.invalid || this.isLoading) return;
    
    this.isLoading = true;
    this.authService
      .resetPassword(this.token, this.form.value.password!)
      .subscribe({
        next: () => {
          alert('Password reset successful!');
          this.form.reset();
          this.router.navigate([this.url]);
          this.isLoading = false;
        },
        error: (err) => {
          alert(err.error.message);
          this.isLoading = false;
        }
      });
  }
  ngOnDestroy(): void {
    this.form.reset();
    this.isLoading = false;
    this.router.navigate([this.url]);
  }
}