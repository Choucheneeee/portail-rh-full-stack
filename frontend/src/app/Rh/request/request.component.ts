import { Component, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Subscription, Subject } from 'rxjs';
import { ServiceRHService } from '../service-rh.service';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../service/socket.service';
import { ToastrService } from 'ngx-toastr';

// Update the interface for the request types
interface RequestsData {
  avances: any[];
  conges: any[];
  demandes: any[];
  formations: any[];
}

// Add this interface near the top of the file
interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  status: {
    pending: string[];
    approved: string[];
    rejected: string[];
  };
}

@Component({
  selector: 'app-request',
  standalone: true,
  templateUrl: './request.component.html',
  imports: [CommonModule, FormsModule],
  styleUrls: ['./request.component.css'],
  providers: [ServiceRHService, SocketService, ToastrService],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class RequestComponent implements OnInit, OnChanges, OnDestroy {
  private unsubscribe$ = new Subject<void>();
  reqobserv!: Subscription;
  requpdate!: Subscription;
  deleteobserv!: Subscription;
  sentnotifobs!: Subscription;
  showSuccessAlert = false;
  showErrorAlert = false;
  showWarningAlert = false;
  successMessage = '';
  errorMessage = '';
  warningMessage = '';
  document: RequestsData = {
    avances: [],
    conges: [],
    demandes: [],
    formations: []
  };
  isLoading = false;
  notifs: string[] = [];
  newnotif: string = '';
  filteredRequests: any[] = [];

  tableHeaders: { label: string; key: keyof any }[] = [
    { label: 'Type de requête', key: 'type' },
    { label: 'Prénom', key: 'firstName' },
    { label: 'Nom', key: 'lastName' },
    { label: 'Type de document', key: 'documentType' },
    { label: 'Statut', key: 'status' },
    { label: 'Date de création', key: 'createdAt' }
  ];

  // Add color scheme configuration
  colors: ColorScheme = {
    primary: 'indigo',    // Changed from blue
    secondary: 'emerald', // Changed from green
    accent: 'violet',     // New accent color
    status: {
      pending: ['amber', 'orange'],     // Two-tone gradients
      approved: ['emerald', 'teal'],    // Two-tone gradients
      rejected: ['rose', 'red']         // Two-tone gradients
    }
  };

  selectedRequest: any = null;

  constructor(private share: ServiceRHService, private socketService: SocketService) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.ngOnInit();
  }

  ngOnDestroy(): void {

    
  }

  loadRequests(): void {
    this.isLoading = true;
    this.reqobserv = this.share.getAllRequests().subscribe({
      next: (data: RequestsData) => {
        this.document = data;
        this.filterRequests(); // Apply initial filtering
        this.isLoading = false;
        console.log("Loaded requests:", this.document);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading requests:', error);
      }
    });
  }

  filterRequests(): void {
    let filtered: any[] = [];

    switch (this.search.type) {
      case 'Document':
        filtered = this.document.demandes || [];
        if (this.search.documentType) {
          filtered = filtered.filter(req => req.type === this.search.documentType);
        }
        break;
      case 'Formation':
        filtered = this.document.formations || [];
        break;
      case 'Congé':
        filtered = this.document.conges || [];
        break;
      case 'Avance':
        filtered = this.document.avances || [];
        break;
      default:
        // Combine all requests when no filter is selected
        filtered = [
          ...(this.document.demandes || []),
          ...(this.document.formations || []),
          ...(this.document.conges || []),
          ...(this.document.avances || [])
        ];
    }

    // Apply status filter if selected
    if (this.search.status) {
      filtered = filtered.filter(req => req.status === this.search.status);
    }

    // Apply name search if entered
    if (this.search.name) {
      const searchTerm = this.search.name.toLowerCase();
      filtered = filtered.filter(req => 
        req.firstName?.toLowerCase().includes(searchTerm) ||
        req.lastName?.toLowerCase().includes(searchTerm) ||
        req.matricule?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply date range filter if selected
    if (this.search.startDate) {
      const startDate = new Date(this.search.startDate);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(req => {
        const createdAt = new Date(req.createdAt);
        return createdAt >= startDate;
      });
    }
    
    if (this.search.endDate) {
      const endDate = new Date(this.search.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(req => {
        const createdAt = new Date(req.createdAt);
        return createdAt <= endDate;
      });
    }

    this.filteredRequests = filtered;
    console.log("this.filteredRequests", this.filteredRequests);
  }

  sortKey: keyof any = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'asc';

  // Update the acceptRequest method
  acceptRequest(requestId: string): void {
    const request = this.findRequestById(requestId);
    if (!request) {
      this.showError('La demande est introuvable');
      return;
    }
  
    if (request.status === 'Approuvé') {
      this.showWarning('Cette demande a déjà été approuvée');
      return;
    }
  
    if (request.status === 'Refusé') {
      this.showWarning('Une demande refusée ne peut pas être approuvée');
      return;
    }
  
    // Add confirmation dialog
    if (confirm(`Êtes-vous sûr de vouloir approuver la demande de ${request.firstName} ${request.lastName} ?`)) {
      this.isLoading = true;
      this.requpdate = this.share.updateRequest(requestId, 'Approuvé', request.type).subscribe({
        next: (data: any) => {
          this.showSuccess(`La demande de ${request.firstName} ${request.lastName} a été approuvée avec succès`);
          this.sendNotification(request, 'Approuvé');
          this.loadRequests();
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.showError('Une erreur est survenue lors de l\'approbation de la demande');
          console.error('Error approving request:', error);
        }
      });
    }
  }
  
  private findRequestById(requestId: string): any {
    return (
      this.document.demandes?.find(r => r._id === requestId) ||
      this.document.formations?.find(r => r._id === requestId) ||
      this.document.conges?.find(r => r._id === requestId) ||
      this.document.avances?.find(r => r._id === requestId)
    );
  }

  // Update the declineRequest method
  declineRequest(requestId: string): void {
    const request = this.findRequestById(requestId);
    if (!request) {
      this.showError('La demande est introuvable');
      return;
    }
  
    if (request.status === 'Refusé') {
      this.showWarning('Cette demande a déjà été refusée');
      return;
    }
  
    if (request.status === 'Approuvé') {
      this.showWarning('Une demande approuvée ne peut pas être refusée');
      return;
    }
  
    // Add confirmation dialog
    if (confirm(`Êtes-vous sûr de vouloir refuser la demande de ${request.firstName} ${request.lastName} ?`)) {
      this.isLoading = true;
      this.requpdate = this.share.updateRequest(requestId, 'Refusé', request.type).subscribe({
        next: (data: any) => {
          this.showWarning(`La demande de ${request.firstName} ${request.lastName} a été refusée`);
          this.sendNotification(request, 'Refusé');
          this.loadRequests();
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.showError('Une erreur est survenue lors du refus de la demande');
          console.error('Error declining request:', error);
        }
      });
    }
  }
  
  // Update the deleteRequest method
  deleteRequest(requestId: string): void {
    const request = this.findRequestById(requestId);
    if (!request) {
      this.showError('La demande est introuvable');
      return;
    }
  
    // Add confirmation before delete
    if (confirm(`Êtes-vous sûr de vouloir supprimer cette demande de ${request.firstName} ${request.lastName} ?`)) {
      this.isLoading = true;
      this.deleteobserv = this.share.deleteRequest(requestId, request.type).subscribe({
        next: () => {
          this.showError(`La demande de ${request.firstName} ${request.lastName} a été supprimée avec succès`);
          this.loadRequests();
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.showError('Une erreur est survenue lors de la suppression de la demande');
          console.error('Error deleting request:', error);
        }
      });
    }
  }
  
  
  
  private sendNotification(request: any, status: string): void {
    let endpoint: string;
    const requestType = request.type ? request.type.toLowerCase() : '';

    if (requestType === 'internal' || requestType === 'external') {
      endpoint = 'Formation';
    } else if (['annuel', 'maladie', 'sans_solde', 'maternité', 'paternité'].includes(requestType)) {
      endpoint = 'Congé';
    } else if (requestType === 'pret' || requestType === 'avance') {
      endpoint = 'Avance';
    } else if (['attestation', 'fiche_paie', 'attestation_de_stage'].includes(requestType)) {
      endpoint = 'Document';
    } else {
      endpoint = ''; // default case
    }
    const formattedDate = new Date(request.createdAt).toLocaleDateString('fr-FR');
    const message = `Bonjour ${request.firstName} ${request.lastName}, votre demande de ${endpoint}  soumise le ${formattedDate} a été ${status.toLowerCase()}. Consultez les détails dans votre compte.`;

    this.socketService.emit('notif', {
      message: message,
      targetUserId: request.user
    });

    const sub = this.share.sentnotif(message, request.user).subscribe();
    this.sentnotifobs = sub;
  }

  sortData(column: keyof any) {
    if (this.sortKey === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = column;
      this.sortOrder = column === 'createdAt' ? 'desc' : 'asc'; // Default to 'desc' for createdAt
    }

    const sortFunction = (a: any, b: any) => {
      let valueA = a[this.sortKey];
      let valueB = b[this.sortKey];

      if (this.sortKey === 'createdAt' || this.sortKey === 'updatedAt') {
        valueA = new Date(a[this.sortKey]).getTime();
        valueB = new Date(b[this.sortKey]).getTime();
      }

      if (valueA < valueB) {
        return this.sortOrder === 'asc' ? -1 : 1;
      } else if (valueA > valueB) {
        return this.sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    };

    // Apply sorting to all request types
    if (this.document.demandes) {
      this.document.demandes = [...this.document.demandes].sort(sortFunction);
    }
    if (this.document.formations) {
      this.document.formations = [...this.document.formations].sort(sortFunction);
    }
    if (this.document.conges) {
      this.document.conges = [...this.document.conges].sort(sortFunction);
    }
    if (this.document.avances) {
      this.document.avances = [...this.document.avances].sort(sortFunction);
    }

    // Apply sorting to filtered requests
    this.filteredRequests = [...this.filteredRequests].sort(sortFunction);
  }
  
  // Ensure the getSortIcon method is properly defined
  getSortIcon(column: keyof any): string {
    if (this.sortKey !== column) {
      return '';
    }
    return this.sortOrder === 'asc' ? '↑' : '↓';
  }

  search = {
    name: '',
    type: '' as '' | 'Document' | 'Formation' | 'Congé' | 'Avance',
    documentType: '',
    status: '',
    startDate: '',
    endDate: ''
  };

  documentTypes = {
    "Document": [
      "Attestation de travail",
      "fiche_paie",
      "attestation_de_stage",
    ]
  };

  filteredDocumentTypes: string[] = [];
  getRequestCount(type: 'Document' | 'Formation' | 'Congé' | 'Avance'): number {
    switch (type) {
      case 'Document':
        return this.document.demandes?.length || 0;
      case 'Formation':
        return this.document.formations?.length || 0;
      case 'Congé':
        return this.document.conges?.length || 0;
      case 'Avance':
        return this.document.avances?.length || 0;
      default:
        return 0;
    }
  }


  ontypeChange(): void {
    // Update document types for Document requests
    if (this.search.type === 'Document') {
      this.filteredDocumentTypes = this.documentTypes['Document'];
    } else {
      this.filteredDocumentTypes = [];
      this.search.documentType = '';
    }
    this.filterRequests();
  }

  isAdmin = true; // Set this based on your auth logic

  // Update the existing canDeleteRequest method to use new colors
  canDeleteRequest(request: any): boolean {
    return this.isAdmin && request.status === 'Approuvé' || request.status === 'Refusé';
  }

  canManageRequest(request: any): boolean {
    // Only show approve/decline buttons for pending requests
    return request.status === 'En attente';
  }

  // Add helper method for getting gradient classes
  getStatusGradient(status: string): string {
    switch (status) {
      case 'En attente':
        return `bg-gradient-to-r from-${this.colors.status.pending[0]}-400 to-${this.colors.status.pending[1]}-500`;
      case 'Approuvé':
        return `bg-gradient-to-r from-${this.colors.status.approved[0]}-400 to-${this.colors.status.approved[1]}-500`;
      case 'Refusé':
        return `bg-gradient-to-r from-${this.colors.status.rejected[0]}-400 to-${this.colors.status.rejected[1]}-500`;
      default:
        return 'bg-gray-200';
    }
  }

  getStatusBadgeColors(status: string): string {
    switch (status) {
      case 'En attente':
        return `bg-${this.colors.status.pending[0]}-50 text-${this.colors.status.pending[0]}-700 ring-1 ring-${this.colors.status.pending[0]}-600/20`;
      case 'Approuvé':
        return `bg-${this.colors.status.approved[0]}-50 text-${this.colors.status.approved[0]}-700 ring-1 ring-${this.colors.status.approved[0]}-600/20`;
      case 'Refusé':
        return `bg-${this.colors.status.rejected[0]}-50 text-${this.colors.status.rejected[0]}-700 ring-1 ring-${this.colors.status.rejected[0]}-600/20`;
      default:
        return 'bg-gray-100 text-gray-700 ring-1 ring-gray-600/20';
    }
  }

  // Add helper method for getting request type colors
  gettypeColors(type: string): string {
    switch (type) {
      case 'Document':
        return `bg-gradient-to-br from-${this.colors.primary}-50 via-${this.colors.primary}-100 to-${this.colors.primary}-50 text-${this.colors.primary}-600`;
      case 'Formation':
        return `bg-gradient-to-br from-${this.colors.accent}-50 via-${this.colors.accent}-100 to-${this.colors.accent}-50 text-${this.colors.accent}-600`;
      case 'Congé':
        return `bg-gradient-to-br from-${this.colors.secondary}-50 via-${this.colors.secondary}-100 to-${this.colors.secondary}-50 text-${this.colors.secondary}-600`;
      case 'Avance':
        return `bg-gradient-to-br from-amber-50 via-amber-100 to-amber-50 text-amber-600`;
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  getRequestMainType(type: string): string {
    if (['fiche_paie', 'attestation', 'attestation_de_stage'].includes(type?.toLowerCase())) {
      return 'Document';
    } else if (['internal', 'external'].includes(type?.toLowerCase())) {
      return 'Formation';
    } else if (['annuel', 'maladie', 'sans_solde', 'maternité', 'paternité'].includes(type?.toLowerCase())) {
      return 'Congé';
    } else if (['pret', 'avance'].includes(type?.toLowerCase())) {
      return 'Avance';
    }
    return 'Autre';
  }

  viewRequestDetails(request: any) {
    this.selectedRequest = request;
  }

  closeRequestDetails() {
    this.selectedRequest = null;
  }

  showSuccess(message: string) {
    this.successMessage = message;
    this.showSuccessAlert = true;
    setTimeout(() => this.closeSuccessAlert(), 5000);
  }

  showError(message: string) {
    this.errorMessage = message;
    this.showErrorAlert = true;
    setTimeout(() => this.closeErrorAlert(), 5000);
  }

  showWarning(message: string) {
    this.warningMessage = message;
    this.showWarningAlert = true;
    setTimeout(() => this.closeWarningAlert(), 5000);
  }

  closeSuccessAlert() {
    this.showSuccessAlert = false;
  }

  closeErrorAlert() {
    this.showErrorAlert = false;
  }

  closeWarningAlert() {
    this.showWarningAlert = false;
  }

}
