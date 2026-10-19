import { describe, expect, test } from '@jest/globals';
import { notificationLinkPath, readParam } from './linkPath';

describe('notificationLinkPath', () => {
  test.each([
    ['https://app.influsis.com/engagement/e-1?n=abc', '/engagement/e-1?n=abc'],
    ['http://localhost:8081/engagement/e-1?n=abc', '/engagement/e-1?n=abc'],
    ['influsis://engagement/e-1?n=abc', '/engagement/e-1?n=abc'],
    ['influsis:///engagement/e-1?n=abc', '/engagement/e-1?n=abc'],
    ['exp://192.168.0.5:8081/--/engagement/e-1?n=abc', '/engagement/e-1?n=abc'],
    ['https://app.influsis.com/engagement/e-1/?n=abc#top', '/engagement/e-1?n=abc'],
    ['/engagement/e-1?n=abc', '/engagement/e-1?n=abc'],
  ])('%s -> %s', (url, path) => {
    expect(notificationLinkPath(url)).toBe(path);
  });

  test.each([
    '/engagement/e-1',
    '/engagement/e-1/submit-delivery',
    '/engagement/e-1/review',
    '/campaign/c-1',
    '/my-profile',
    '/notifications',
    '/notification-settings',
  ])('%s is a notification path', path => {
    expect(notificationLinkPath(`https://app.influsis.com${path}`)).toBe(path);
  });

  test.each([
    'https://app.influsis.com',
    'https://app.influsis.com/',
    'influsis://',
    'influsis://home',
    'influsis://auth/sign-in',
    'https://app.influsis.com/order/1',
    'https://app.influsis.com/engagement/e-1/deliverables',
    'https://app.influsis.com/engagement',
    'not a url',
  ])('%s is not', url => {
    expect(notificationLinkPath(url)).toBeNull();
  });

  test('keeps the whole query, encoding included', () => {
    expect(notificationLinkPath('influsis://campaign/a%2Fb?tab=x&n=n%201')).toBe(
      '/campaign/a%2Fb?tab=x&n=n%201',
    );
  });
});

describe('readParam', () => {
  test.each([
    ['/engagement/e-1?n=abc', 'abc'],
    ['/engagement/e-1?tab=x&n=abc', 'abc'],
    ['https://app.influsis.com/x?n=a%2Fb#frag', 'a/b'],
  ])('%s -> %s', (url, id) => {
    expect(readParam(url)).toBe(id);
  });

  test.each(['/engagement/e-1', '/engagement/e-1?n=', '/engagement/e-1?n', '/x?nn=1'])(
    '%s has no n',
    url => {
      expect(readParam(url)).toBeNull();
    },
  );
});
