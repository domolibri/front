import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // We no longer store the token in localStorage for security (XSS prevention).
  // Authentication status is now managed by the presence of a HttpOnly cookie 
  // which the browser sends automatically.
  
  private _isAuthenticated = false;

  constructor() {
    // Initial check could be a "me" endpoint or similar
    // For now, we'll assume the app starts unauthenticated and 
    // let the 401 interceptor handle session expiry.
  }

  setAuthenticated(status: boolean): void {
    this._isAuthenticated = status;
  }

  saveToken(token?: string): void {
    // We update our internal auth state.
    // In a cookie-based flow, the backend handles the actual storage.
    this._isAuthenticated = true;
  }

  isAuthenticated(): boolean {
    return this._isAuthenticated;
  }

  logout(): void {
    this._isAuthenticated = false;
    // The actual cookie removal happens on the server-side via the logout endpoint
  }
}
