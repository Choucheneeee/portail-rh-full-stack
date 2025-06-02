import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { EmployeServiceService } from '../../service/employe-service.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-avance',
  templateUrl: './avance.component.html',
  styleUrls: ['./avance.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
})
export class AvanceComponent implements OnInit {
  avanceForm: FormGroup;
  requestType: 'pret' | 'avance' = 'pret';
  isSubmitting = false;
  repaymentPeriods = [6, 12, 18, 24, 36];
  congeObs!: Subscription;
  isLoading: boolean = false;
  isEditMode = false;
  avanceId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private share: EmployeServiceService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.avanceForm = this.fb.group({
      requestType: ['', Validators.required],
      type: [this.requestType, Validators.required],
      amount: ['', [Validators.required, Validators.min(0)]],
      reason: ['', [Validators.required, Validators.minLength(10)]],
      repaymentPeriod: [''],
    });
  }

  ngOnInit(): void {
    // Get the ID from route parameters
    this.route.params.subscribe(params => {
      this.avanceId = params['id'];
      console.log('ID:', this.avanceId);
      
      // Get edit mode from query parameters
      this.route.queryParams.subscribe(queryParams => {
        console.log('Mode:', queryParams['mode']);
        if (this.avanceId && queryParams['mode'] === 'edit') {
          this.isEditMode = true;
          this.loadAvanceDetails(this.avanceId);
        }
      });
    });

    // Add or remove repaymentPeriod validator based on request type
    this.avanceForm.get('repaymentPeriod')?.setValidators(
      this.requestType === 'pret' ? [Validators.required] : null
    );
  }

  loadAvanceDetails(id: string): void {
    this.isLoading = true;
    this.share.getAvanceById(id).subscribe({
      next: (avance: any) => {
        console.log('Avance details:', avance);
        this.setRequestType(avance.type);
        this.avanceForm.patchValue({  
          requestType: avance.type,
          type: avance.type,  
          amount: avance.montant,
          reason: avance.motif, 
          repaymentPeriod: avance.remboursement,    
        });
        this.isLoading = false;
      },
      error: (error) => {
        alert('Error loading avance details');
        this.isLoading = false;
      }
    });
  }

  setRequestType(type: 'pret' | 'avance'): void {
    this.requestType = type;
    this.avanceForm.patchValue({ requestType: type });
    if (type === 'pret') {
      this.avanceForm.get('repaymentPeriod')?.setValidators([Validators.required]);
    } else {
      this.avanceForm.get('repaymentPeriod')?.clearValidators();
      this.avanceForm.get('repaymentPeriod')?.setValue('');
    }
    this.avanceForm.get('repaymentPeriod')?.updateValueAndValidity();
  }

  annuler(): void {
    this.router.navigate(['/collaborateur']);
  }
  
  onSubmit(): void {
    if (this.avanceForm.valid) {
      this.isSubmitting = true;
      this.isLoading = true;
      console.log('Form submitted:', this.avanceForm.value);

      if (this.isEditMode && this.avanceId) {
        this.congeObs = this.share.updateAvance(this.avanceId, this.avanceForm.value).subscribe({
          next: (response: any) => {
            alert(response.message);
            this.isLoading = false;
            this.avanceForm.reset();
            this.isSubmitting = false;
            this.router.navigate(['/collaborateur']);
          },
          error: (error) => {
            alert(error.error.error);
            this.isLoading = false;
            this.isSubmitting = false;
            this.router.navigate(['/collaborateur']);
          }
        });
      } else {
        this.congeObs = this.share.createavance(this.avanceForm.value).subscribe({
          next: (response: any) => {
            alert(response.message);
            this.isLoading = false;
            this.avanceForm.reset();
            this.isSubmitting = false;
          },
          error: (error) => {
            alert(error.error.error);
            this.isLoading = false;
            this.isSubmitting = false;
          }
        });
      }
    }
  }
}
