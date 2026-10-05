import { describe, expect, test } from '@jest/globals';
import { formatBusinessLocation } from './businessCard';

describe('formatBusinessLocation', () => {
  test('joins city and country, skipping blanks', () => {
    expect(formatBusinessLocation({ city: 'Dhaka', country: 'Bangladesh' })).toBe(
      'Dhaka, Bangladesh',
    );
    expect(formatBusinessLocation({ city: '  ', country: 'Bangladesh' })).toBe('Bangladesh');
    expect(formatBusinessLocation({ city: null, country: null })).toBeNull();
  });
});
