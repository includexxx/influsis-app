import { describe, expect, test } from '@jest/globals';
import { passwordStrength } from './passwordStrength';

describe('passwordStrength', () => {
  test.each([
    ['', 0, ''],
    ['abc', 1, 'Weak'],
    ['Abc1!xy', 1, 'Weak'], // all character kinds, but under 8 characters
    ['abcdefgh', 1, 'Weak'],
    ['abcdefg1', 2, 'Fair'],
    ['Abcdefg1', 3, 'Good'],
    ['Abcdef1!', 4, 'Strong'],
  ])('%j -> %i (%s)', (password, score, label) => {
    expect(passwordStrength(password)).toEqual({ score, label });
  });
});
