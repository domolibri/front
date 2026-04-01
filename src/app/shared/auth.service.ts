import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, catchError, of, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CurrentUser {
  tenantId: string;
  email: string;
  nome: string;
  nomeEditora?: string;
  brandingConfigurado?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _isAuthenticated$ = new BehaviorSubject<boolean>(false);
  private _currentUser$ = new BehaviorSubject<CurrentUser | null>(null);

  // Cached Observable: emite uma vez e replays para qualquer subscriber posterior.
  // Garante que o APP_INITIALIZER e o authGuard compartilhem a mesma requisição.
  private _session$: Observable<boolean> | null = null;

  isAuthenticated$ = this._isAuthenticated$.asObservable();
  currentUser$ = this._currentUser$.asObservable();

  constructor(private http: HttpClient) {}

  checkSession(): Observable<boolean> {
    if (!this._session$) {
      this._session$ = this.http.get<CurrentUser>(`${environment.apiUrl}/api/auth/me`).pipe(
        tap((user) => {
          this._currentUser$.next(user);
          this._isAuthenticated$.next(true);
        }),
        map((): boolean => true),
        catchError(() => {
          this._isAuthenticated$.next(false);
          this._currentUser$.next(null);
          return of(false);
        }),
        shareReplay(1),
      );
    }
    return this._session$;
  }

  setAuthenticated(status: boolean): void {
    this._isAuthenticated$.next(status);
  }

  isAuthenticated(): boolean {
    return this._isAuthenticated$.value;
  }

  get currentUser(): CurrentUser | null {
    return this._currentUser$.value;
  }

  logout(): void {
    this._session$ = null;
    this.http.post(`${environment.apiUrl}/api/auth/logout`, {}).subscribe({
      next: () => {
        this._isAuthenticated$.next(false);
        this._currentUser$.next(null);
      },
      error: () => {
        this._isAuthenticated$.next(false);
        this._currentUser$.next(null);
      },
    });
  }
}
