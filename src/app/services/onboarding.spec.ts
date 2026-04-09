import { TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpErrorResponse } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import {
  Onboarding,
  EmailNotVerifiedError,
  RegisterEditoraResponse,
  LoginResponse,
  VerifyEmailResponse,
} from './onboarding';
import { environment } from '../../environments/environment';

const BASE = `${environment.apiUrl}/api/auth`;
const BRANDING_URL = `${environment.apiUrl}/api/editora/branding`;

describe('Onboarding', () => {
  let service: Onboarding;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Onboarding, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(Onboarding);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── registerEditora() ────────────────────────────────────────────────────

  describe('registerEditora()', () => {
    const payload = { nomeEditora: 'Editora A', emailAdmin: 'admin@a.com', senha: 'Senha@123', nomeAdmin: 'Admin', aceitouTermos: true };
    const response: RegisterEditoraResponse = { editoraId: 'id-1', message: 'Cadastrado com sucesso' };

    it('should POST to /api/auth/register with the payload', () => {
      service.registerEditora(payload).subscribe();
      const req = http.expectOne(`${BASE}/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(response);
    });

    it('should return the server response', () => {
      let result: RegisterEditoraResponse | undefined;
      service.registerEditora(payload).subscribe((r) => (result = r));
      http.expectOne(`${BASE}/register`).flush(response);
      expect(result).toEqual(response);
    });
  });

  // ─── login() ──────────────────────────────────────────────────────────────

  describe('login()', () => {
    const loginResponse: LoginResponse = {
      usuarioId: 'user-1',
      nome: 'Admin',
      email: 'u@a.com',
      contextos: [],
      message: 'Autenticado',
    };

    it('should POST to /api/auth/login with email and senha', () => {
      service.login('u@a.com', 'pass').subscribe();
      const req = http.expectOne(`${BASE}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'u@a.com', senha: 'pass' });
      req.flush(loginResponse);
    });

    it('should return the login response on success', () => {
      let result: LoginResponse | undefined;
      service.login('u@a.com', 'pass').subscribe((r) => (result = r));
      http.expectOne(`${BASE}/login`).flush(loginResponse);
      expect(result).toEqual(loginResponse);
    });

    it('should throw EmailNotVerifiedError on 401 with matching detail', () => {
      let error: unknown;
      service.login('u@a.com', 'pass').subscribe({ error: (e) => (error = e) });
      http.expectOne(`${BASE}/login`).flush(
        { detail: 'E-mail não verificado.' },
        { status: 401, statusText: 'Unauthorized' },
      );
      expect(error).toBeInstanceOf(EmailNotVerifiedError);
    });

    it('should propagate the original HttpErrorResponse on 401 with different detail', () => {
      let error: unknown;
      service.login('u@a.com', 'pass').subscribe({ error: (e) => (error = e) });
      http.expectOne(`${BASE}/login`).flush(
        { detail: 'Credenciais inválidas.' },
        { status: 401, statusText: 'Unauthorized' },
      );
      expect(error).toBeInstanceOf(HttpErrorResponse);
      expect((error as HttpErrorResponse).status).toBe(401);
    });

    it('should propagate the original HttpErrorResponse on 401 with no error body', () => {
      let error: unknown;
      service.login('u@a.com', 'pass').subscribe({ error: (e) => (error = e) });
      http.expectOne(`${BASE}/login`).flush(null, { status: 401, statusText: 'Unauthorized' });
      expect(error).toBeInstanceOf(HttpErrorResponse);
    });

    it('should propagate other HTTP errors unchanged', () => {
      let error: unknown;
      service.login('u@a.com', 'pass').subscribe({ error: (e) => (error = e) });
      http.expectOne(`${BASE}/login`).flush('Server Error', { status: 500, statusText: 'Server Error' });
      expect(error).toBeInstanceOf(HttpErrorResponse);
      expect((error as HttpErrorResponse).status).toBe(500);
    });
  });

  // ─── EmailNotVerifiedError ────────────────────────────────────────────────

  describe('EmailNotVerifiedError', () => {
    it('should have name "EmailNotVerifiedError"', () => {
      expect(new EmailNotVerifiedError().name).toBe('EmailNotVerifiedError');
    });

    it('should have the correct message', () => {
      expect(new EmailNotVerifiedError().message).toBe('E-mail não verificado.');
    });

    it('should be an instance of Error', () => {
      expect(new EmailNotVerifiedError()).toBeInstanceOf(Error);
    });
  });

  // ─── verifyEmail() ────────────────────────────────────────────────────────

  describe('verifyEmail()', () => {
    it('should POST to /api/auth/verify-email with email and token', () => {
      service.verifyEmail('u@a.com', 'token123').subscribe();
      const req = http.expectOne(`${BASE}/verify-email`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'u@a.com', token: 'token123' });
      req.flush({ message: 'Verificado' });
    });

    it('should return the response', () => {
      let result: VerifyEmailResponse | undefined;
      service.verifyEmail('u@a.com', 'token123').subscribe((r) => (result = r));
      http.expectOne(`${BASE}/verify-email`).flush({ message: 'Verificado' });
      expect(result).toEqual({ message: 'Verificado' });
    });
  });

  // ─── resendVerificationEmail() ────────────────────────────────────────────

  describe('resendVerificationEmail()', () => {
    it('should POST to /api/auth/resend-verification-email', () => {
      service.resendVerificationEmail('u@a.com').subscribe();
      const req = http.expectOne(`${BASE}/resend-verification-email`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'u@a.com' });
      req.flush({ message: 'Reenviado' });
    });

    it('should return the message', () => {
      let result: { message: string } | undefined;
      service.resendVerificationEmail('u@a.com').subscribe((r) => (result = r));
      http.expectOne(`${BASE}/resend-verification-email`).flush({ message: 'Reenviado' });
      expect(result?.message).toBe('Reenviado');
    });
  });

  // ─── forgotPassword() ────────────────────────────────────────────────────

  describe('forgotPassword()', () => {
    it('should POST to /api/auth/forgot-password', () => {
      service.forgotPassword('u@a.com').subscribe();
      const req = http.expectOne(`${BASE}/forgot-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'u@a.com' });
      req.flush({ message: 'E-mail enviado' });
    });

    it('should return the message', () => {
      let result: { message: string } | undefined;
      service.forgotPassword('u@a.com').subscribe((r) => (result = r));
      http.expectOne(`${BASE}/forgot-password`).flush({ message: 'E-mail enviado' });
      expect(result?.message).toBe('E-mail enviado');
    });
  });

  // ─── resetPassword() ──────────────────────────────────────────────────────

  describe('resetPassword()', () => {
    it('should POST to /api/auth/reset-password with all fields', () => {
      service.resetPassword('u@a.com', 'tok', 'Nova@123').subscribe();
      const req = http.expectOne(`${BASE}/reset-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'u@a.com', token: 'tok', novaSenha: 'Nova@123' });
      req.flush({ message: 'Senha redefinida' });
    });

    it('should return the message', () => {
      let result: { message: string } | undefined;
      service.resetPassword('u@a.com', 'tok', 'Nova@123').subscribe((r) => (result = r));
      http.expectOne(`${BASE}/reset-password`).flush({ message: 'Senha redefinida' });
      expect(result?.message).toBe('Senha redefinida');
    });
  });

  // ─── updateBranding() ────────────────────────────────────────────────────

  describe('updateBranding()', () => {
    it('should PATCH to /api/editora/branding', () => {
      service.updateBranding('#ff0000', null).subscribe();
      const req = http.expectOne(BRANDING_URL);
      expect(req.request.method).toBe('PATCH');
      req.flush({});
    });

    it('should send a FormData body', () => {
      service.updateBranding('#ff0000', null).subscribe();
      const req = http.expectOne(BRANDING_URL);
      expect(req.request.body).toBeInstanceOf(FormData);
      req.flush({});
    });

    it('should append CorPrimaria when non-empty', () => {
      service.updateBranding('#ff0000', null).subscribe();
      const req = http.expectOne(BRANDING_URL);
      expect((req.request.body as FormData).get('CorPrimaria')).toBe('#ff0000');
      req.flush({});
    });

    it('should NOT append CorPrimaria when empty string', () => {
      service.updateBranding('', null).subscribe();
      const req = http.expectOne(BRANDING_URL);
      expect((req.request.body as FormData).get('CorPrimaria')).toBeNull();
      req.flush({});
    });

    it('should append Logo when a file is provided', () => {
      const file = new File(['content'], 'logo.png', { type: 'image/png' });
      service.updateBranding('#fff', file).subscribe();
      const req = http.expectOne(BRANDING_URL);
      const logoEntry = (req.request.body as FormData).get('Logo') as File;
      expect(logoEntry).toBeTruthy();
      expect(logoEntry.name).toBe('logo.png');
      req.flush({});
    });

    it('should NOT append Logo when file is null', () => {
      service.updateBranding('#fff', null).subscribe();
      const req = http.expectOne(BRANDING_URL);
      expect((req.request.body as FormData).get('Logo')).toBeNull();
      req.flush({});
    });

    it('should send an empty FormData when both inputs are empty/null', () => {
      service.updateBranding('', null).subscribe();
      const req = http.expectOne(BRANDING_URL);
      const fd = req.request.body as FormData;
      expect(fd.get('CorPrimaria')).toBeNull();
      expect(fd.get('Logo')).toBeNull();
      req.flush({});
    });
  });
});
