import { z } from 'zod';
import { BD_DIVISION_VALUES, getCities } from '@/data/locations';

// Youngest age a creator may be at sign-up. Product decision (Draft v1
// §6 Q2 resolved to 14): a hard client-side block, since there is no
// backend yet to soft-flag an underage signup to.
export const MINIMUM_CREATOR_AGE = 14;

export const GENDER_VALUES = ['male', 'female', 'other', 'prefer_not_to_say'] as const;
export type Gender = (typeof GENDER_VALUES)[number];

// Display labels for the Step 1 gender picker (requirements §3 Screen 1:
// Male / Female / Other / Prefer not to say).
export const GENDER_OPTIONS: { label: string; value: Gender }[] = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
  { label: 'Prefer not to say', value: 'prefer_not_to_say' },
];

/**
 * Whole years between `isoDate` and `now`, in local time. Returns `NaN` for
 * an unparseable string so a bad value fails the schema rather than passing
 * as age 0.
 */
export function ageInYears(isoDate: string, now: Date = new Date()): number {
  const dob = new Date(isoDate);
  if (Number.isNaN(dob.getTime())) return NaN;

  let age = now.getFullYear() - dob.getFullYear();
  const monthDelta = now.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

// Onboarding Step 1 - Basic Information. `dateOfBirth` is the ISO string a
// `CalendarPicker` selection produces (`Date.prototype.toISOString()`),
// matching the convention the retired DateOfBirth scene and EditProfile use.
export const basicInformationSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name'),
  gender: z.enum(GENDER_VALUES, { message: 'Select your gender' }),
  dateOfBirth: z
    .string()
    .min(1, 'Select your date of birth')
    .refine(value => ageInYears(value) >= MINIMUM_CREATOR_AGE, {
      message: `You must be at least ${MINIMUM_CREATOR_AGE} to join Influsis`,
    }),
});

export type BasicInformationValues = z.infer<typeof basicInformationSchema>;

// Onboarding Step 2 - Location (requirements §3 Screen 2). Country is locked
// to Bangladesh for V1; the shape stays country-generic so a US launch adds
// a data table and a `division` value set, not new fields. `city` is a hard
// filter in Search & Discovery, so the refine rejects anything that is not
// one of the chosen division's districts - a picked value, never free text.
export const locationSchema = z
  .object({
    country: z.literal('bangladesh'),
    division: z.enum(BD_DIVISION_VALUES, { message: 'Select your division' }),
    city: z.string().min(1, 'Select your city'),
    zip: z.string().trim().optional(),
  })
  .refine(
    data => getCities(data.country, data.division).some(option => option.value === data.city),
    {
      path: ['city'],
      message: 'Select your city',
    },
  );

export type LocationValues = z.infer<typeof locationSchema>;
