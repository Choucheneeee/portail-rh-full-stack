import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { EmployeServiceService } from '../../service/employe-service.service';
import { ActivatedRoute, Router } from '@angular/router';

interface LeaveBalance {
  annual: number;
  sick: number;
  personal: number;
}

@Component({
  selector: 'app-conge',
  templateUrl: './conge.component.html',
  styleUrl: './conge.component.css',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class CongeComponent implements OnInit {
  leaveForm: FormGroup;
  isLoading = false;
  isEditMode = false;
  congeId: string | null = null;
  private congeObs!: Subscription;

  constructor(
    private fb: FormBuilder,
    private share: EmployeServiceService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.leaveForm = this.fb.group({
      date_Debut: ['', [Validators.required]],
      date_Fin: ['', [Validators.required]],
      type: ['', [Validators.required]],
      motif: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    // Get the ID from route parameters
    this.route.params.subscribe(params => {
      this.congeId = params['id'];
      console.log('ID:', this.congeId);
      
      // Get edit mode from query parameters
      this.route.queryParams.subscribe(queryParams => {
        console.log('Mode:', queryParams['mode']);
        if (this.congeId && queryParams['mode'] === 'edit') {
          this.isEditMode = true;
          this.loadCongeDetails(this.congeId);
        }
      });
    });
  }

  loadCongeDetails(id: string): void {
    this.isLoading = true;
    this.share.getCongeById(id).subscribe({
      next: (conge: any) => {
        console.log('Conge details:', conge);
        this.leaveForm.patchValue({
          date_Debut: conge.date_Debut ? new Date(conge.date_Debut).toISOString().split('T')[0] : null,
          date_Fin: conge.date_Fin ? new Date(conge.date_Fin).toISOString().split('T')[0] : null,
          type: conge.type,
          motif: conge.motif
        });
        this.isLoading = false;
      },
      error: (error) => {
        alert('Error loading conge details');
        this.isLoading = false;
      }
    });
  }

  annuler(): void {
    this.router.navigate(['/collaborateur']);
  }

  onSubmit(): void {
    this.isLoading = true;
    if (this.leaveForm.invalid) {
      alert('Please fill in all required fields correctly.');
      this.isLoading = false;
      return;
    }

    if (this.isEditMode && this.congeId) {
      this.congeObs = this.share.updateConge(this.congeId, this.leaveForm.value).subscribe({
        next: (response: any) => {
          console.log(response);
          alert(response.message);
          this.isLoading = false;
          this.leaveForm.reset();
          this.router.navigate(['/collaborateur']);
        },
        error: (error:any) => {
          console.error(error); // Log the error detai
          alert(error.error.error);
          this.isLoading = false;
          this.router.navigate(['/collaborateur']);
        }
      });
    } else {
      this.congeObs = this.share.createconges(this.leaveForm.value).subscribe({
        next: (response: any) => {
          alert(response.message);
          this.isLoading = false;
          this.leaveForm.reset();
        },
        error: (error) => {
          alert(error.error.error);
          this.isLoading = false;
        }
      });
    }
  }
}
