import { CreatorOnboardingState } from '@/slices/creatorOnboarding.slice';
import { OTHERS_CATEGORY_VALUE } from '@/data/contentCategories';
import { OTHER_OPTION_VALUE } from '@/data/onboardingOptions';
import { OnboardCreatorProfileRequest, PortfolioItemRequest } from '@/types';
import { OnboardingMediaKeys } from '@/services/mediaUpload';

// Assembles the finished creator onboarding draft, plus already-uploaded
// media keys, into the body for `POST /profiles/onboarding-creator`. This
// file IS the backend contract (see types/profile.ts) — unlike its
// predecessor, which only logged a summary because no submit endpoint
// existed yet.
//
// Caps mirror the backend DTO's `@ArrayMaxSize` so a 422 never surprises the
// user after they've already finished the wizard.
const CATEGORY_CAP = 20;
const SUBCATEGORY_CAP = 50;
const LANGUAGE_CAP = 20;
const DELIVERABLE_CAP = 20;
const PORTFOLIO_CAP = 20;

function dedupe(values: string[]): string[] {
  return [...new Set(values.map(v => v.trim()).filter(v => v !== ''))];
}

/**
 * Folds the "Others" category's free text back in as both the category value
 * and its lone subcategory, then flattens the nested
 * `{ value, subcategories }[]` draft into two flat, deduped arrays.
 */
function flattenCategories(contentCategories: CreatorOnboardingState['contentCategories']): {
  categories: string[];
  subcategories: string[];
} {
  const entries = contentCategories?.categories ?? [];
  const categoryOther = contentCategories?.categoryOthersText?.trim();
  const subcategoryOther = contentCategories?.subcategoryOthersText?.trim() || categoryOther;

  const categories: string[] = [];
  const subcategories: string[] = [];

  for (const entry of entries) {
    const isOther = entry.value === OTHERS_CATEGORY_VALUE;
    categories.push(isOther ? categoryOther || entry.value : entry.value);
    if (isOther) {
      if (subcategoryOther) subcategories.push(subcategoryOther);
    } else {
      subcategories.push(...entry.subcategories);
    }
  }

  return {
    categories: dedupe(categories).slice(0, CATEGORY_CAP),
    subcategories: dedupe(subcategories).slice(0, SUBCATEGORY_CAP),
  };
}

/**
 * Folds the "Others" language's free text back into the selected list.
 * Without this, the literal string `'others'` ships to the server and the
 * language the creator actually typed is lost.
 */
function flattenLanguages(languages: CreatorOnboardingState['languages']): string[] {
  const selected = languages?.selected ?? [];
  const otherText = languages?.othersText?.trim();
  const mapped = selected.map(value => (value === OTHER_OPTION_VALUE ? otherText || value : value));
  return dedupe(mapped).slice(0, LANGUAGE_CAP);
}

function mapPortfolio(
  portfolio: CreatorOnboardingState['portfolio'],
  thumbnailsByEntryId: Record<string, string> | undefined,
): PortfolioItemRequest[] {
  return (portfolio ?? []).slice(0, PORTFOLIO_CAP).map(entry => {
    const item: PortfolioItemRequest = { url: entry.url.trim(), platform: entry.platform };
    const thumbnail = thumbnailsByEntryId?.[entry.id];
    if (thumbnail) item.thumbnail = thumbnail;
    return item;
  });
}

export function buildCreatorOnboardingBody(
  state: CreatorOnboardingState,
  media: OnboardingMediaKeys = {},
): OnboardCreatorProfileRequest {
  const body: OnboardCreatorProfileRequest = {};
  const set = <K extends keyof OnboardCreatorProfileRequest>(
    key: K,
    value: OnboardCreatorProfileRequest[K] | undefined,
  ) => {
    if (value === undefined || value === '') return;
    if (Array.isArray(value) && value.length === 0) return;
    body[key] = value;
  };

  set('name', state.basics?.name?.trim());
  set('gender', state.basics?.gender);
  set('dateOfBirth', state.basics?.dateOfBirth);
  set('bio', state.bio?.trim());

  set('country', state.location?.country);
  set('state', state.location?.division);
  set('city', state.location?.city);
  set('zip', state.location?.zip);

  set('handle', state.handle);

  const { categories, subcategories } = flattenCategories(state.contentCategories);
  set('categories', categories);
  set('subcategories', subcategories);
  set('languages', flattenLanguages(state.languages));
  set('deliverables', dedupe(state.deliverables?.selected ?? []).slice(0, DELIVERABLE_CAP));

  const portfolio = mapPortfolio(state.portfolio, media.portfolioThumbnails);
  set('portfolio', portfolio);

  set('profilePhoto', media.profilePhoto);
  set('coverPhoto', media.coverPhoto);

  return body;
}
