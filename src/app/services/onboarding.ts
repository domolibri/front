import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RegisterEditoraRequest {
  nomeEditora: string;
  emailAdmin: string;
  senha: string;
  nomeAdmin: string;
}

export interface RegisterEditoraResponse {
  editoraId: string;
  token: string;
  message: string;
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
}
