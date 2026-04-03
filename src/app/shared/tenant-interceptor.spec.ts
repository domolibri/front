import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { of } from 'rxjs';

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

  it('should add X-Tenant-ID header when user is authenticated', (done) => {
    TestBed.overrideProvider(AuthService, {
      useValue: makeAuthService(true, 'tenant-abc'),
    });

    const req = new HttpRequest('GET', '/api/resource');
    TestBed.runInInjectionContext(() => tenantInterceptor(req, mockNext)).subscribe(
      (passedReq: any) => {
        expect(passedReq.headers.get('X-Tenant-ID')).toBe('tenant-abc');
        done();
      },
    );
  });

  it('should NOT add X-Tenant-ID header when user is not authenticated', (done) => {
    TestBed.overrideProvider(AuthService, {
      useValue: makeAuthService(false),
    });

    const req = new HttpRequest('GET', '/api/resource');
    TestBed.runInInjectionContext(() => tenantInterceptor(req, mockNext)).subscribe(
      (passedReq: any) => {
        expect(passedReq.headers.has('X-Tenant-ID')).toBeFalse();
        done();
      },
    );
  });

  it('should NOT add X-Tenant-ID header for external URLs', (done) => {
    TestBed.overrideProvider(AuthService, {
      useValue: makeAuthService(true, 'tenant-abc'),
    });

    const req = new HttpRequest('GET', 'https://external.example.com/resource');
    TestBed.runInInjectionContext(() => tenantInterceptor(req, mockNext)).subscribe(
      (passedReq: any) => {
        expect(passedReq.headers?.has?.('X-Tenant-ID') ?? false).toBeFalse();
        done();
      },
    );
  });
});
