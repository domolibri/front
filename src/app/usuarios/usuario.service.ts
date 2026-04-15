import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CriarUsuarioDto {
  nome: string;
  email: string;
  tipoVinculo: string;
}

export interface VinculoUsuarioResponseDto {
  id: string;
  nome: string;
  email: string;
  tipoVinculo: string;
  status: string;
  dataEntrada: string;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/usuarios`;

  getUsuarios(): Observable<VinculoUsuarioResponseDto[]> {
    return this.http.get<VinculoUsuarioResponseDto[]>(this.baseUrl);
  }

  cadastrarUsuario(payload: CriarUsuarioDto): Observable<VinculoUsuarioResponseDto> {
    return this.http.post<VinculoUsuarioResponseDto>(this.baseUrl, payload);
  }
}
