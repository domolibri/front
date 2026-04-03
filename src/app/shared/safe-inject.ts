import { inject, ProviderToken } from '@angular/core';

/**
 * Wraps Angular's inject() with error handling for use in interceptors and guards.
 *
 * If the token cannot be resolved (e.g. missing provider, broken DI tree), logs a
 * critical error and returns null instead of crashing the application. The caller is
 * responsible for defining the appropriate fallback behaviour (pass-through, redirect,
 * etc.) when null is returned.
 *
 * @param token  The Angular DI token to resolve.
 * @param context  A human-readable label identifying the call site (interceptor/guard
 *                 name), used to make error messages actionable.
 * @returns The resolved service, or null if injection failed.
 */
export function safeInject<T>(token: ProviderToken<T>, context: string): T | null {
  try {
    return inject(token);
  } catch (err) {
    const tokenName = (token as { name?: string }).name ?? String(token);
    console.error(
      `[DI Critical] Could not inject "${tokenName}" in "${context}". ` +
        'Verify that all required providers are registered.',
      err,
    );
    return null;
  }
}
