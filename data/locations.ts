// Location data for the creator onboarding Location step (build-plan 20b),
// ported from the web app (`../web/src/data/locations/`) so both apps store
// identical values against a future shared backend contract. V1 is
// Bangladesh only; the helpers are shaped country-generic so a US launch
// adds a data table plus a branch, not new call sites.

export interface LocationOption {
  value: string;
  label: string;
}

// V1: Country is locked. `value` is what gets stored / sent.
export const LOCKED_COUNTRY: LocationOption = { value: 'bangladesh', label: 'Bangladesh' };

// Bangladesh's 8 administrative divisions. Values are the web app's lowercase
// keys; labels are its transliterations (see current-feature.md open question
// on Chittagong/Chattogram - values stay stable regardless).
export const BD_DIVISION_VALUES = [
  'barisal',
  'chittagong',
  'dhaka',
  'khulna',
  'mymensingh',
  'rajshahi',
  'rangpur',
  'sylhet',
] as const;

export type BdDivision = (typeof BD_DIVISION_VALUES)[number];

export const BD_DIVISIONS: LocationOption[] = [
  { value: 'barisal', label: 'Barisal' },
  { value: 'chittagong', label: 'Chittagong' },
  { value: 'dhaka', label: 'Dhaka' },
  { value: 'khulna', label: 'Khulna' },
  { value: 'mymensingh', label: 'Mymensingh' },
  { value: 'rajshahi', label: 'Rajshahi' },
  { value: 'rangpur', label: 'Rangpur' },
  { value: 'sylhet', label: 'Sylhet' },
];

// Bangladesh's 64 districts, grouped by division - copied verbatim from
// web/src/data/locations/bd-districts.ts. Rendered as the "City" field:
// Bangladeshi address forms conventionally use "City" for this district
// level, and finer granularity (upazila/thana) has no reliable free dataset.
// Keys match BD_DIVISION_VALUES.
export const BD_DISTRICTS_BY_DIVISION: Record<string, string[]> = {
  barisal: ['Barguna', 'Barisal', 'Bhola', 'Jhalokati', 'Patuakhali', 'Pirojpur'],
  chittagong: [
    'Bandarban',
    'Brahmanbaria',
    'Chandpur',
    'Chittagong',
    'Comilla',
    "Cox's Bazar",
    'Feni',
    'Khagrachari',
    'Lakshmipur',
    'Noakhali',
    'Rangamati',
  ],
  dhaka: [
    'Dhaka',
    'Faridpur',
    'Gazipur',
    'Gopalganj',
    'Kishoreganj',
    'Madaripur',
    'Manikganj',
    'Munshiganj',
    'Narayanganj',
    'Narsingdi',
    'Rajbari',
    'Shariatpur',
    'Tangail',
  ],
  khulna: [
    'Bagerhat',
    'Chuadanga',
    'Jessore',
    'Jhenaidah',
    'Khulna',
    'Kushtia',
    'Magura',
    'Meherpur',
    'Narail',
    'Satkhira',
  ],
  mymensingh: ['Jamalpur', 'Mymensingh', 'Netrokona', 'Sherpur'],
  rajshahi: [
    'Bogra',
    'Chapai Nawabganj',
    'Joypurhat',
    'Naogaon',
    'Natore',
    'Pabna',
    'Rajshahi',
    'Sirajganj',
  ],
  rangpur: [
    'Dinajpur',
    'Gaibandha',
    'Kurigram',
    'Lalmonirhat',
    'Nilphamari',
    'Panchagarh',
    'Rangpur',
    'Thakurgaon',
  ],
  sylhet: ['Habiganj', 'Moulvibazar', 'Sunamganj', 'Sylhet'],
};

const DIVISIONS_BY_COUNTRY: Record<string, LocationOption[]> = {
  bangladesh: BD_DIVISIONS,
};

const DIVISION_LABEL_BY_VALUE: Record<string, string> = Object.fromEntries(
  BD_DIVISIONS.map(division => [division.value, division.label]),
);

/** Division options for a country, or `[]` before/if the country is unknown. */
export function getDivisions(country: string | undefined | null): LocationOption[] {
  if (!country) return [];
  return DIVISIONS_BY_COUNTRY[country] ?? [];
}

/**
 * City options for a country + division pair, or `[]` when either is missing.
 * Bangladesh resolves synchronously from the bundled district table.
 */
export function getCities(
  country: string | undefined | null,
  division: string | undefined | null,
): LocationOption[] {
  if (!country || !division) return [];
  if (country === 'bangladesh') {
    return (BD_DISTRICTS_BY_DIVISION[division] ?? []).map(name => ({ value: name, label: name }));
  }
  return [];
}

/** A division value back to its label, for a summary/review view. */
export function getDivisionLabel(value: string | undefined | null): string {
  if (!value) return '';
  return DIVISION_LABEL_BY_VALUE[value] ?? value;
}
