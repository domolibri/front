import { TestBed } from '@angular/core/testing';
import { Injectable, InjectionToken } from '@angular/core';
import { safeInject } from './safe-inject';

@Injectable()
class TestService {
  value = 42;
}

const MISSING_TOKEN = new InjectionToken<string>('MISSING_TOKEN');

describe('safeInject', () => {
  it('should return the service when the token is provided', () => {
    TestBed.configureTestingModule({ providers: [TestService] });

    const result = TestBed.runInInjectionContext(() => safeInject(TestService, 'test'));
    expect(result).toBeInstanceOf(TestService);
    expect((result as TestService).value).toBe(42);
  });

  it('should return null when the token has no provider', () => {
    TestBed.configureTestingModule({});

    let result: string | null = 'sentinel';
    TestBed.runInInjectionContext(() => {
      result = safeInject(MISSING_TOKEN, 'test');
    });

    expect(result).toBeNull();
  });

  it('should log a critical error when injection fails', () => {
    TestBed.configureTestingModule({});
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    TestBed.runInInjectionContext(() => {
      safeInject(MISSING_TOKEN, 'my-interceptor');
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[DI Critical]'),
      expect.stringContaining('my-interceptor'),
      expect.anything(),
    );

    consoleSpy.mockRestore();
  });

  it('should include the token name in the error message', () => {
    TestBed.configureTestingModule({});
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    TestBed.runInInjectionContext(() => {
      safeInject(MISSING_TOKEN, 'test');
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('MISSING_TOKEN'),
      expect.anything(),
      expect.anything(),
    );

    consoleSpy.mockRestore();
  });

  it('should not throw even when injection fails', () => {
    TestBed.configureTestingModule({});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      TestBed.runInInjectionContext(() => safeInject(MISSING_TOKEN, 'test'));
    }).not.toThrow();
  });
});
