import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { jwtInterceptor } from './jwt-interceptor';
import { AuthService } from './auth.service';

const CSRF_HEADER = 'X-XSRF-TOKEN';
const CSRF_TOKEN = 'test-csrf-token';

const mockAuthService = { clearLocalSession: jasmine.createSpy('clearLocalSession') };
const mockRouter = { url: '/dashboard', navigate: jasmine.createSpy('navigate') };

describe('jwtInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => jwtInterceptor(req, next));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });
    mockAuthService.clearLocalSession.calls.reset();
    mockRouter.navigate.calls.reset();
    // Reset cookie
    document.cookie = `XSRF-TOKEN=; max-age=0`;
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('should always set withCredentials', (done) => {
    const next: HttpHandlerFn = (req) => {
      expect((req as HttpRequest<unknown>).withCredentials).toBeTrue();
      return of(new HttpResponse({ status: 200 }));
    };
    const req = new HttpRequest('GET', '/api/data');
    TestBed.runInInjectionContext(() => jwtInterceptor(req, next)).subscribe(() => done());
  });

  it('should NOT add CSRF header for GET requests', (done) => {
    document.cookie = `XSRF-TOKEN=${CSRF_TOKEN}`;
    const next: HttpHandlerFn = (req) => {
      expect((req as HttpRequest<unknown>).headers.has(CSRF_HEADER)).toBeFalse();
      return of(new HttpResponse({ status: 200 }));
    };
    const req = new HttpRequest('GET', '/api/data');
    TestBed.runInInjectionContext(() => jwtInterceptor(req, next)).subscribe(() => done());
  });

  ['POST', 'PUT', 'DELETE', 'PATCH'].forEach((method) => {
    it(`should add CSRF header for ${method} when cookie is present`, (done) => {
      document.cookie = `XSRF-TOKEN=${CSRF_TOKEN}`;
      const next: HttpHandlerFn = (req) => {
        expect((req as HttpRequest<unknown>).headers.get(CSRF_HEADER)).toBe(CSRF_TOKEN);
        return of(new HttpResponse({ status: 200 }));
      };
      const req = new HttpRequest(method as any, '/api/data', {});
      TestBed.runInInjectionContext(() => jwtInterceptor(req, next)).subscribe(() => done());
    });
  });

  it('should NOT add CSRF header when cookie is absent', (done) => {
    const next: HttpHandlerFn = (req) => {
      expect((req as HttpRequest<unknown>).headers.has(CSRF_HEADER)).toBeFalse();
      return of(new HttpResponse({ status: 200 }));
    };
    const req = new HttpRequest('POST', '/api/data', {});
    TestBed.runInInjectionContext(() => jwtInterceptor(req, next)).subscribe(() => done());
  });

  it('should clear session and redirect on 401 from a protected page', (done) => {
    mockRouter.url = '/dashboard';
    const next: HttpHandlerFn = () => throwError(() => ({ status: 401 }));
    const req = new HttpRequest('GET', '/api/data');
    TestBed.runInInjectionContext(() => jwtInterceptor(req, next)).subscribe({
      error: () => {
        expect(mockAuthService.clearLocalSession).toHaveBeenCalled();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
        done();
      },
    });
  });

  it('should NOT redirect on 401 when already on a public page', (done) => {
    mockRouter.url = '/login';
    const next: HttpHandlerFn = () => throwError(() => ({ status: 401 }));
    const req = new HttpRequest('GET', '/api/data');
    TestBed.runInInjectionContext(() => jwtInterceptor(req, next)).subscribe({
      error: () => {
        expect(mockAuthService.clearLocalSession).toHaveBeenCalled();
        expect(mockRouter.navigate).not.toHaveBeenCalled();
        done();
      },
    });
  });
});
