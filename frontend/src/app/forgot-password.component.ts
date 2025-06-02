// forgot-password.component.ts

import { FormControl, Validators } from "@angular/forms";
import { AuthService } from "./auth.service";


export class ForgotPasswordComponent {
    email = new FormControl('', [Validators.required, Validators.email]);
  
    constructor(private authService: AuthService) {}
  
    onSubmit() {
      this.authService.forgotPassword(this.email.value!).subscribe({
        next: () => alert('Reset email sent!'),
        error: (err) => alert(err.error.message),
      });
    }
  }