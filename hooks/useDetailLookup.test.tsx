import { test, expect, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { useDetailLookup } from './useDetailLookup';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  Redirect: () => null,
}));

const mockedUseLocalSearchParams = useLocalSearchParams as jest.Mock;

interface Item {
  id: string;
  name: string;
}

const list: Item[] = [
  { id: 'a', name: 'Item A' },
  { id: 'b', name: 'Item B' },
];

describe('useDetailLookup', () => {
  test('returns the matching item and no redirect when the id matches', () => {
    mockedUseLocalSearchParams.mockReturnValue({ id: 'b' });
    const { result } = renderHook(() => useDetailLookup(list));

    expect(result.current.item).toEqual({ id: 'b', name: 'Item B' });
    expect(result.current.notFoundElement).toBeNull();
  });

  test('returns a redirect element when the id has no match', () => {
    mockedUseLocalSearchParams.mockReturnValue({ id: 'missing' });
    const { result } = renderHook(() => useDetailLookup(list));

    expect(result.current.item).toBeUndefined();
    expect(result.current.notFoundElement).not.toBeNull();
  });
});
