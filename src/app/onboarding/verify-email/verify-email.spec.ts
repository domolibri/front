import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { VerifyEmail } from './verify-email';
import { Onboarding } from '../../services/onboarding';
import { AuthService } from '../../shared/auth.service';

describe('VerifyEmail', () => {
  let component: VerifyEmail;
  let fixture: ComponentFixture<VerifyEmail>;
  let onboardingMock: { verifyEmail: ReturnType<typeof vi.fn> };
  let authMock: { checkSession: ReturnType<typeof vi.fn> };
  let routerNavigateSpy: ReturnType<typeof vi.fn>;

  // Mutable params: update before calling fixture.detectChanges() in each test.
  let mockParams: Record<string, string | null>;

  const mockRoute = {
    get snapshot() {
      return {
        queryParamMap: {
          get: (key: string) => mockParams[key] ?? null,
        },
      };
    },
  };

  beforeEach(async () => {
    // Default: valid params + success response
    mockParams = { email: 'user@test.com', token: 'tok123' };
    onboardingMock = { verifyEmail: vi.fn().mockReturnValue(of({ message: 'Verificado' })) };
    authMock = { checkSession: vi.fn().mockReturnValue(of(true)) };

    await TestBed.configureTestingModule({
      imports: [VerifyEmail],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: Onboarding, useValue: onboardingMock },
        { provide: AuthService, useValue: authMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VerifyEmail);
    component = fixture.componentInstance;
    routerNavigateSpy = vi.spyOn(component['router'], 'navigate').mockImplementation(() => Promise.resolve(true));
    // NOTE: detectChanges() intentionally NOT called here so each test controls when ngOnInit runs.
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── Missing query params ─────────────────────────────────────────────────

  describe('when email param is missing', () => {
    it('should navigate to verify-email-failed with "invalid link" message', () => {
      mockParams = { email: '', token: 'tok123' };
      fixture.detectChanges();
      expect(routerNavigateSpy).toHaveBeenCalledWith(['/onboarding/verify-email-failed'], {
        queryParams: { detail: 'Link de verificação inválido ou incompleto.' },
      });
    });

    it('should NOT call verifyEmail', () => {
      mockParams = { email: '', token: 'tok123' };
      fixture.detectChanges();
      expect(onboardingMock.verifyEmail).not.toHaveBeenCalled();
    });
  });

  describe('when token param is missing', () => {
    it('should navigate to verify-email-failed with "invalid link" message', () => {
      mockParams = { email: 'user@test.com', token: '' };
      fixture.detectChanges();
      expect(routerNavigateSpy).toHaveBeenCalledWith(['/onboarding/verify-email-failed'], {
        queryParams: { detail: 'Link de verificação inválido ou incompleto.' },
      });
    });

    it('should NOT call verifyEmail', () => {
      mockParams = { email: 'user@test.com', token: '' };
      fixture.detectChanges();
      expect(onboardingMock.verifyEmail).not.toHaveBeenCalled();
    });
  });

  describe('when both params are missing', () => {
    it('should navigate to verify-email-failed', () => {
      mockParams = { email: '', token: '' };
      fixture.detectChanges();
      expect(routerNavigateSpy).toHaveBeenCalledWith(
        ['/onboarding/verify-email-failed'],
        expect.objectContaining({ queryParams: expect.objectContaining({ detail: expect.any(String) }) }),
      );
    });
  });

  // ─── Success path ─────────────────────────────────────────────────────────

  describe('on successful email verification', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should call verifyEmail with the correct params', () => {
      fixture.detectChanges();
      expect(onboardingMock.verifyEmail).toHaveBeenCalledWith('user@test.com', 'tok123');
    });

    it('should set status to "success"', () => {
      fixture.detectChanges();
      expect(component.status).toBe('success');
    });

    it('should call auth.checkSession() on successful verification', () => {
      fixture.detectChanges();
      expect(authMock.checkSession).toHaveBeenCalled();
    });

    it('should initialise countdown at 3', () => {
      fixture.detectChanges();
      expect(component.countdown).toBe(3);
    });

    it('should decrement countdown to 2 after 1 second', () => {
      fixture.detectChanges();
      vi.advanceTimersByTime(1000);
      expect(component.countdown).toBe(2);
    });

    it('should decrement countdown to 1 after 2 seconds', () => {
      fixture.detectChanges();
      vi.advanceTimersByTime(2000);
      expect(component.countdown).toBe(1);
    });

    it('should navigate to /dashboard when countdown reaches 0', () => {
      fixture.detectChanges();
      vi.advanceTimersByTime(3000);
      expect(routerNavigateSpy).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should NOT navigate to failure on success', () => {
      fixture.detectChanges();
      expect(routerNavigateSpy).not.toHaveBeenCalledWith(
        ['/onboarding/verify-email-failed'],
        expect.anything(),
      );
    });
  });

  // ─── API error paths ──────────────────────────────────────────────────────

  describe('when verifyEmail returns an error with a detail field', () => {
    beforeEach(() => {
      onboardingMock.verifyEmail.mockReturnValue(throwError(() => ({ error: { detail: 'Token expirado.' } })));
    });

    it('should navigate to verify-email-failed with the error detail', () => {
      fixture.detectChanges();
      expect(routerNavigateSpy).toHaveBeenCalledWith(['/onboarding/verify-email-failed'], {
        queryParams: { detail: 'Token expirado.' },
      });
    });

    it('should NOT call auth.checkSession', () => {
      fixture.detectChanges();
      expect(authMock.checkSession).not.toHaveBeenCalled();
    });
  });

  describe('when verifyEmail returns an error without a detail field', () => {
    beforeEach(() => {
      onboardingMock.verifyEmail.mockReturnValue(throwError(() => ({})));
    });

    it('should navigate to verify-email-failed with the default fallback message', () => {
      fixture.detectChanges();
      expect(routerNavigateSpy).toHaveBeenCalledWith(['/onboarding/verify-email-failed'], {
        queryParams: {
          detail: 'Não foi possível verificar o seu e-mail. O link pode ter expirado.',
        },
      });
    });
  });

  // ─── ngOnDestroy() ────────────────────────────────────────────────────────

  describe('ngOnDestroy()', () => {
    it('should call clearInterval when countdown is running', () => {
      vi.useFakeTimers();
      fixture.detectChanges();
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
      component.ngOnDestroy();
      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should NOT throw when countdown was never started (error path)', () => {
      onboardingMock.verifyEmail.mockReturnValue(throwError(() => ({})));
      fixture.detectChanges();
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should stop timer ticks after destroy', () => {
      vi.useFakeTimers();
      fixture.detectChanges();
      const countdownBefore = component.countdown;
      component.ngOnDestroy();
      vi.advanceTimersByTime(5000);
      // Countdown should not have changed after destroy
      expect(component.countdown).toBe(countdownBefore);
    });
  });
});
