import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Ensures withCredentials is set for cookie-based auth
 * and handles 401 errors for session cleanup.
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const secureReq = req.clone({
    withCredentials: true,
  });

  return next(secureReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.setAuthenticated(false);
        // Do not redirect to login if we are already on onboarding pages
        if (!router.url.startsWith('/onboarding') && router.url !== '/') {
          router.navigate(['/']);
        }
      }
      return throwError(() => error);
    })
  );
};
