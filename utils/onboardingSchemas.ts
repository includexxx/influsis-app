import { z } from 'zod';
import { BD_DIVISION_VALUES, getCities } from '@/data/locations';
import { OTHERS_CATEGORY_VALUE } from '@/data/contentCategories';
import { OTHER_OPTION_VALUE } from '@/data/onboardingOptions';
import { isLikelyPortfolioUrl, PORTFOLIO_PLATFORM_VALUES } from '@/data/portfolioPlatforms';

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

// Onboarding Step 2 - Bio (build-plan 21). A required public bio, 20-300
// characters after trimming. `BIO_MAX_LENGTH` doubles as the hard `maxLength`
// on the input; the on-screen counter shows the remaining raw characters.
export const BIO_MIN_LENGTH = 20;
export const BIO_MAX_LENGTH = 300;

export const bioStepSchema = z.object({
  bio: z
    .string()
    .trim()
    .min(BIO_MIN_LENGTH, `Write at least ${BIO_MIN_LENGTH} characters`)
    .max(BIO_MAX_LENGTH, `Keep it under ${BIO_MAX_LENGTH} characters`),
});

export type BioStepValues = z.infer<typeof bioStepSchema>;

// Onboarding Step 3 - Location (requirements §3 Screen 2). Country is locked
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

// Longest "Please specify" string the Others branch of the Content Categories
// step accepts. The requirements doc is silent on a cap; this is a
// repository-native limit, applied to the trimmed value.
export const OTHERS_TEXT_MAX_LENGTH = 60;

// Onboarding steps 4 and 5 - Content Categories, then Subcategories
// (build-plan 20h split the old combined Screen 3 into two consecutive
// steps). `categories` is stored in selection order, not sorted; each entry
// keeps its `subcategories` array so the categories step can carry the
// subcategories step's picks through a Back navigation untouched.
const categoryEntrySchema = z.object({
  value: z.string(),
  subcategories: z.array(z.string()),
});

// Step 4 - Content Categories. Multi-select of the eight categories only;
// selecting `others` requires a non-empty "Please specify" category name.
// Subcategories are chosen on step 5.
export const categoriesStepSchema = z
  .object({
    categories: z.array(categoryEntrySchema).min(1, 'Select at least one category'),
    categoryOthersText: z.string().trim().max(OTHERS_TEXT_MAX_LENGTH).optional(),
  })
  .superRefine((data, ctx) => {
    const hasOthers = data.categories.some(entry => entry.value === OTHERS_CATEGORY_VALUE);
    if (hasOthers && !data.categoryOthersText?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['categoryOthersText'],
        message: 'Tell us what you create',
      });
    }
  });

export type CategoriesStepValues = z.infer<typeof categoriesStepSchema>;

// Step 5 - Subcategories. Every non-`others` category picked on step 4 needs
// at least one subcategory; the `others` category contributes a free-text
// "Please specify" subcategory instead of a checklist.
export const subcategoriesStepSchema = z
  .object({
    categories: z.array(categoryEntrySchema).min(1),
    subcategoryOthersText: z.string().trim().max(OTHERS_TEXT_MAX_LENGTH).optional(),
  })
  .superRefine((data, ctx) => {
    data.categories.forEach((entry, index) => {
      if (entry.value === OTHERS_CATEGORY_VALUE) return;
      if (entry.subcategories.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['categories', index, 'subcategories'],
          message: 'Pick at least one subcategory',
        });
      }
    });
    const hasOthers = data.categories.some(entry => entry.value === OTHERS_CATEGORY_VALUE);
    if (hasOthers && !data.subcategoryOthersText?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['subcategoryOthersText'],
        message: 'Add a subcategory for "Others"',
      });
    }
  });

export type SubcategoriesStepValues = z.infer<typeof subcategoriesStepSchema>;

// The merged step 4 + step 5 draft held in the `creatorOnboarding` slice.
export type ContentCategoriesDraft = CategoriesStepValues & SubcategoriesStepValues;

