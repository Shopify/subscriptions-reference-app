import {describe, it, expect} from 'vitest';
import {isVersionSupported} from '../versionComparison';

describe('isVersionSupported', () => {
  const MINIMUM_VERSION = '10.15.0';

  it('should return true for higher major version', () => {
    expect(isVersionSupported('11.0.0', MINIMUM_VERSION)).toBe(true);
  });

  it('should return false for lower major version', () => {
    expect(isVersionSupported('9.99.99', MINIMUM_VERSION)).toBe(false);
  });

  it('should return true for same major, higher minor version', () => {
    expect(isVersionSupported('10.16.0', MINIMUM_VERSION)).toBe(true);
  });

  it('should return false for same major, lower minor version', () => {
    expect(isVersionSupported('10.13.0', MINIMUM_VERSION)).toBe(false);
    expect(isVersionSupported('10.14.9', MINIMUM_VERSION)).toBe(false);
  });

  it('should return true for same major and minor, higher patch', () => {
    expect(isVersionSupported('10.15.1', MINIMUM_VERSION)).toBe(true);
  });

  it('should return true for exact same version', () => {
    expect(isVersionSupported('10.15.0', MINIMUM_VERSION)).toBe(true);
  });

  it('should return false for same major and minor, lower patch', () => {
    expect(isVersionSupported('10.15.0', '10.15.1')).toBe(false);
  });

  it('should handle missing version parts (defaults to 0)', () => {
    expect(isVersionSupported('10.15', '10.15.0')).toBe(true);
    expect(isVersionSupported('10', '10.0.0')).toBe(true);
  });
});
