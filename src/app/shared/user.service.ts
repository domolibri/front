import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Role {
  id: string;
  nome: string;
  descricao?: string | null;
}

export interface InviteUserPayload {
  email: string;
  roleId: string;
}

export interface InviteUserResponse {
  conviteId: string;
  message: string;
}

export interface InviteDetails {
  email: string;
  nomeEditora: string;
  roleId: string;
  usuarioExiste?: boolean;
}

export interface AcceptInvitePayload {
  token: string;
  nome?: string;
  senha?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/users`;

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.base}/roles`);
  }

  inviteUser(payload: InviteUserPayload): Observable<InviteUserResponse> {
    return this.http.post<InviteUserResponse>(`${this.base}/invite`, payload);
  }

  getInviteDetails(token: string): Observable<InviteDetails> {
    return this.http.get<InviteDetails>(`${this.base}/invite/${token}`);
  }

  acceptInvite(payload: AcceptInvitePayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/invite/accept`, payload);
  }
}
