import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvanceComponent } from './avance.component';

describe('AvanceComponent', () => {
  let component: AvanceComponent;
  let fixture: ComponentFixture<AvanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvanceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AvanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
