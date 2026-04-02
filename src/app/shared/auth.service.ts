import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, ReplaySubject, tap, map, catchError, of } from 'rxjs';
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

  // Emite true/false quando a verificação de sessão conclui (replay para subscribers tardios).
  // Atualizado apenas por checkSession(). Com ReplaySubject(1), subscribers tardios
  // recebem o último valor sem disparar nova requisição.
  private _initialized$ = new ReplaySubject<boolean>(1);

  isAuthenticated$ = this._isAuthenticated$.asObservable();
  currentUser$ = this._currentUser$.asObservable();
  initialized$ = this._initialized$.asObservable();

  constructor(private http: HttpClient) {}

  checkSession(): Observable<boolean> {
    return this.http.get<CurrentUser>(`${environment.apiUrl}/api/auth/me`).pipe(
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
      tap((result) => this._initialized$.next(result)),
    );
  }

  clearLocalSession(): void {
    this._isAuthenticated$.next(false);
    this._currentUser$.next(null);
  }

  isAuthenticated(): boolean {
    return this._isAuthenticated$.value;
  }

  get currentUser(): CurrentUser | null {
    return this._currentUser$.value;
  }

  logout(): void {
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
