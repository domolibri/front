import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { Register } from './register';
import { Onboarding } from '../../services/onboarding';
import { AuthService } from '../../shared/auth.service';
import { SnackbarService } from '../../shared/snackbar.service';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  let onboardingMock: { registerEditora: ReturnType<typeof vi.fn> };
  let authMock: { setAuthenticated: ReturnType<typeof vi.fn> };
  let snackbarMock: { show: ReturnType<typeof vi.fn> };
  let routerNavigateSpy: ReturnType<typeof vi.fn>;

  const validFormValues = {
    nomeEditora: 'Editora Teste',
    nomeAdmin: 'Admin Teste',
    emailAdmin: 'admin@test.com',
    senha: 'Senha@123',
  };

  beforeEach(async () => {
    onboardingMock = {
      registerEditora: vi.fn().mockReturnValue(of({ editoraId: 'id-1', message: 'Criado' })),
    };
    authMock = { setAuthenticated: vi.fn() };
    snackbarMock = { show: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        provideRouter([]),
        { provide: Onboarding, useValue: onboardingMock },
        { provide: AuthService, useValue: authMock },
        { provide: SnackbarService, useValue: snackbarMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    routerNavigateSpy = vi.spyOn(component['router'], 'navigate').mockImplementation(() => Promise.resolve(true));
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── Form initialization ──────────────────────────────────────────────────

  describe('form', () => {
    it('should have all four controls', () => {
      expect(component.form.get('nomeEditora')).toBeTruthy();
      expect(component.form.get('nomeAdmin')).toBeTruthy();
      expect(component.form.get('emailAdmin')).toBeTruthy();
      expect(component.form.get('senha')).toBeTruthy();
    });

    it('nomeEditora should be invalid when empty', () => {
      component.f['nomeEditora'].setValue('');
      expect(component.f['nomeEditora'].valid).toBe(false);
    });

    it('nomeEditora should be invalid with less than 2 characters', () => {
      component.f['nomeEditora'].setValue('A');
      expect(component.f['nomeEditora'].valid).toBe(false);
    });

    it('emailAdmin should be invalid with bad format', () => {
      component.f['emailAdmin'].setValue('notanemail');
      expect(component.f['emailAdmin'].valid).toBe(false);
    });

    it('emailAdmin should be valid with proper format', () => {
      component.f['emailAdmin'].setValue('admin@test.com');
      expect(component.f['emailAdmin'].valid).toBe(true);
    });
  });

  // ─── Password validator ───────────────────────────────────────────────────

  describe('senha validator (complex regex)', () => {
    const setPassword = (pw: string) => component.f['senha'].setValue(pw);

    it('should be invalid when too short (< 8 chars)', () => {
      setPassword('Ab1@');
      expect(component.f['senha'].valid).toBe(false);
    });

    it('should be invalid without an uppercase letter', () => {
      setPassword('senha@123');
      expect(component.f['senha'].valid).toBe(false);
    });

    it('should be invalid without a lowercase letter', () => {
      setPassword('SENHA@123');
      expect(component.f['senha'].valid).toBe(false);
    });

    it('should be invalid without a digit', () => {
      setPassword('Senha@abc');
      expect(component.f['senha'].valid).toBe(false);
    });

    it('should be invalid without a special character', () => {
      setPassword('Senha1234');
      expect(component.f['senha'].valid).toBe(false);
    });

    it('should be valid when all requirements are met', () => {
      setPassword('Senha@123');
      expect(component.f['senha'].valid).toBe(true);
    });

    it('should be valid with another valid password', () => {
      setPassword('P@ssw0rd!');
      expect(component.f['senha'].valid).toBe(true);
    });
  });

  // ─── clearFieldError() ────────────────────────────────────────────────────

  describe('clearFieldError()', () => {
    it('should remove the specified field from fieldErrors', () => {
      component.fieldErrors = { emailAdmin: 'E-mail já cadastrado' };
      component.clearFieldError('emailAdmin');
      expect(component.fieldErrors['emailAdmin']).toBeUndefined();
    });

    it('should not affect other field errors', () => {
      component.fieldErrors = { emailAdmin: 'E-mail já cadastrado', nomeEditora: 'Nome inválido' };
      component.clearFieldError('emailAdmin');
      expect(component.fieldErrors['nomeEditora']).toBe('Nome inválido');
    });

    it('should not throw when field does not exist', () => {
      component.fieldErrors = {};
      expect(() => component.clearFieldError('nonExistentField')).not.toThrow();
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

      it('should NOT call registerEditora', () => {
        component.onSubmit();
        expect(onboardingMock.registerEditora).not.toHaveBeenCalled();
      });
    });

    describe('when form is valid and registration succeeds', () => {
      beforeEach(() => {
        component.form.setValue(validFormValues);
      });

      it('should call registerEditora with form values', () => {
        component.onSubmit();
        expect(onboardingMock.registerEditora).toHaveBeenCalledWith(validFormValues);
      });

      it('should navigate to /cadastro/sucesso with the email as query param', () => {
        component.onSubmit();
        expect(routerNavigateSpy).toHaveBeenCalledWith(['/cadastro/sucesso'], {
          queryParams: { email: validFormValues.emailAdmin },
        });
      });

      it('should set isLoading to false', () => {
        component.onSubmit();
        expect(component.isLoading).toBe(false);
      });

      it('should clear errorMessage and fieldErrors before the request', () => {
        component.errorMessage = 'old';
        component.fieldErrors = { emailAdmin: 'old error' };
        component.onSubmit();
        // On success, isLoading goes false but the clearing happens before the request
        expect(component.errorMessage).toBe('');
        expect(component.fieldErrors).toEqual({});
      });
    });

    describe('when registration returns 400 (validation errors)', () => {
      beforeEach(() => {
        component.form.setValue(validFormValues);
        onboardingMock.registerEditora.mockReturnValue(
          throwError(
            () =>
              new HttpErrorResponse({
                status: 400,
                error: {
                  errors: {
                    EmailAdmin: ['E-mail já cadastrado.'],
                    NomeEditora: ['Nome muito curto.'],
                  },
                },
              }),
          ),
        );
      });

      it('should populate fieldErrors with camelCase keys', () => {
        component.onSubmit();
        expect(component.fieldErrors['emailAdmin']).toBe('E-mail já cadastrado.');
        expect(component.fieldErrors['nomeEditora']).toBe('Nome muito curto.');
      });

      it('should use the first message when errors is an array', () => {
        component.onSubmit();
        expect(component.fieldErrors['emailAdmin']).toBe('E-mail já cadastrado.');
      });

      it('should set isLoading to false', () => {
        component.onSubmit();
        expect(component.isLoading).toBe(false);
      });

      it('should NOT call snackbar', () => {
        component.onSubmit();
        expect(snackbarMock.show).not.toHaveBeenCalled();
      });
    });

    describe('when registration returns 400 with string messages (non-array)', () => {
      it('should assign the string message directly', () => {
        component.form.setValue(validFormValues);
        onboardingMock.registerEditora.mockReturnValue(
          throwError(
            () =>
              new HttpErrorResponse({
                status: 400,
                error: { errors: { EmailAdmin: 'E-mail inválido.' } },
              }),
          ),
        );
        component.onSubmit();
        expect(component.fieldErrors['emailAdmin']).toBe('E-mail inválido.');
      });
    });

    describe('when registration returns 409 (conflict)', () => {
      beforeEach(() => {
        component.form.setValue(validFormValues);
        onboardingMock.registerEditora.mockReturnValue(
          throwError(
            () =>
              new HttpErrorResponse({
                status: 409,
                error: { detail: 'E-mail já cadastrado.' },
              }),
          ),
        );
      });

      it('should set errorMessage from detail', () => {
        component.onSubmit();
        expect(component.errorMessage).toBe('E-mail já cadastrado.');
      });

      it('should NOT call snackbar', () => {
        component.onSubmit();
        expect(snackbarMock.show).not.toHaveBeenCalled();
      });
    });

    describe('when registration returns 422 (unprocessable)', () => {
      it('should set errorMessage from detail', () => {
        component.form.setValue(validFormValues);
        onboardingMock.registerEditora.mockReturnValue(
          throwError(
            () =>
              new HttpErrorResponse({
                status: 422,
                error: { detail: 'Operação inválida.' },
              }),
          ),
        );
        component.onSubmit();
        expect(component.errorMessage).toBe('Operação inválida.');
      });

      it('should fall back to title when detail is absent', () => {
        component.form.setValue(validFormValues);
        onboardingMock.registerEditora.mockReturnValue(
          throwError(
            () =>
              new HttpErrorResponse({
                status: 422,
                error: { title: 'Unprocessable Entity' },
              }),
          ),
        );
        component.onSubmit();
        expect(component.errorMessage).toBe('Unprocessable Entity');
      });

      it('should fall back to default message when both detail and title are absent', () => {
        component.form.setValue(validFormValues);
        onboardingMock.registerEditora.mockReturnValue(
          throwError(() => new HttpErrorResponse({ status: 422, error: {} })),
        );
        component.onSubmit();
        expect(component.errorMessage).toBe('Operação não permitida.');
      });
    });

    describe('when registration returns an unexpected error', () => {
      beforeEach(() => {
        component.form.setValue(validFormValues);
        onboardingMock.registerEditora.mockReturnValue(
          throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Server Error' })),
        );
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
});
