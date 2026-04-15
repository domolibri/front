import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UsuarioListComponent } from './usuario-list.component';
import { UsuarioService } from './usuario.service';

describe('UsuarioListComponent', () => {
  let component: UsuarioListComponent;
  let fixture: ComponentFixture<UsuarioListComponent>;
  let usuarioServiceMock: { getUsuarios: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    usuarioServiceMock = {
      getUsuarios: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [UsuarioListComponent],
      providers: [{ provide: UsuarioService, useValue: usuarioServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(UsuarioListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load usuarios on init', () => {
    expect(usuarioServiceMock.getUsuarios).toHaveBeenCalled();
  });

  it('should store error message when the request fails', () => {
    usuarioServiceMock.getUsuarios.mockReturnValueOnce(
      throwError(() => ({ error: { detail: 'Falha ao carregar usuários.' } })),
    );

    const freshFixture = TestBed.createComponent(UsuarioListComponent);
    freshFixture.detectChanges();

    expect(freshFixture.componentInstance['errorMessage']()).toBe('Falha ao carregar usuários.');
  });
});
