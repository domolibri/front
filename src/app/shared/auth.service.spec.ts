import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, CurrentUser } from './auth.service';
import { environment } from '../../environments/environment';

const ME_URL = `${environment.apiUrl}/api/auth/me`;
const LOGOUT_URL = `${environment.apiUrl}/api/auth/logout`;
const mockUser: CurrentUser = { tenantId: 'tenant-abc', email: 'test@test.com', nome: 'Test User' };

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
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
      service.setAuthenticated(true);
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

  // ─── setAuthenticated() ───────────────────────────────────────────────────

  describe('setAuthenticated()', () => {
    it('should set isAuthenticated to true', () => {
      service.setAuthenticated(true);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should set isAuthenticated to false', () => {
      service.setAuthenticated(true);
      service.setAuthenticated(false);
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should emit the new value on isAuthenticated$', () => {
      const emitted: boolean[] = [];
      service.isAuthenticated$.subscribe((v) => emitted.push(v));
      service.setAuthenticated(true);
      service.setAuthenticated(false);
      expect(emitted).toEqual([false, true, false]);
    });
  });

  // ─── isAuthenticated() ────────────────────────────────────────────────────

  describe('isAuthenticated()', () => {
    it('should return false by default', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return true after setAuthenticated(true)', () => {
      service.setAuthenticated(true);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false after setAuthenticated(false)', () => {
      service.setAuthenticated(true);
      service.setAuthenticated(false);
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
      service.setAuthenticated(true);
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
      service.setAuthenticated(true);
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
  });
});
