// forgot-password.component.ts
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { AuthService } from "../auth.service";
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterModule
  ],
  // Add providers array
  providers: [AuthService]
})
export class ForgotPasswordComponent {
  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email])
  });

  isLoading = false;
  url: string = '/login';

  get email() {
    return this.form.get('email');
  }

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    if (this.form.invalid || this.isLoading) return;

    this.isLoading = true; // Start loading
    this.authService.forgotPassword(this.form.value.email!).subscribe({
      next: () => {
        this.form.reset();
        alert('Reset email sent! Check your inbox');
        this.router.navigate([this.url]);
        this.isLoading = false; // Stop loading
      },
      error: (err) => {
        alert(err.error?.message || 'An error occurred');
        this.isLoading = false; // Stop loading
      }
    });
  }
  ngOnDestroy(): void {
    this.form.reset();
    this.isLoading = false;
    this.router.navigate([this.url]);
  }
}