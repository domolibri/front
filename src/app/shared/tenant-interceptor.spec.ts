import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';

import { tenantInterceptor } from './tenant-interceptor';
import { AuthService } from './auth.service';

const mockNext: HttpHandlerFn = (req) => of(req as any);

const makeAuthService = (authenticated: boolean, tenantId?: string) => ({
  isAuthenticated: () => authenticated,
  currentUser: tenantId ? { tenantId, email: '', nome: '' } : null,
});

describe('tenantInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => tenantInterceptor(req, next));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('should add X-Tenant-ID header when user is authenticated', async () => {
    TestBed.overrideProvider(AuthService, {
      useValue: makeAuthService(true, 'tenant-abc'),
    });

    const req = new HttpRequest('GET', '/api/resource');
    const passedReq = await firstValueFrom(
      TestBed.runInInjectionContext(() => tenantInterceptor(req, mockNext)),
    ) as any;
    expect(passedReq.headers.get('X-Tenant-ID')).toBe('tenant-abc');
  });

  it('should NOT add X-Tenant-ID header when user is not authenticated', async () => {
    TestBed.overrideProvider(AuthService, {
      useValue: makeAuthService(false),
    });

    const req = new HttpRequest('GET', '/api/resource');
    const passedReq = await firstValueFrom(
      TestBed.runInInjectionContext(() => tenantInterceptor(req, mockNext)),
    ) as any;
    expect(passedReq.headers.has('X-Tenant-ID')).toBe(false);
  });

  it('should NOT add X-Tenant-ID header for external URLs', async () => {
    TestBed.overrideProvider(AuthService, {
      useValue: makeAuthService(true, 'tenant-abc'),
    });

    const req = new HttpRequest('GET', 'https://external.example.com/resource');
    const passedReq = await firstValueFrom(
      TestBed.runInInjectionContext(() => tenantInterceptor(req, mockNext)),
    ) as any;
    expect(passedReq.headers?.has?.('X-Tenant-ID') ?? false).toBe(false);
  });
});