// Onboarding Steps 6 (Languages) and 7 (Deliverables) are the same multi-select
// control over different fixed option sets (requirements §3 Screens 4-5). Both
// require at least one pick; Languages additionally reveals a free-text row when
// `others` is selected and needs its trimmed value.
export type MultiSelectValues = { selected: string[]; othersText?: string };

function multiSelectSchema({ noun, withOther }: { noun: string; withOther: boolean }) {
  return z
    .object({
      selected: z.array(z.string()).min(1, `Select at least one ${noun}`),
      othersText: z.string().trim().max(OTHERS_TEXT_MAX_LENGTH).optional(),
    })
    .superRefine((data, ctx) => {
      if (withOther && data.selected.includes(OTHER_OPTION_VALUE) && !data.othersText?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['othersText'],
          message: 'Add the language you speak',
        });
      }
    });
}

export const languagesSchema = multiSelectSchema({ noun: 'language', withOther: true });
export const deliverablesSchema = multiSelectSchema({ noun: 'deliverable', withOther: false });

// Onboarding Step 8 - Profile + cover photo (requirements §3 Screens 6-7).
// Both images are optional. A picked image is kept as this descriptor, taken
// straight from `ImagePicker.ImagePickerAsset`, so 20g can drop it into
// `FormData`. `mimeType` / `fileName` are optional because the picker does not
// always populate them.
export type PickedImageAsset = { uri: string; mimeType?: string; fileName?: string };

export const pickedImageSchema = z.object({
  uri: z.string().min(1),
  mimeType: z.string().optional(),
  fileName: z.string().optional(),
});

export const photosSchema = z.object({
  profilePhoto: pickedImageSchema.optional(),
  coverPhoto: pickedImageSchema.optional(),
});

export type PhotosValues = z.infer<typeof photosSchema>;

// Onboarding Step 9 - Portfolio (requirements §3 "Portfolio"). An optional
// list of entry cards; an empty list is valid, but a present entry must carry
// a well-formed link. `id` is a `nanoid()` list/FormData key with no persisted
// meaning yet. Duplicate links are a non-blocking warning handled in the scene,
// not a schema rule.
export const portfolioEntrySchema = z.object({
  id: z.string(),
  url: z.string().refine(isLikelyPortfolioUrl, { message: "This link doesn't look valid" }),
  platform: z.enum(PORTFOLIO_PLATFORM_VALUES),
  thumbnail: pickedImageSchema.optional(),
});

export const portfolioFormSchema = z.object({
  entries: z.array(portfolioEntrySchema),
});

export type PortfolioEntry = z.infer<typeof portfolioEntrySchema>;
export type PortfolioFormValues = z.infer<typeof portfolioFormSchema>;

// Onboarding Step 10 - Username (creator-onboarding-requirements.md §3
// "Username"). The handle is stored bare (no `@`) and lower-cased. The client
// format mirrors the backend's public availability check: 3-20 characters of
// lowercase letters, digits, `.` and `_`, and no leading/trailing `.` or `_`.
// `GET /api/v1/handles/{handle}/availability` is the only real network call
// this app makes.
export const handleSchema = z
  .string()
  .min(3, 'Use 3-20 characters')
  .max(20, 'Use 3-20 characters')
  .regex(/^[a-z0-9._]+$/, 'Lowercase letters, numbers, . and _ only')
  .refine(handle => !/^[._]|[._]$/.test(handle), {
    message: "Can't start or end with . or _",
  });

export const usernameFormSchema = z.object({ handle: handleSchema });

export type UsernameFormValues = z.infer<typeof usernameFormSchema>;

// The unwrapped `data` of a 200 response from the handle availability
// endpoint. Unavailability is an HTTP 200 with `available: false`, never an
// error status; `reason` distinguishes a handle already claimed by a creator
// from one on the reserved-word list.
export type HandleAvailabilityData = {
  available: boolean;
  reason?: 'taken' | 'reserved';
};
