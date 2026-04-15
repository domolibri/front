import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { UsuarioService } from './usuario.service';
import { environment } from '../../environments/environment';

describe('UsuarioService', () => {
  let service: UsuarioService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UsuarioService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(UsuarioService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should fetch usuarios from api/usuarios', () => {
    const mock = [{ id: '1', nome: 'Maria', email: 'maria@test.com', tipoVinculo: 'Interno', status: 'Ativo', dataEntrada: '2026-04-10T20:00:00Z' }];

    service.getUsuarios().subscribe((usuarios) => {
      expect(usuarios).toEqual(mock);
    });

    const req = http.expectOne(`${environment.apiUrl}/api/usuarios`);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('should post a new usuario to api/usuarios', () => {
    const payload = { nome: 'João', email: 'joao@test.com', tipoVinculo: 'Parceiro' };
    const response = { id: '1', ...payload, status: 'Ativo', dataEntrada: '2026-04-10T20:00:00Z' };

    service.cadastrarUsuario(payload).subscribe((usuario) => {
      expect(usuario).toEqual(response);
    });

    const req = http.expectOne(`${environment.apiUrl}/api/usuarios`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(response);
  });
});
