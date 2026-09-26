import { describe, expect, test } from '@jest/globals';
import { formatCreatorLocation, getCreatorInitial } from './creatorLocation';

describe('formatCreatorLocation', () => {
  test('joins city, state and country with ", "', () => {
    expect(formatCreatorLocation('Dhaka', 'Dhaka Division', 'Bangladesh')).toBe(
      'Dhaka, Dhaka Division, Bangladesh',
    );
  });

  test('skips missing parts', () => {
    expect(formatCreatorLocation('Dhaka', null, 'Bangladesh')).toBe('Dhaka, Bangladesh');
    expect(formatCreatorLocation(null, null, 'Bangladesh')).toBe('Bangladesh');
  });

  test('falls back to "Location not set" when nothing is set', () => {
    expect(formatCreatorLocation(null, null, null)).toBe('Location not set');
  });
});

describe('getCreatorInitial', () => {
  test('uppercases the first letter of the display name', () => {
    expect(getCreatorInitial('sunehra tasnim')).toBe('S');
  });

  test('falls back to "?" for an empty or blank name', () => {
    expect(getCreatorInitial('')).toBe('?');
    expect(getCreatorInitial('   ')).toBe('?');
  });
});
