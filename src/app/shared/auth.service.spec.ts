import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, CurrentUser } from './auth.service';
import { SnackbarService } from './snackbar.service';
import { environment } from '../../environments/environment';

const ME_URL = `${environment.apiUrl}/api/auth/me`;
const LOGOUT_URL = `${environment.apiUrl}/api/auth/logout`;
const mockUser: CurrentUser = { tenantId: 'tenant-abc', email: 'test@test.com', nome: 'Test User' };

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let snackbar: SnackbarService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService, SnackbarService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    snackbar = TestBed.inject(SnackbarService);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── Initial State ────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('should start unauthenticated', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should start with no current user', () => {
      expect(service.currentUser).toBeNull();
    });

    it('should emit false on isAuthenticated$ immediately', () => {
      const emitted: boolean[] = [];
      service.isAuthenticated$.subscribe((v) => emitted.push(v));
      expect(emitted).toEqual([false]);
    });

    it('should emit null on currentUser$ immediately', () => {
      const emitted: (CurrentUser | null)[] = [];
      service.currentUser$.subscribe((v) => emitted.push(v));
      expect(emitted).toEqual([null]);
    });
  });

  // ─── checkSession() ───────────────────────────────────────────────────────

  describe('checkSession()', () => {
    it('should GET /api/auth/me', () => {
      service.checkSession().subscribe();
      const req = http.expectOne(ME_URL);
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });

    it('should return true on success', () => {
      let result: boolean | undefined;
      service.checkSession().subscribe((v) => (result = v));
      http.expectOne(ME_URL).flush(mockUser);
      expect(result).toBe(true);
    });

    it('should update currentUser on success', () => {
      service.checkSession().subscribe();
      http.expectOne(ME_URL).flush(mockUser);
      expect(service.currentUser).toEqual(mockUser);
    });

    it('should set isAuthenticated to true on success', () => {
      service.checkSession().subscribe();
      http.expectOne(ME_URL).flush(mockUser);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should emit true on isAuthenticated$ after success', () => {
      const emitted: boolean[] = [];
      service.isAuthenticated$.subscribe((v) => emitted.push(v));
      service.checkSession().subscribe();
      http.expectOne(ME_URL).flush(mockUser);
      expect(emitted).toContain(true);
    });

    it('should return false on HTTP 401 error', () => {
      let result: boolean | undefined;
      service.checkSession().subscribe((v) => (result = v));
      http.expectOne(ME_URL).flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
      expect(result).toBe(false);
    });

    it('should return false on HTTP 500 error', () => {
      let result: boolean | undefined;
      service.checkSession().subscribe((v) => (result = v));
      http.expectOne(ME_URL).flush('Error', { status: 500, statusText: 'Server Error' });
      expect(result).toBe(false);
    });

    it('should set isAuthenticated to false on HTTP error', () => {
      // Seed authenticated state via a first successful call
      service.checkSession().subscribe();
      http.expectOne(ME_URL).flush(mockUser);

      service.checkSession().subscribe();
      http.expectOne(ME_URL).flush('error', { status: 401, statusText: 'Unauthorized' });
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should reset currentUser to null on HTTP error', () => {
      // Seed a user via a first successful call
      service.checkSession().subscribe();
      http.expectOne(ME_URL).flush(mockUser);
      expect(service.currentUser).toEqual(mockUser);

      // Then fail a second call
      service.checkSession().subscribe();
      http.expectOne(ME_URL).flush('error', { status: 401, statusText: 'Unauthorized' });
      expect(service.currentUser).toBeNull();
    });

    it('should NOT propagate error to subscriber (catchError swallows it)', () => {
      const errorSpy = vi.fn();
      service.checkSession().subscribe({ error: errorSpy });
      http.expectOne(ME_URL).flush('error', { status: 500, statusText: 'Server Error' });
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });

  // ─── clearLocalSession() ──────────────────────────────────────────────────

  describe('clearLocalSession()', () => {
    beforeEach(() => {
      service.checkSession().subscribe();
      http.expectOne(ME_URL).flush(mockUser);
    });

    it('should set isAuthenticated to false', () => {
      service.clearLocalSession();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should set currentUser to null', () => {
      service.clearLocalSession();
      expect(service.currentUser).toBeNull();
    });

    it('should emit false on isAuthenticated$', () => {
      const emitted: boolean[] = [];
      service.isAuthenticated$.subscribe((v) => emitted.push(v));
      service.clearLocalSession();
      expect(emitted[emitted.length - 1]).toBe(false);
    });

    it('should emit null on currentUser$', () => {
      const emitted: (CurrentUser | null)[] = [];
      service.currentUser$.subscribe((v) => emitted.push(v));
      service.clearLocalSession();
      expect(emitted[emitted.length - 1]).toBeNull();
    });
  });

  // ─── isAuthenticated() ────────────────────────────────────────────────────

  describe('isAuthenticated()', () => {
    it('should return false by default', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return true after a successful checkSession', () => {
      service.checkSession().subscribe();
      http.expectOne(ME_URL).flush(mockUser);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false after clearLocalSession', () => {
      service.checkSession().subscribe();
      http.expectOne(ME_URL).flush(mockUser);
      service.clearLocalSession();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  // ─── currentUser getter ───────────────────────────────────────────────────

  describe('currentUser getter', () => {
    it('should return null initially', () => {
      expect(service.currentUser).toBeNull();
    });

    it('should return the user after a successful checkSession', () => {
      service.checkSession().subscribe();
      http.expectOne(ME_URL).flush(mockUser);
      expect(service.currentUser).toEqual(mockUser);
    });

    it('should return null after a failed checkSession', () => {
      service.checkSession().subscribe();
      http.expectOne(ME_URL).flush(mockUser);
      service.checkSession().subscribe();
      http.expectOne(ME_URL).flush('error', { status: 401, statusText: 'Unauthorized' });
      expect(service.currentUser).toBeNull();
    });
  });

  // ─── logout() ─────────────────────────────────────────────────────────────

  describe('logout()', () => {
    it('should POST to /api/auth/logout with an empty body', () => {
      service.logout();
      const req = http.expectOne(LOGOUT_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush({});
    });

    it('should set isAuthenticated to false on success', () => {
      service.checkSession().subscribe();
      http.expectOne(ME_URL).flush(mockUser);
      service.logout();
      http.expectOne(LOGOUT_URL).flush({});
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should set currentUser to null on success', () => {
      service.checkSession().subscribe();
      http.expectOne(ME_URL).flush(mockUser);
      service.logout();
      http.expectOne(LOGOUT_URL).flush({});
      expect(service.currentUser).toBeNull();
    });

    it('should set isAuthenticated to false even on HTTP error', () => {
      service.checkSession().subscribe();
      http.expectOne(ME_URL).flush(mockUser);
      service.logout();
      http.expectOne(LOGOUT_URL).flush('error', { status: 500, statusText: 'Server Error' });
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should set currentUser to null even on HTTP error', () => {
      service.checkSession().subscribe();
      http.expectOne(ME_URL).flush(mockUser);
      service.logout();
      http.expectOne(LOGOUT_URL).flush('error', { status: 500, statusText: 'Server Error' });
      expect(service.currentUser).toBeNull();
    });

    it('should show an error snackbar when the server logout request fails', () => {
      const showSpy = vi.spyOn(snackbar, 'show');
      service.logout();
      http.expectOne(LOGOUT_URL).flush('error', { status: 500, statusText: 'Server Error' });
      expect(showSpy).toHaveBeenCalledWith(expect.any(String), 'error');
    });

    it('should NOT show a snackbar on successful logout', () => {
      const showSpy = vi.spyOn(snackbar, 'show');
      service.logout();
      http.expectOne(LOGOUT_URL).flush({});
      expect(showSpy).not.toHaveBeenCalled();
    });
  });

  // ─── permissions$ ─────────────────────────────────────────────────────────

  describe('permissions$', () => {
    it('should emit an empty array when user has no permissions', () => {
      service.checkSession().subscribe();
      http.expectOne(ME_URL).flush({ ...mockUser, permissions: undefined });
      const emitted: string[][] = [];
      service.permissions$.subscribe((perms) => emitted.push(perms));
      expect(emitted[emitted.length - 1]).toEqual([]);
    });

    it('should emit the permissions array from the current user', () => {
      service.checkSession().subscribe();
      http.expectOne(ME_URL).flush({ ...mockUser, permissions: ['usuarios.ler', 'obras.escrever'] });
      const emitted: string[][] = [];
      service.permissions$.subscribe((perms) => emitted.push(perms));
      expect(emitted[emitted.length - 1]).toEqual(['usuarios.ler', 'obras.escrever']);
    });
  });

  // ─── hasPermission() ──────────────────────────────────────────────────────

  describe('hasPermission()', () => {
    it('should return false when user is not authenticated', () => {
      expect(service.hasPermission('usuarios.ler')).toBe(false);
    });

    it('should return true when user has the given permission', () => {
      service.checkSession().subscribe();
      http.expectOne(ME_URL).flush({ ...mockUser, permissions: ['usuarios.ler', 'obras.escrever'] });
      expect(service.hasPermission('usuarios.ler')).toBe(true);
    });

    it('should return false when user does not have the given permission', () => {
      service.checkSession().subscribe();
      http.expectOne(ME_URL).flush({ ...mockUser, permissions: ['obras.escrever'] });
      expect(service.hasPermission('usuarios.excluir')).toBe(false);
    });

    it('should return false after clearLocalSession', () => {
      service.checkSession().subscribe();
      http.expectOne(ME_URL).flush({ ...mockUser, permissions: ['usuarios.ler'] });
      service.clearLocalSession();
      expect(service.hasPermission('usuarios.ler')).toBe(false);
    });
  });
});
