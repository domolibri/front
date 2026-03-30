import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RegisterEditoraRequest {
  nomeEditora: string;
  emailAdmin: string;
  senha: string;
  nomeAdmin: string;
}

export interface RegisterEditoraResponse {
  editoraId: string;
  message: string;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
  message: string;
}

export interface VerifyEmailResponse {
  message: string;
}

export class EmailNotVerifiedError extends Error {
  constructor() {
    super('E-mail não verificado.');
    this.name = 'EmailNotVerifiedError';
  }
}

@Injectable({
  providedIn: 'root',
})
export class Onboarding {
  private readonly baseUrl = `${environment.apiUrl}/api/auth`;

  constructor(private http: HttpClient) {}

  registerEditora(payload: RegisterEditoraRequest): Observable<RegisterEditoraResponse> {
    return this.http.post<RegisterEditoraResponse>(`${this.baseUrl}/register`, payload);
  }

  login(email: string, senha: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/login`, { email, senha } satisfies LoginRequest)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401 && error.error?.detail === 'E-mail não verificado.') {
            return throwError(() => new EmailNotVerifiedError());
          }
          return throwError(() => error);
        })
      );
  }

  verifyEmail(email: string, token: string): Observable<VerifyEmailResponse> {
    return this.http.post<VerifyEmailResponse>(`${this.baseUrl}/verify-email`, { email, token });
  }
}
