import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _isAuthenticated$ = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this._isAuthenticated$.asObservable();

  constructor(private http: HttpClient) {}

  checkSession(): Observable<boolean> {
    return this.http.get<any>(`${environment.apiUrl}/api/auth/me`).pipe(
      map((): boolean => true),
      tap((authenticated: boolean) => this._isAuthenticated$.next(authenticated)),
      catchError(() => {
        this._isAuthenticated$.next(false);
        return of(false);
      })
    );
  }

  setAuthenticated(status: boolean): void {
    this._isAuthenticated$.next(status);
  }

  isAuthenticated(): boolean {
    return this._isAuthenticated$.value;
  }

  logout(): void {
    this.http.post(`${environment.apiUrl}/api/auth/logout`, {}).subscribe({
      next: () => this._isAuthenticated$.next(false),
      error: () => this._isAuthenticated$.next(false),
    });
  }
}
