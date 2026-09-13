import { z } from 'zod';
import { BD_DIVISION_VALUES, getCities } from '@/data/locations';
import {
  GENDER_VALUES,
  BIO_MIN_LENGTH,
  BIO_MAX_LENGTH,
  pickedImageSchema,
  handleSchema,
  ageInYears,
  MINIMUM_CREATOR_AGE,
} from './onboardingSchemas';

// Edit Profile (`scenes/main/EditProfile.tsx`) needs its own schema rather
// than reusing the onboarding step schemas directly: every onboarding step
// schema is mandatory (`bioStepSchema` requires 20+ chars, `locationSchema`
// requires a division, `categoriesStepSchema` requires >=1 category) because
// the wizard collects each field exactly once on a required path. An edit
// form must let a creator leave a field blank or clear it, so every field
// here is optional — composed from the same primitives the onboarding
// schemas use, not duplicated by hand.

// A blank string is the "not selected" state for these fields (the picker
// UIs write '' when nothing is chosen); `.or(z.literal(''))` is layered onto
// each otherwise-strict validator so an empty field passes and an actually
// non-empty value still gets checked. Backend clearing semantics
// (`''` -> explicit `null`) are handled in `utils/profileMappers.ts`, not here.
const optionalNonEmpty = (max: number) => z.string().trim().max(max).or(z.literal(''));

export const editProfileSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name'),
  handle: handleSchema.or(z.literal('')).optional(),

  avatarPhoto: pickedImageSchema.optional(),
  coverPhoto: pickedImageSchema.optional(),

  gender: z.enum(GENDER_VALUES).or(z.literal('')).optional(),
  dateOfBirth: z
    .string()
    .refine(value => value === '' || ageInYears(value) >= MINIMUM_CREATOR_AGE, {
      message: `You must be at least ${MINIMUM_CREATOR_AGE} to use Influsis`,
    })
    .optional(),
  bio: z
    .string()
    .trim()
    .refine(
      value => value === '' || (value.length >= BIO_MIN_LENGTH && value.length <= BIO_MAX_LENGTH),
      {
        message: `Write ${BIO_MIN_LENGTH}-${BIO_MAX_LENGTH} characters, or leave it blank`,
      },
    )
    .optional(),

  country: z.literal('bangladesh').or(z.literal('')).optional(),
  state: z.enum(BD_DIVISION_VALUES).or(z.literal('')).optional(),
  city: z.string().optional(),
  postalCode: optionalNonEmpty(20).optional(),
  address: optionalNonEmpty(300).optional(),

  contactEmail: z.string().email().or(z.literal('')).optional(),
  contactPhone: optionalNonEmpty(20).optional(),
  websiteUrl: z.string().url().or(z.literal('')).optional(),

  categories: z.array(z.string()),
  subcategories: z.array(z.string()),
  languages: z.array(z.string()),
  deliverables: z.array(z.string()),

  portfolio: z.array(
    z.object({
      id: z.string(),
      url: z.string().trim().min(1, 'Add a link or remove this entry'),
      platform: z.string().min(1),
      thumbnail: pickedImageSchema.optional(),
    }),
  ),

  isDiscoverable: z.boolean(),
});

export type EditProfileValues = z.infer<typeof editProfileSchema>;

/** City options for the currently selected state (division); `[]` before one is picked. */
export function editProfileCities(state: string | undefined) {
  return getCities('bangladesh', state);
}
