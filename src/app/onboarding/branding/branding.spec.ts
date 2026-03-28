import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Branding } from './branding';

describe('Branding', () => {
  let component: Branding;
  let fixture: ComponentFixture<Branding>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Branding],
    }).compileComponents();

    fixture = TestBed.createComponent(Branding);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
