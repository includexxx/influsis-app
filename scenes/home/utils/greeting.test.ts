import { describe, expect, test } from '@jest/globals';
import { greetingFor, greetingName } from './greeting';

function at(hour: number) {
  const date = new Date(2026, 9, 5, hour, 30);
  return date;
}

describe('greetingFor', () => {
  test('morning before noon, afternoon until 5pm, evening after', () => {
    expect(greetingFor(at(0))).toBe('Good morning');
    expect(greetingFor(at(11))).toBe('Good morning');
    expect(greetingFor(at(12))).toBe('Good afternoon');
    expect(greetingFor(at(16))).toBe('Good afternoon');
    expect(greetingFor(at(17))).toBe('Good evening');
    expect(greetingFor(at(23))).toBe('Good evening');
  });
});

describe('greetingName', () => {
  test('prefers the first name, then the handle, then a fallback', () => {
    expect(greetingName({ handle: 'rafi', profile: { name: '  Rafi Ahmed ' } })).toBe('Rafi');
    expect(greetingName({ handle: 'rafi', profile: { name: '' } })).toBe('@rafi');
    expect(greetingName({ handle: null, profile: null })).toBe('there');
    expect(greetingName(undefined)).toBe('there');
  });
});
