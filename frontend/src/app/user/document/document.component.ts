import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { EmployeServiceService } from '../../service/employe-service.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-document',
  templateUrl: './document.component.html',
  styleUrls: ['./document.component.css'],
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule,
    CommonModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule
  ],
  standalone: true
})
export class DocumentComponent implements OnInit {
  documentForm: FormGroup;
  isLoading = false;
  isEditMode = false;
  documentId: string | null = null;
  private documentObs!: Subscription;

  years = Array.from({length: 10}, (_, i) => new Date().getFullYear() - i);
  months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  documentTypes = [
    {
      value: 'attestation',
      label: 'Attestation de Travail',
      icon: 'fa-file-signature text-blue-500',
      description: 'Demander une attestation de travail officielle'
    },
    {
      value: 'fiche_paie',
      label: 'Fiche de Paie',
      icon: 'fa-file-invoice-dollar text-green-500',
      description: 'Obtenir votre fiche de paie mensuelle ou annuelle'
    },
    {
      value: 'attestation_de_stage',
      label: 'Attestation de Stage',
      icon: 'fa-user-graduate text-purple-500',
      description: 'Demander une attestation de stage'
    },
  ];

  constructor(
    private fb: FormBuilder,
    private share: EmployeServiceService,
    private _snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.documentForm = this.fb.group({
      documentType: ['', Validators.required],
      description: ['', [Validators.minLength(10)]],
      periodType: [null],
      month: [null],
      year: [null, [Validators.required, Validators.min(2000), Validators.max(new Date().getFullYear())]]
    });
    this.handleDocumentTypeChanges();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.documentId = params['id'];
      
      this.route.queryParams.subscribe(queryParams => {
        if (this.documentId && queryParams['mode'] === 'edit') {
          this.isEditMode = true;
          this.loadDocumentDetails(this.documentId);
        }
      });
    });
  }

  selectDocumentType(type: string) {
    this.documentForm.patchValue({ documentType: type });
  }

  private handleDocumentTypeChanges() {
    this.documentForm.get('documentType')?.valueChanges.subscribe(value => {
      const periodTypeControl = this.documentForm.get('periodType');
      const monthControl = this.documentForm.get('month');
      const yearControl = this.documentForm.get('year');

      if (value === 'fiche_paie') {
        periodTypeControl?.setValidators(Validators.required);
        yearControl?.setValidators([Validators.required, Validators.min(2000), Validators.max(new Date().getFullYear())]);
      } else {
        periodTypeControl?.clearValidators();
        monthControl?.clearValidators();
        yearControl?.clearValidators();
        periodTypeControl?.reset();
        monthControl?.reset();
        yearControl?.reset();
      }
      
      periodTypeControl?.updateValueAndValidity();
      monthControl?.updateValueAndValidity();
      yearControl?.updateValueAndValidity();
    });

    this.documentForm.get('periodType')?.valueChanges.subscribe(value => {
      const monthControl = this.documentForm.get('month');
      if (value === 'mensuel') {
        monthControl?.setValidators(Validators.required);
      } else {
        monthControl?.clearValidators();
        monthControl?.reset();
      }
      monthControl?.updateValueAndValidity();
    });
  }

  loadDocumentDetails(id: string): void {
    this.isLoading = true;
    this.share.getDocumentById(id).subscribe({
      next: (document: any) => {
        console.log('Document details:', document);

        this.documentForm.patchValue({
          documentType: document.type,
          description: document.documenttDetails,
          periodType: document.periode,
          month: Number(document.mois), // Convert to number if it's coming as string
          year: Number(document.annee)  // Convert to number if it's coming as string
        });
        this.isLoading = false;
      },
      error: (error) => {
        this._snackBar.open('Error loading document details', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.documentForm.valid) {
      this.isLoading = true;
      const formData = {
        periodType: this.documentForm.get('periodType')?.value,
        month: this.documentForm.get('month')?.value,
        year: this.documentForm.get('year')?.value,
        documentType: this.documentForm.get('documentType')?.value,
        description: this.documentForm.get('description')?.value
      };

      if (this.isEditMode && this.documentId) {
        this.documentObs = this.share.updateDocument(this.documentId, formData).subscribe({
          next: (response: any) => {
            this._snackBar.open(response.message, 'Close', {
              duration: 5000,
              panelClass: ['success-snackbar']
            });
            this.isLoading = false;
            this.documentForm.reset();
            this.router.navigate(['/collaborateur']);
          },
          error: (error) => {
            this._snackBar.open(error.error.error, 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
            this.isLoading = false;
          }
        });
      } else {
        this.share.addDemande(formData).subscribe({
          next: (data: any) => {
            setTimeout(() => {
              this.isLoading = false;
              this.documentForm.reset();
              
              this._snackBar.open(data.message, 'Fermer', {
                duration: 5000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['success-snackbar']
              });
            }, 3000);
          },
          error: (error) => {
            this.isLoading = false;
            this._snackBar.open(error.error.error, 'Fermer', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    }
  }

  onReset(): void {
    this.documentForm.reset();
  }

  cancel(): void {
    this.router.navigate(['/collaborateur']);
  }
}