import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { EmployeServiceService } from '../../service/employe-service.service';
import { ActivatedRoute, Router } from '@angular/router';



interface FormationRequest {
  title: string;
  type: string;
  date_Debut: string | null;
  date_Fin: string | null;
  description: string;
  organisme: string;
  cout: number | null;
}

@Component({
  selector: 'app-formation',    
  imports: [CommonModule,FormsModule],
  templateUrl: './formation.component.html',
  styleUrl: './formation.component.css'           
})
export class FormationComponent implements OnInit {
  isLoading = false;
  private formationObs!: Subscription;
  isEditMode = false;
  formationId: string | null = null;

  formationRequest: FormationRequest = {
    title: '',
    type: '',
    date_Debut: null,
    date_Fin: null,
    description: '',
    organisme: '',
    cout: null,
  };  

  constructor(
    private share: EmployeServiceService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Get the ID from route parameters instead of query parameters
    this.route.params.subscribe(params => {
      this.formationId = params['id'];
      console.log('ID:', this.formationId);
      
      // Get edit mode from query parameters
      this.route.queryParams.subscribe(queryParams => {
        console.log('Mode:', queryParams['mode']);
        if (this.formationId && queryParams['mode'] === 'edit') {
          this.isEditMode = true;
          this.loadFormationDetails(this.formationId);
        }
      });
    });
  }

  // Update returnHome method to use Router
  returnHome(): void {
    this.router.navigate(['/collaborateur']);
  }
  loadFormationDetails(id: string): void {
    this.isLoading = true;
    this.share.getFormationById(id).subscribe({
      next: (formation: any) => {
        console.log('Formation details:', formation);
        console.log('Formation details111 :', formation.formation );
        this.formationRequest = { 
          title: formation.formation.titre,
          type: formation.formation.type,
          date_Debut: formation.formation.date_Debut ? new Date(formation.formation.date_Debut).toISOString().split('T')[0] : null,
          date_Fin: formation.formation.date_Fin ? new Date(formation.formation.date_Fin).toISOString().split('T')[0] : null,
          description: formation.formation.description,
          organisme: formation.formation.organisme,    
          cout: formation.formation.cout,
        };  
        console.log('Formation details222 :', this.formationRequest);
        this.isLoading = false;
      },
      error: (error) => {
        alert('Error loading formation details');
        this.isLoading = false;
      }
    });
  }
  annuler(){
    this.router.navigate(['/collaborateur']);
  }
  onSubmit(): void {
    this.isLoading = true;    
    if (this.isEditMode && this.formationId) {
      this.formationObs = this.share.updateFormation(this.formationId, this.formationRequest).subscribe({
        next: (response: any) => {      
          alert(response.message);
          this.isLoading = false;
          this.resetForm();
          this.router.navigate(['/collaborateur']); 
        },
        error: (error) => {
          alert(error.error.error);
          this.isLoading = false;
          this.router.navigate(['/collaborateur']);

        }
      });
    } else {
      this.formationObs = this.share.createFormation(this.formationRequest).subscribe({
        next: (response: any) => {
          alert(response.message);
          this.isLoading = false;
          this.resetForm();
        },
        error: (error) => {
          alert(error.error.error);
          this.isLoading = false;
        }
      });
    }
  }

getFormProgress(): number {

    let filledFields = 0;
    const totalRequiredFields = 7;
    if (this.formationRequest.title) filledFields++;
    if (this.formationRequest.type) filledFields++;
    if (this.formationRequest.date_Debut) filledFields++;
    if (this.formationRequest.date_Fin) filledFields++;
    if (this.formationRequest.description) filledFields++;
    if (this.formationRequest.organisme) filledFields++;
    if(this.formationRequest.cout)filledFields++
    
    return (filledFields / totalRequiredFields) * 100;
  }
  
  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  resetForm(): void {
    this.formationRequest = {
      title: '',
      type: '',
      date_Debut: null,
      date_Fin: null,
      description: '',
      organisme: '',
      cout: null,
    };
  }
}
