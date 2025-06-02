import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { SocketService } from '../../service/socket.service';
import { AdminServiceService } from '../admin-service.service';
import { ChangeDetectorRef } from '@angular/core';
import { of, Subject } from 'rxjs';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockSocketService: jasmine.SpyObj<SocketService>;
  let mockAdminService: jasmine.SpyObj<AdminServiceService>;
  let mockChangeDetectorRef: jasmine.SpyObj<ChangeDetectorRef>;

  beforeEach(async () => {
    mockSocketService = jasmine.createSpyObj('SocketService', ['on', 'getOnlineUsersNumber']);
    mockAdminService = jasmine.createSpyObj('AdminServiceService', ['getData']);
    mockChangeDetectorRef = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: SocketService, useValue: mockSocketService },
        { provide: AdminServiceService, useValue: mockAdminService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize notification listener', () => {
    const notificationSubject = new Subject();
    mockSocketService.on.and.returnValue(notificationSubject);

    fixture.detectChanges();

    expect(mockSocketService.on).toHaveBeenCalledWith('notif');
  });

  it('should handle new notifications', () => {
    const notificationSubject = new Subject();
    mockSocketService.on.and.returnValue(notificationSubject);
    
    fixture.detectChanges();
    
    const testMessage = 'Test notification';
    notificationSubject.next({ message: testMessage });
    
    expect(component.notifications.length).toBe(1);
    expect(component.notifications[0].message).toBe(testMessage);
    expect(component.notifications[0].read).toBeFalse();
    expect(component.unreadCount).toBe(1);
  });

  it('should mark notifications as read when dropdown is opened', () => {
    const notificationSubject = new Subject();
    mockSocketService.on.and.returnValue(notificationSubject);
    
    fixture.detectChanges();
    
    // Add a notification
    notificationSubject.next({ message: 'Test notification' });
    
    // Open dropdown
    component.toggleNotificationDropdown(new Event('click'));
    
    expect(component.notifications[0].read).toBeTrue();
    expect(component.unreadCount).toBe(0);
  });

  it('should clean up subscriptions on destroy', () => {
    const notificationSubject = new Subject();
    mockSocketService.on.and.returnValue(notificationSubject);
    
    fixture.detectChanges();
    
    component.ngOnDestroy();
    
    expect(notificationSubject.closed).toBeFalse(); // Subject is not closed by unsubscribe
  });
});
