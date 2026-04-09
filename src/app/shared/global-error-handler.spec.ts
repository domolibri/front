import { TestBed } from '@angular/core/testing';
import { ErrorHandler } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { vi } from 'vitest';

import { GlobalErrorHandler } from './global-error-handler';
import { SnackbarService } from './snackbar.service';

const mockSnackbar = { show: vi.fn() };

function makeHandler(): GlobalErrorHandler {
  TestBed.configureTestingModule({
    providers: [
      GlobalErrorHandler,
      { provide: SnackbarService, useValue: mockSnackbar },
      { provide: ErrorHandler, useExisting: GlobalErrorHandler },
    ],
  });
  return TestBed.inject(GlobalErrorHandler);
}

describe('GlobalErrorHandler', () => {
  let handler: GlobalErrorHandler;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockSnackbar.show.mockReset();
    handler = makeHandler();
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => consoleSpy.mockRestore());

  // ─── Snackbar messages ────────────────────────────────────────────────────

  it('shows a connection error message for status 0', () => {
    handler.handleError(new HttpErrorResponse({ status: 0, url: '/api/test' }));
    expect(mockSnackbar.show).toHaveBeenCalledWith(
      expect.stringContaining('conexão'),
      'error',
    );
  });

  it('shows a server error message for 5xx', () => {
    handler.handleError(new HttpErrorResponse({ status: 503, url: '/api/test' }));
    expect(mockSnackbar.show).toHaveBeenCalledWith(
      expect.stringContaining('servidor'),
      'error',
    );
  });

  it('shows a permission error message for 403', () => {
    handler.handleError(new HttpErrorResponse({ status: 403, url: '/api/test' }));
    expect(mockSnackbar.show).toHaveBeenCalledWith(
      expect.stringContaining('permissão'),
      'error',
    );
  });

  it('shows a not-found message for 404', () => {
    handler.handleError(new HttpErrorResponse({ status: 404, url: '/api/test' }));
    expect(mockSnackbar.show).toHaveBeenCalledWith(
      expect.stringContaining('encontrado'),
      'error',
    );
  });

  it('shows a generic message for plain Error', () => {
    handler.handleError(new Error('Something broke'));
    expect(mockSnackbar.show).toHaveBeenCalledWith(
      expect.stringContaining('inesperado'),
      'error',
    );
  });

  it('shows a generic message for unknown values', () => {
    handler.handleError('a plain string error');
    expect(mockSnackbar.show).toHaveBeenCalledWith(
      expect.stringContaining('inesperado'),
      'error',
    );
  });

  // ─── Chunk-load errors (no snackbar) ─────────────────────────────────────

  it('does NOT show snackbar for chunk-load errors', () => {
    handler.handleError(new Error('Loading chunk 3 failed.'));
    expect(mockSnackbar.show).not.toHaveBeenCalled();
  });

  it('does NOT show snackbar for dynamic import errors', () => {
    handler.handleError(new Error('Failed to fetch dynamically imported module'));
    expect(mockSnackbar.show).not.toHaveBeenCalled();
  });

  // ─── Log sanitization ─────────────────────────────────────────────────────

  it('redacts API URLs from the console log', () => {
    handler.handleError(
      new HttpErrorResponse({ status: 500, url: 'https://api.domolibri.com.br/api/login' }),
    );
    const logged: string = consoleSpy.mock.calls[0]?.join(' ') ?? '';
    expect(logged).not.toContain('api.domolibri.com.br');
    expect(logged).toContain('[redacted]');
  });

  it('redacts Windows-style paths from Error messages', () => {
    handler.handleError(new Error('Failed at C:\\Users\\klebe\\project\\src\\app\\app.ts'));
    const logged: string = consoleSpy.mock.calls[0]?.join(' ') ?? '';
    expect(logged).not.toContain('C:\\Users');
    expect(logged).toContain('[redacted]');
  });

  it('redacts JWT-like tokens from Error messages', () => {
    const fakeJwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    handler.handleError(new Error(`Auth failed with token ${fakeJwt}`));
    const logged: string = consoleSpy.mock.calls[0]?.join(' ') ?? '';
    expect(logged).not.toContain('eyJhbGciOiJIUzI1NiJ9');
  });

  it('always logs to console.error', () => {
    handler.handleError(new Error('test'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[GlobalErrorHandler]'));
  });
});
