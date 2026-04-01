import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { Login } from './login';
import { Onboarding, EmailNotVerifiedError } from '../../services/onboarding';
import { AuthService } from '../../shared/auth.service';
import { SnackbarService } from '../../shared/snackbar.service';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let onboardingMock: { login: ReturnType<typeof vi.fn>; resendVerificationEmail: ReturnType<typeof vi.fn> };
  let authMock: { setAuthenticated: ReturnType<typeof vi.fn> };
  let snackbarMock: { show: ReturnType<typeof vi.fn> };
  let routerNavigateSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    onboardingMock = {
      login: vi.fn().mockReturnValue(of({ token: 'tok', message: 'OK' })),
      resendVerificationEmail: vi.fn().mockReturnValue(of({ message: 'Reenviado' })),
    };
    authMock = { setAuthenticated: vi.fn() };
    snackbarMock = { show: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: Onboarding, useValue: onboardingMock },
        { provide: AuthService, useValue: authMock },
        { provide: SnackbarService, useValue: snackbarMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    routerNavigateSpy = vi.spyOn(component['router'], 'navigate').mockImplementation(() => Promise.resolve(true));
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── Form initialization ──────────────────────────────────────────────────

  describe('form', () => {
    it('should have email and senha controls', () => {
      expect(component.form.get('email')).toBeTruthy();
      expect(component.form.get('senha')).toBeTruthy();
    });

    it('email should be invalid when empty', () => {
      component.f['email'].setValue('');
      expect(component.f['email'].valid).toBe(false);
    });

    it('email should be invalid with bad format', () => {
      component.f['email'].setValue('notanemail');
      expect(component.f['email'].valid).toBe(false);
    });

    it('email should be valid with proper format', () => {
      component.f['email'].setValue('user@test.com');
      expect(component.f['email'].valid).toBe(true);
    });

    it('senha should be invalid when empty', () => {
      component.f['senha'].setValue('');
      expect(component.f['senha'].valid).toBe(false);
    });

    it('senha should be valid when non-empty', () => {
      component.f['senha'].setValue('anypassword');
      expect(component.f['senha'].valid).toBe(true);
    });
  });

  // ─── onSubmit() ───────────────────────────────────────────────────────────

  describe('onSubmit()', () => {
    describe('when form is invalid', () => {
      it('should call markAllAsTouched', () => {
        const spy = vi.spyOn(component.form, 'markAllAsTouched');
        component.onSubmit();
        expect(spy).toHaveBeenCalled();
      });

      it('should NOT call onboarding.login', () => {
        component.onSubmit();
        expect(onboardingMock.login).not.toHaveBeenCalled();
      });
    });

    describe('when form is valid and login succeeds', () => {
      beforeEach(() => {
        component.f['email'].setValue('user@test.com');
        component.f['senha'].setValue('senha123');
      });

      it('should call login with form values', () => {
        component.onSubmit();
        expect(onboardingMock.login).toHaveBeenCalledWith('user@test.com', 'senha123');
      });

      it('should call auth.setAuthenticated(true)', () => {
        component.onSubmit();
        expect(authMock.setAuthenticated).toHaveBeenCalledWith(true);
      });

      it('should navigate to /dashboard', () => {
        component.onSubmit();
        expect(routerNavigateSpy).toHaveBeenCalledWith(['/dashboard']);
      });

      it('should set isLoading to false', () => {
        component.onSubmit();
        expect(component.isLoading).toBe(false);
      });

      it('should clear errorMessage and emailNotVerified before the request', () => {
        component.errorMessage = 'old error';
        component.emailNotVerified = true;
        component.resendSuccess = true;
        component.resendError = 'old';
        component.onSubmit();
        expect(component.errorMessage).toBe('');
        expect(component.emailNotVerified).toBe(false);
        expect(component.resendSuccess).toBe(false);
        expect(component.resendError).toBe('');
      });
    });

    describe('when login returns EmailNotVerifiedError', () => {
      beforeEach(() => {
        onboardingMock.login.mockReturnValue(throwError(() => new EmailNotVerifiedError()));
        component.f['email'].setValue('user@test.com');
        component.f['senha'].setValue('senha123');
      });

      it('should set emailNotVerified to true', () => {
        component.onSubmit();
        expect(component.emailNotVerified).toBe(true);
      });

      it('should set unverifiedEmail to the submitted email', () => {
        component.onSubmit();
        expect(component.unverifiedEmail).toBe('user@test.com');
      });

      it('should set isLoading to false', () => {
        component.onSubmit();
        expect(component.isLoading).toBe(false);
      });

      it('should NOT show snackbar', () => {
        component.onSubmit();
        expect(snackbarMock.show).not.toHaveBeenCalled();
      });
    });

    describe('when login returns 401 HttpErrorResponse', () => {
      beforeEach(() => {
        onboardingMock.login.mockReturnValue(
          throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })),
        );
        component.f['email'].setValue('user@test.com');
        component.f['senha'].setValue('senha123');
      });

      it('should set errorMessage to wrong credentials text', () => {
        component.onSubmit();
        expect(component.errorMessage).toBe('E-mail ou senha incorretos.');
      });

      it('should set isLoading to false', () => {
        component.onSubmit();
        expect(component.isLoading).toBe(false);
      });

      it('should NOT show snackbar', () => {
        component.onSubmit();
        expect(snackbarMock.show).not.toHaveBeenCalled();
      });
    });

    describe('when login returns an unexpected error', () => {
      beforeEach(() => {
        onboardingMock.login.mockReturnValue(
          throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Server Error' })),
        );
        component.f['email'].setValue('user@test.com');
        component.f['senha'].setValue('senha123');
      });

      it('should call snackbar.show with error type', () => {
        component.onSubmit();
        expect(snackbarMock.show).toHaveBeenCalledWith('Erro inesperado. Tente novamente.', 'error');
      });

      it('should set isLoading to false', () => {
        component.onSubmit();
        expect(component.isLoading).toBe(false);
      });
    });
  });

  // ─── resendVerification() ─────────────────────────────────────────────────

  describe('resendVerification()', () => {
    beforeEach(() => {
      component.unverifiedEmail = 'user@test.com';
    });

    it('should call resendVerificationEmail with unverifiedEmail', () => {
      component.resendVerification();
      expect(onboardingMock.resendVerificationEmail).toHaveBeenCalledWith('user@test.com');
    });

    it('should set resendSuccess to true on success', () => {
      component.resendVerification();
      expect(component.resendSuccess).toBe(true);
    });

    it('should set isResending to false after success', () => {
      component.resendVerification();
      expect(component.isResending).toBe(false);
    });

    it('should set resendError on failure', () => {
      onboardingMock.resendVerificationEmail.mockReturnValue(throwError(() => new Error('Network error')));
      component.resendVerification();
      expect(component.resendError).toBe('Não foi possível reenviar. Tente novamente.');
    });

    it('should set isResending to false on error', () => {
      onboardingMock.resendVerificationEmail.mockReturnValue(throwError(() => new Error('Error')));
      component.resendVerification();
      expect(component.isResending).toBe(false);
    });

    it('should do nothing when isResending is already true', () => {
      component.isResending = true;
      component.resendVerification();
      expect(onboardingMock.resendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should clear previous resend state before calling the service', () => {
      component.resendSuccess = true;
      component.resendError = 'old error';
      component.resendVerification();
      // After success the state is set by the callback, but resendSuccess/Error are cleared before the call
      expect(component.resendError).toBe('');
    });
  });
});
