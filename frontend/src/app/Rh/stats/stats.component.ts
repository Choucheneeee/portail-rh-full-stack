import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { EmployeServiceService } from '../../service/employe-service.service';
import { ServiceRHService } from '../service-rh.service';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.css'
})
export class StatsComponent implements OnInit {
  @Input() chartType: 'general' | 'detailed' = 'general';
  // Add loading state
  isLoading = true;

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    },
    plugins: {
      legend: {
        display: true,
      }
    }
  };

  public barChartType: ChartType = 'bar';
  public barChartData: ChartConfiguration['data'] = {
    labels: ['Documents', 'Congés', 'Avances', 'Formations'],
    datasets: [
      {
        data: [0, 0, 0, 0],
        label: 'Demandes en cours',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgb(54, 162, 235)',
      },
      {
        data: [0, 0, 0, 0],
        label: 'Demandes traitées',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgb(75, 192, 192)',
      }
    ]
  };

  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'right'
      }
    }
  };

  public pieChartType: ChartType = 'pie';
  public pieChartData: ChartConfiguration['data'] = {
    labels: ['Documents', 'Congés', 'Avances', 'Formations'],
    datasets: [{
      label: 'Demandes',
      data: [0, 0, 0, 0],
      backgroundColor: [
        'rgb(255, 99, 132)',   // Red for documents
        'rgb(54, 162, 235)',   // Blue for congés
        'rgb(255, 205, 86)',   // Yellow for avances
        'rgb(75, 192, 192)'    // Teal for formations
      ],
      hoverOffset: 4
    }]
  };

  // Configure charts for each category
  public categoryCharts = {
    documents: {
      options: this.createChartOptions('Types de Documents'),
      type: 'pie' as ChartType,
      data: {
        labels: ['Attestation de travail', 'Fiche de paie', 'Attestation de Stage'],
        datasets: [{
          data: [0, 0, 0],
          backgroundColor: [
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)', 
            'rgb(255, 205, 86)'
          ],
          hoverOffset: 4
        }]
      }
    },
    conges: {
      options: this.createChartOptions('Types de Congés'),
      type: 'pie' as ChartType,
      data: {
        labels: ['Annuel', 'Maladie', 'Sans solde', 'Maternité', 'Paternité'],
        datasets: [{
          data: [0, 0, 0, 0, 0],
          backgroundColor: [
            'rgb(75, 192, 192)',
            'rgb(153, 102, 255)',
            'rgb(255, 159, 64)',
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)'
          ],
          hoverOffset: 4
        }]
      }
    },
    avances: {
      options: this.createChartOptions('Types d\'Avances'),
      type: 'pie' as ChartType,
      data: {
        labels: ['Prêt', 'Avance sur salaire'],
        datasets: [{
          data: [0, 0],
          backgroundColor: [
            'rgb(255, 205, 86)',
            'rgb(75, 192, 192)'
          ],
          hoverOffset: 4
        }]
      }
    },
    formations: {
      options: this.createChartOptions('Types de Formations'),
      type: 'pie' as ChartType,
      data: {
        labels: ['Interne', 'Externe'],
        datasets: [{
          data: [0, 0],
          backgroundColor: [
            'rgb(54, 162, 235)',
            'rgb(255, 99, 132)'
          ],
          hoverOffset: 4
        }]
      }
    }
  };

  public combinedChart = {
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'right' as const,
          display: true
        },
        title: {
          display: true,
          text: 'Distribution des Demandes par Type',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      },
      scales: {
        x: {
          stacked: true
        },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    },
    type: 'bar' as ChartType,
    data: {
      labels: [
        // Documents
        'Attestation de Travail', 'Fiche de paie', 'Attestation de Stage',
        // Congés
        'Congé annuel', 'Congé maladie', 'Sans solde', 'Maternité', 'Paternité',
        // Avances
        'Prêt', 'Avance sur salaire',
        // Formations
        'Formation interne', 'Formation externe'
      ],
      datasets: [
        {
          label: 'Approuvé',
          data: new Array(12).fill(0),
          backgroundColor: 'rgba(75, 192, 192, 0.5)', // Green for Approuvé
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 1
        },
        {
          label: 'Refusé',
          data: new Array(12).fill(0),
          backgroundColor: 'rgba(255, 99, 132, 0.5)', // Red for Refusé
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1
        },
        {
          label: 'En attente',
          data: new Array(12).fill(0),
          backgroundColor: 'rgba(255, 205, 86, 0.5)', // Yellow for En attente
          borderColor: 'rgb(255, 205, 86)',
          borderWidth: 1
        }
      ]
    }
  };

  constructor(private share: ServiceRHService) {}

  ngOnInit() {
    this.loadRequestsData();
  }

  private createChartOptions(title: string): ChartConfiguration['options'] {
    return {
      responsive: true,
      plugins: {
        legend: {
          position: 'right',
          display: true
        },
        title: {
          display: true,
          text: title,
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      }
    };
  }

  private loadRequestsData() {
    this.isLoading = true; // Set loading to true before fetching data
    this.share.getAllRequests().subscribe({
      next: (response: any) => {
        console.log("Response:", response);

        const stats = {
          documents: { pending: 0, processed: 0 },
          conges: { pending: 0, processed: 0 },
          avances: { pending: 0, processed: 0 },
          formations: { pending: 0, processed: 0 }
        };

        const pieStats = {
          documents: 0,
          conges: 0,
          avances: 0,
          formations: 0
        };

        // Process demandes (documents)
        if (response.demandes) {
          response.demandes.forEach((request: any) => {
            if (request.status === 'En attente') {
              stats.documents.pending++;
            } else {
              stats.documents.processed++;
            }
            pieStats.documents++;
          });
        }

        // Process conges
        if (response.conges) {
          response.conges.forEach((conge: any) => {
            if (conge.status === 'En attente') {
              stats.conges.pending++;
            } else {
              stats.conges.processed++;
            }
            pieStats.conges++;
          });
        }

        // Process avances
        if (response.avances) {
          response.avances.forEach((avance: any) => {
            if (avance.status === 'En attente') {
              stats.avances.pending++;
            } else {
              stats.avances.processed++;
            }
            pieStats.avances++;
          });
        }

        // Process formations
        if (response.formations) {
          response.formations.forEach((formation: any) => {
            if (formation.status === 'En attente') {
              stats.formations.pending++;
            } else {
              stats.formations.processed++;
            }
            pieStats.formations++;
          });
        }

        // Update bar chart data
        this.barChartData.datasets[0].data = [
          stats.documents.pending,
          stats.conges.pending,
          stats.avances.pending,
          stats.formations.pending
        ];

        this.barChartData.datasets[1].data = [
          stats.documents.processed,
          stats.conges.processed,
          stats.avances.processed,
          stats.formations.processed
        ];

        // Update pie chart data
        this.pieChartData.datasets[0].data = [
          pieStats.documents,
          pieStats.conges,
          pieStats.avances,
          pieStats.formations
        ];

        // Process documents types
        if (response.demandes) {
          const documentTypes = {
            attestation: 0,
            fiche_paie: 0,
            attestation_de_stage: 0
          };
          
          response.demandes.forEach((doc: any) => {
            if (documentTypes.hasOwnProperty(doc.type)) {
              documentTypes[doc.type as keyof typeof documentTypes]++;
            }
          });
          
          this.categoryCharts.documents.data.datasets[0].data = Object.values(documentTypes);
        }

        // Process conges types
        if (response.conges) {
          const congeTypes = {
            annuel: 0,
            maladie: 0,
            sans_solde: 0,
            maternité: 0,
            paternité: 0
          };
          
          response.conges.forEach((conge: any) => {
            if (congeTypes.hasOwnProperty(conge.type)) {
              congeTypes[conge.type as keyof typeof congeTypes]++;
            }
          });
          
          this.categoryCharts.conges.data.datasets[0].data = Object.values(congeTypes);
        }

        // Process avances types
        if (response.avances) {
          const avanceTypes = {
            pret: 0,
            avance: 0
          };
          
          response.avances.forEach((avance: any) => {
            if (avanceTypes.hasOwnProperty(avance.type)) {
              avanceTypes[avance.type as keyof typeof avanceTypes]++;
            }
          });
          
          this.categoryCharts.avances.data.datasets[0].data = Object.values(avanceTypes);
        }

        // Process formations types
        if (response.formations) {
          const formationTypes = {
            internal: 0,
            external: 0
          };
          
          response.formations.forEach((formation: any) => {
            if (formationTypes.hasOwnProperty(formation.type)) {
              formationTypes[formation.type as keyof typeof formationTypes]++;
            }
          });
          
          this.categoryCharts.formations.data.datasets[0].data = Object.values(formationTypes);
        }

        // Process documents
        if (response.demandes) {
          response.demandes.forEach((doc: any) => {
            const index = this.getDocumentIndex(doc.type);
            if (index !== -1) {
              this.updateChartData(index, doc.status);
            }
          });
        }

        // Process conges
        if (response.conges) {
          response.conges.forEach((conge: any) => {
            const index = this.getCongeIndex(conge.type);
            if (index !== -1) {
              this.updateChartData(index, conge.status);
            }
          });
        }

        // Process avances
        if (response.avances) {
          response.avances.forEach((avance: any) => {
            const index = this.getAvanceIndex(avance.type);
            if (index !== -1) {
              this.updateChartData(index, avance.status);
            }
          });
        }

        // Process formations
        if (response.formations) {
          response.formations.forEach((formation: any) => {
            const index = this.getFormationIndex(formation.type);
            if (index !== -1) {
              this.updateChartData(index, formation.status);
            }
          });
        }

        this.isLoading = false; // Set loading to false after data is processed
      },
      error: (error) => {
        console.error('Error loading requests:', error);
        this.isLoading = false; // Don't forget to set loading to false on error
      }
    });
  }

  private getDocumentIndex(type: string): number {
    switch(type) {
      case 'attestation': return 0;
      case 'fiche_paie': return 1;
      case 'attestation_de_stage': return 2;
      default: return -1;
    }
  }

  private getCongeIndex(type: string): number {
    switch(type) {
      case 'annuel': return 3;
      case 'maladie': return 4;
      case 'sans_solde': return 5;
      case 'maternité': return 6;
      case 'paternité': return 7;
      default: return -1;
    }
  }

  private getAvanceIndex(type: string): number {
    switch(type) {
      case 'pret': return 8;
      case 'avance': return 9;
      default: return -1;
    }
  }

  private getFormationIndex(type: string): number {
    switch(type) {
      case 'internal': return 10;
      case 'external': return 11;
      default: return -1;
    }
  }

  private updateChartData(index: number, status: string) {
    // Convert status to lowercase and normalize accents for comparison
    const normalizedStatus = status?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    switch(normalizedStatus) {
      case 'approuve':
      case 'approuvé':
        this.combinedChart.data.datasets[0].data[index]++;
        break;
      case 'refuse':
      case 'refusé':
        this.combinedChart.data.datasets[1].data[index]++;
        break;
      case 'en attente':
        this.combinedChart.data.datasets[2].data[index]++;
        break;
    }
  }

  private getCategoryFromType(type: string): string {
    switch (type?.toLowerCase()) {
      case 'attestation':
      case 'attestation':
        return 'documents';
      case 'attestation_de_stage':
        return 'documents';
      case 'conge':
      case 'conges':
        return 'conges';
      case 'fiche_paie':
      case 'fiche_de_paie':
        return 'documents';
      case 'avance':
        return 'avances';
      case 'formation':
        return 'formations';
      case 'autre':
        return 'documents';
      default:
        return 'documents';
    }
  }
}
