// src/app/admin/logs-activities/activities.component.ts
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

export interface LogEntry {
  id: number;
  timestamp: Date;
  user: string;
  eventType: string;
  description: string;
  severity: 'info' | 'warning' | 'error';
  ipAddress: string;
  userAgent: string;
  additionalInfo?: any;
}

export interface LogsResponse {
  logs: LogEntry[];
  totalItems: number;
  totalPages: number;
}

@Component({
  selector: 'app-activities',
  imports: [CommonModule, FormsModule],
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.css']
})
export class ActivitiesComponent implements OnInit {
  @ViewChild('activityChart') private chartRef!: ElementRef;
  private chart: any;
  // Mock data
  private mockLogs: LogEntry[] = [
    {
      id: 1,
      timestamp: new Date('2024-03-15T10:00:00'),
      user: 'admin@example.com',
      eventType: 'login',
      description: 'User logged in successfully',
      severity: 'info',
      ipAddress: '192.168.1.1',
      userAgent: 'Chrome/120.0.0.0',
      additionalInfo: { location: 'Paris, FR' }
    },
    {
      id: 2,
      timestamp: new Date('2024-03-14T15:30:00'),
      user: 'user@example.com',
      eventType: 'user',
      description: 'User profile updated',
      severity: 'warning',
      ipAddress: '10.0.0.1',
      userAgent: 'Firefox/115.0'
    },
    {
      id: 3,
      timestamp: new Date('2024-03-13T09:15:00'),
      user: 'system',
      eventType: 'system',
      description: 'Database backup completed',
      severity: 'info',
      ipAddress: '127.0.0.1',
      userAgent: 'Node.js'
    },
    {
      id: 4,
      timestamp: new Date('2024-03-12T14:20:00'),
      user: 'admin@example.com',
      eventType: 'approval',
      description: 'Document approval rejected',
      severity: 'error',
      ipAddress: '192.168.1.1',
      userAgent: 'Chrome/120.0.0.0',
      additionalInfo: { documentId: 4456 }
    }
  ];

  // Component state
  logEntries: LogEntry[] = [];
  currentPage = 1;
  totalPages = 1;
  pages: number[] = [];
  showLogModal = false;
  selectedLog: LogEntry | null = null;
  
  // Filter properties
  selectedDateRange = 'week';
  startDate?: string;
  endDate?: string;
  selectedEventType = 'all';
  selectedSeverity = 'all';
  activeTab = 'all';

  constructor() {
    this.loadLogs();
    this.generatePageNumbers();
  }

  // Initial load of logs
  

  // Pagination controls
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadLogs();
    }
  }

  generatePageNumbers(): void {
    this.pages = Array.from({length: this.totalPages}, (_, i) => i + 1);
  }

  // Filter controls
  applyFilters(): void {
    this.currentPage = 1;
    this.loadLogs();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.loadLogs();
  }

  // Refresh and export
  refreshLogs(): void {
    this.loadLogs();
  }

  viewDetails(log: LogEntry): void {
    this.selectedLog = log;
    this.showLogModal = true;
  }

  closeModal(): void {
    this.showLogModal = false;
    this.selectedLog = null;
  }

  // Data fetching
  getLogs(
    page: number = 1,
    pageSize: number = 10,
    tab: string = 'all',
    dateRange: string = 'week',
    startDate?: string,
    endDate?: string,
    eventType: string = 'all',
    severity: string = 'all'
  ): Observable<LogsResponse> {
    // Filter simulation
    let filtered = this.mockLogs.filter(log => {
      const matchesTab = tab === 'all' || 
        (tab === 'users' && log.eventType === 'user') ||
        (tab === 'system' && log.eventType === 'system') ||
        (tab === 'security' && log.eventType === 'login');
      
      const matchesEventType = eventType === 'all' || log.eventType === eventType;
      const matchesSeverity = severity === 'all' || log.severity === severity;
      
      return matchesTab && matchesEventType && matchesSeverity;
    });

    // Pagination simulation
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginated = filtered.slice(startIndex, endIndex);

    return of({
      logs: paginated,
      totalItems: filtered.length,
      totalPages: Math.ceil(filtered.length / pageSize)
    });
  }

  exportLogs(): void {
    console.log('Export functionality mocked');
    // Add CSV export logic here if needed
  }

  ngOnInit() {
    Chart.register(...registerables);
    this.loadLogs();
    this.generatePageNumbers();
    this.initChart();
  }

  private initChart(): void {
    const ctx = this.chartRef.nativeElement.getContext('2d');
    
    // Group activities by type
    const activityCounts = this.mockLogs.reduce((acc: any, log) => {
      acc[log.eventType] = (acc[log.eventType] || 0) + 1;
      return acc;
    }, {});

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(activityCounts),
        datasets: [{
          label: 'Activités par type',
          data: Object.values(activityCounts),
          backgroundColor: [
            'rgba(75, 192, 192, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(255, 99, 132, 0.2)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(255, 99, 132, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  // Update chart when data changes
  private updateChart(): void {
    if (this.chart) {
      const activityCounts = this.logEntries.reduce((acc: any, log) => {
        acc[log.eventType] = (acc[log.eventType] || 0) + 1;
        return acc;
      }, {});

      this.chart.data.labels = Object.keys(activityCounts);
      this.chart.data.datasets[0].data = Object.values(activityCounts);
      this.chart.update();
    }
  }

  // Update loadLogs to refresh chart
  loadLogs(): void {
    this.getLogs(
      this.currentPage,
      10,
      this.activeTab,
      this.selectedDateRange,
      this.startDate,
      this.endDate,
      this.selectedEventType,
      this.selectedSeverity
    ).subscribe(response => {
      this.logEntries = response.logs;
      this.totalPages = response.totalPages;
      this.generatePageNumbers();
      this.updateChart();
    });
  }
}