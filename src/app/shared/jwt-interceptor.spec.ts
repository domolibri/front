import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError, firstValueFrom } from 'rxjs';
import { vi } from 'vitest';

import { jwtInterceptor } from './jwt-interceptor';
import { AuthService } from './auth.service';

const CSRF_HEADER = 'X-XSRF-TOKEN';
const CSRF_TOKEN = 'test-csrf-token';

const mockAuthService = { clearLocalSession: vi.fn() };
const mockRouter = { url: '/dashboard', navigate: vi.fn() };

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
    mockAuthService.clearLocalSession.mockReset();
    mockRouter.navigate.mockReset();
    document.cookie = `XSRF-TOKEN=; max-age=0`;
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('should always set withCredentials', async () => {
    const next: HttpHandlerFn = (req) => {
      expect((req as HttpRequest<unknown>).withCredentials).toBe(true);
      return of(new HttpResponse({ status: 200 }));
    };
    const req = new HttpRequest('GET', '/api/data');
    await firstValueFrom(TestBed.runInInjectionContext(() => jwtInterceptor(req, next)));
  });

  it('should NOT add CSRF header for GET requests', async () => {
    document.cookie = `XSRF-TOKEN=${CSRF_TOKEN}`;
    const next: HttpHandlerFn = (req) => {
      expect((req as HttpRequest<unknown>).headers.has(CSRF_HEADER)).toBe(false);
      return of(new HttpResponse({ status: 200 }));
    };
    const req = new HttpRequest('GET', '/api/data');
    await firstValueFrom(TestBed.runInInjectionContext(() => jwtInterceptor(req, next)));
  });

  ['POST', 'PUT', 'DELETE', 'PATCH'].forEach((method) => {
    it(`should add CSRF header for ${method} when cookie is present`, async () => {
      document.cookie = `XSRF-TOKEN=${CSRF_TOKEN}`;
      const next: HttpHandlerFn = (req) => {
        expect((req as HttpRequest<unknown>).headers.get(CSRF_HEADER)).toBe(CSRF_TOKEN);
        return of(new HttpResponse({ status: 200 }));
      };
      const req = new HttpRequest(method as any, '/api/data', {});
      await firstValueFrom(TestBed.runInInjectionContext(() => jwtInterceptor(req, next)));
    });
  });

  it('should NOT add CSRF header when cookie is absent', async () => {
    const next: HttpHandlerFn = (req) => {
      expect((req as HttpRequest<unknown>).headers.has(CSRF_HEADER)).toBe(false);
      return of(new HttpResponse({ status: 200 }));
    };
    const req = new HttpRequest('POST', '/api/data', {});
    await firstValueFrom(TestBed.runInInjectionContext(() => jwtInterceptor(req, next)));
  });

  it('should clear session and redirect on 401 from a protected page', async () => {
    mockRouter.url = '/dashboard';
    const next: HttpHandlerFn = () => throwError(() => ({ status: 401 }));
    const req = new HttpRequest('GET', '/api/data');
    await firstValueFrom(
      TestBed.runInInjectionContext(() => jwtInterceptor(req, next)),
    ).catch(() => {});
    expect(mockAuthService.clearLocalSession).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should NOT redirect on 401 when already on a public page', async () => {
    mockRouter.url = '/login';
    const next: HttpHandlerFn = () => throwError(() => ({ status: 401 }));
    const req = new HttpRequest('GET', '/api/data');
    await firstValueFrom(
      TestBed.runInInjectionContext(() => jwtInterceptor(req, next)),
    ).catch(() => {});
    expect(mockAuthService.clearLocalSession).toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});
