import { ErrorHandler, inject, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { SnackbarService } from './snackbar.service';

/** Patterns stripped from error messages before logging to avoid leaking
 *  local paths, API URLs, stack frames, or auth tokens. */
const SENSITIVE_PATTERNS: RegExp[] = [
  // Absolute file-system paths (Windows and Unix)
  /[A-Za-z]:\\[^\s]*/g,
  /\/(?:home|usr|var|app|workspace|Users)[^\s]*/g,
  // HTTP origins and API URLs
  /https?:\/\/[^\s"]*/g,
  // Bearer / JWT tokens (Bearer <token> or JWT structure starting with ey)
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
  /\bey[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+(?:\.[A-Za-z0-9\-_]+)?\b/g,
];

function sanitize(value: string): string {
  return SENSITIVE_PATTERNS.reduce((s, pattern) => s.replace(pattern, '[redacted]'), value);
}

function toUserMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'Sem conexão com o servidor. Verifique sua internet.';
    if (error.status >= 500) return 'Erro interno do servidor. Tente novamente em instantes.';
    if (error.status === 403) return 'Você não tem permissão para realizar esta ação.';
    if (error.status === 404) return 'O recurso solicitado não foi encontrado.';
  }
  return 'Ocorreu um erro inesperado. Tente novamente.';
}

function toLogEntry(error: unknown): { message: string; type: string } {
  if (error instanceof HttpErrorResponse) {
    return {
      type: 'HttpErrorResponse',
      message: sanitize(`status=${error.status} url=${error.url ?? ''} message=${error.message}`),
    };
  }
  if (error instanceof Error) {
    return {
      type: error.name,
      message: sanitize(error.message),
    };
  }
  return { type: 'UnknownError', message: sanitize(String(error)) };
}

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly snackbar = inject(SnackbarService);

  handleError(error: unknown): void {
    const entry = toLogEntry(error);
    console.error(`[GlobalErrorHandler] ${entry.type}: ${entry.message}`);

    // Avoid showing a snackbar for chunk-loading errors during lazy-load
    // retries — Angular will handle those internally.
    if (isChunkLoadError(error)) return;

    this.snackbar.show(toUserMessage(error), 'error');
  }
}

function isChunkLoadError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return /loading chunk/i.test(msg) || /failed to fetch dynamically imported module/i.test(msg);
}
