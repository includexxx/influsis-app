import { describe, expect, test } from '@jest/globals';
import { socketOrigin } from './socketOrigin';

describe('socketOrigin', () => {
  test.each([
    ['http://10.0.2.2:3000/api/v1', 'http://10.0.2.2:3000'],
    ['https://api.influsis.com/api/v1', 'https://api.influsis.com'],
    ['https://api.influsis.com', 'https://api.influsis.com'],
    ['http://localhost:3000/', 'http://localhost:3000'],
    ['  https://api.influsis.com:8443/api/v1?x=1  ', 'https://api.influsis.com:8443'],
  ])('%s -> %s', (apiUrl, origin) => {
    expect(socketOrigin(apiUrl)).toBe(origin);
  });

  test('rejects a value that is not an http(s) URL', () => {
    expect(() => socketOrigin('api.influsis.com')).toThrow();
  });
});
