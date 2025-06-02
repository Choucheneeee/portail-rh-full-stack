import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EmployeServiceService } from '../../service/employe-service.service';
import { CommonModule } from '@angular/common';


interface VerifResponse {
  message: string;
}
@Component({
  selector: 'app-verif',
  imports: [
    ReactiveFormsModule,CommonModule
  ],
  templateUrl: './verif.component.html',
  styleUrl: './verif.component.css'
})
export class VerifComponent implements OnInit {
  strsucces:string =""
  
  isLoading = false;  // Loader state

  email = "chouchene.amine.etud@gmail.com";
  verifyForm!: FormGroup;
  str:any

  hidealert(){
    this.str = '';
  }
  hidealertsuc(){
    this.strsucces = '';
  }

  constructor(private fb: FormBuilder,private share: EmployeServiceService ,private router: Router){}

  ngOnInit() {
  
      this.verifyForm = this.fb.group({
        email: ['', Validators.required],
        c1: ['', Validators.required],
        c2: ['', Validators.required],
        c3: ['', Validators.required],
        c4: ['', Validators.required],
        c5: ['', Validators.required],
        c6: ['', Validators.required],
      });
      if (typeof window !== 'undefined' && window.history) {
        if (history.state.welcomeMessage) {
        this.strsucces = history.state.welcomeMessage;
        history.replaceState({}, '');
      }
    }
    }
  onSubmit() {
    if (this.verifyForm.invalid) {
      return; 
    }
    this.isLoading = true;
  
    const code =this.verifyForm.value.c1+this.verifyForm.value.c2+this.verifyForm.value.c3+
    this.verifyForm.value.c4+this.verifyForm.value.c5+this.verifyForm.value.c6
    const email=this.verifyForm.value.email

    this.share.verifyemail(email,code).subscribe(
      (data: VerifResponse) => { 
        setTimeout(() => {
          this.isLoading = false;
          this.router.navigate(['/login'], { state: { welcomeMessage: `${data.message}` } });
          
        }, 3000);
        
        
      },
      (error) => {


        if (error.status === 400) {
          setTimeout(() => {
            this.isLoading = false;
            this.str =error.error.message;
          }, 3000);
          } else {
          setTimeout(() => {
            this.isLoading = false;  
            this.str =error.error.message;

          }, 3000);
        }
      }
    );
}
    moveFocus(currentInput: HTMLInputElement, nextInput: HTMLInputElement): void {
      if (currentInput.value.length === currentInput.maxLength) {
        nextInput.focus();
      }
    }
    
}
