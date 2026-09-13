import { describe, expect, test } from '@jest/globals';
import {
  BD_DISTRICTS_BY_DIVISION,
  BD_DIVISION_VALUES,
  getCities,
  getDivisionLabel,
  getDivisions,
  LOCKED_COUNTRY,
} from './locations';

describe('locations', () => {
  test('V1 country is Bangladesh, locked', () => {
    expect(LOCKED_COUNTRY).toEqual({ value: 'bangladesh', label: 'Bangladesh' });
  });

  test('has all 8 Bangladesh divisions', () => {
    expect(getDivisions('bangladesh')).toHaveLength(8);
    expect(BD_DIVISION_VALUES).toHaveLength(8);
  });

  test('getDivisions is empty for an unknown or missing country', () => {
    expect(getDivisions('united-states')).toEqual([]);
    expect(getDivisions(undefined)).toEqual([]);
    expect(getDivisions('')).toEqual([]);
  });

  test('getCities returns the division districts as {value,label}', () => {
    expect(getCities('bangladesh', 'dhaka')).toHaveLength(13);
    expect(getCities('bangladesh', 'sylhet')).toEqual([
      { value: 'Habiganj', label: 'Habiganj' },
      { value: 'Moulvibazar', label: 'Moulvibazar' },
      { value: 'Sunamganj', label: 'Sunamganj' },
      { value: 'Sylhet', label: 'Sylhet' },
    ]);
  });

  test('getCities is empty without a country or division', () => {
    expect(getCities('bangladesh', '')).toEqual([]);
    expect(getCities('bangladesh', undefined)).toEqual([]);
    expect(getCities('', 'dhaka')).toEqual([]);
    expect(getCities('bangladesh', 'atlantis')).toEqual([]);
  });

  test('every district-table key is a known division value', () => {
    const values = new Set<string>(BD_DIVISION_VALUES);
    for (const key of Object.keys(BD_DISTRICTS_BY_DIVISION)) {
      expect(values.has(key)).toBe(true);
    }
    expect(Object.keys(BD_DISTRICTS_BY_DIVISION)).toHaveLength(8);
  });

  test('all 64 districts are present, none duplicated', () => {
    const all = Object.values(BD_DISTRICTS_BY_DIVISION).flat();
    expect(all).toHaveLength(64);
    expect(new Set(all).size).toBe(64);
  });

  test('getDivisionLabel maps a value to its label and passes through unknowns', () => {
    expect(getDivisionLabel('chittagong')).toBe('Chittagong');
    expect(getDivisionLabel('')).toBe('');
    expect(getDivisionLabel('atlantis')).toBe('atlantis');
  });
});
