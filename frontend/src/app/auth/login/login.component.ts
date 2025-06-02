import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { EmployeServiceService } from '../../service/employe-service.service';

interface LoginResponse {
  token: string;
  name:string
  role:string
  userId:string
}

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']  // Fixed this typo: styleUrl -> styleUrls
})
export class LoginComponent {
  hidealert(){
    this.str = '';    
    }
    hidealertsuc(){
      this.strsucces = '';    
      }
  isLoading = false;  
  str: string = ''; // For error message display
  strsucces: string = ''; // For error message display

  loginForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private share: EmployeServiceService,
    private router: Router
  ) {}

  ngOnInit() {

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]], // Added email validation
      password: ['', [Validators.required, Validators.minLength(6)]], // Added minLength validation
    });
    if (typeof window !== 'undefined' && window.history) {
      if (history.state.welcomeMessage) {
      this.strsucces = history.state.welcomeMessage;
      history.replaceState({}, '');
    }
  }
  }

  onSubmit() {
    this.isLoading = true;
  
    const profileData = this.loginForm.value;
  
    this.share.loginemployee(profileData).subscribe(
      (data: LoginResponse) => { 
          localStorage.setItem('token', data.token);
          localStorage.setItem('loggedInUserId', data.userId); // Store the logged-in user's ID
          localStorage.setItem('role', data.role);

        setTimeout(() => {
          this.isLoading = false;
          console.log("data",data);
          const url=data.role=="rh"?'/rh': data.role=="admin"?'/admin':'/collaborateur';
          if(data.role=="rh"){
            this.router.navigate([url], { state: { welcomeMessage: `Welcome back Rh, ${data.name}. We're glad to have you with us!` } });
          }
          else{
            if(data.role!="admin"){
              this.router.navigate([url], { state: { welcomeMessage: `Welcome back Employee , ${data.name}. We're glad to have you with us!` } });
            }
            else{
              this.router.navigate([url], { state: { welcomeMessage: `Welcome back Admin, ${data.name}. We're glad to have you with us!` } });
            }
          }

        }, 3000);
      },
      (error) => {
        console.error("Error:", error);

        if (error.status === 400) {
          this.str =error.error.message;
        } else if (error.status === 401) {
          this.str = error.error.message;
        } else {
          this.str = error.error.message;
        }
  
        setTimeout(() => {
          this.isLoading = false;
        }, 3000);
      }
    );
  }

  
}
