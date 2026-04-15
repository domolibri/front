import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Dashboard } from './dashboard';
import { AuthService } from '../../shared/auth.service';
import { UserService } from '../../shared/user.service';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            currentUser: { brandingConfigurado: false },
            currentUser$: of({ nome: 'Admin', nomeEditora: 'Editora Teste' }),
          },
        },
        {
          provide: UserService,
          useValue: {
            getRoles: vi.fn().mockReturnValue(of([])),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
