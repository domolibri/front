import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { safeInject } from './safe-inject';

const CSRF_COOKIE = 'XSRF-TOKEN';
const CSRF_HEADER = 'X-XSRF-TOKEN';
const CSRF_METHODS = new Set(['POST', 'PUT', 'DELETE', 'PATCH']);

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Ensures withCredentials is set for cookie-based auth,
 * injects the CSRF token header for mutating requests,
 * and handles 401 errors for session cleanup.
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = safeInject(AuthService, 'jwtInterceptor');
  const router = safeInject(Router, 'jwtInterceptor');

  if (!authService || !router) {
    // DI failed — forward the request with withCredentials only.
    // The server will respond with 401 on protected routes, which is
    // a safe and auditable outcome without silently bypassing auth.
    return next(req.clone({ withCredentials: true }));
  }

  let headers = req.headers;

  if (CSRF_METHODS.has(req.method)) {
    const csrfToken = readCookie(CSRF_COOKIE);
    if (csrfToken) {
      headers = headers.set(CSRF_HEADER, csrfToken);
    }
  }

  const secureReq = req.clone({ withCredentials: true, headers });

  return next(secureReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.clearLocalSession();
        // Do not redirect if already on public/auth pages
        const publicPaths = ['/', '/login', '/cadastro', '/esqueci-senha', '/redefinir-senha'];
        const isPublicPage =
          publicPaths.includes(router.url) || router.url.startsWith('/onboarding');
        if (!isPublicPage) {
          router.navigate(['/']);
        }
      }
      return throwError(() => error);
    }),
  );
};
