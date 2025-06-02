import { TestBed } from '@angular/core/testing';

import { ServiceRHService } from './service-rh.service';

describe('ServiceAdminService', () => {
  let service: ServiceRHService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiceRHService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
