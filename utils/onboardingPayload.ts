import { CreatorOnboardingState } from '@/slices/creatorOnboarding.slice';
import { OTHERS_CATEGORY_VALUE } from '@/data/contentCategories';
import { PickedImageAsset } from './onboardingSchemas';

// Assembles the finished creator onboarding draft into a multipart
// `FormData` body plus a log-safe `summary` object (build-plan 20g). There is
// no create-profile endpoint yet, so `Finish` only builds this and
// `console.log`s the summary. The field names here are NOT a backend
// contract - they are the simplest flat mapping of the slice state and are
// expected to be reconciled with the real submit endpoint when it lands.

// React Native's `FormData` accepts a `{ uri, name, type }` object as a file
// part; the DOM lib types only know `string | Blob`, hence the cast at the
// append site.
type FormDataFilePart = { uri: string; name: string; type: string };

type FilePartSummary = { fileName?: string; mimeType?: string };

function toFilePart(
  asset: PickedImageAsset | undefined,
  fallbackName: string,
): FormDataFilePart | null {
  if (!asset?.uri) return null;
  return {
    uri: asset.uri,
    name: asset.fileName ?? fallbackName,
    type: asset.mimeType ?? 'image/jpeg',
  };
}

function fileSummary(asset: PickedImageAsset): FilePartSummary {
  return { fileName: asset.fileName, mimeType: asset.mimeType };
}

export interface OnboardingSubmission {
  formData: FormData;
  summary: Record<string, unknown>;
}

export function buildOnboardingSubmission(state: CreatorOnboardingState): OnboardingSubmission {
  const {
    basics,
    location,
    contentCategories,
    languages,
    deliverables,
    profilePhoto,
    coverPhoto,
    portfolio,
    handle,
  } = state;

  const formData = new FormData();
  const summary: Record<string, unknown> = {};

  const appendText = (key: string, value: string | undefined) => {
    if (value === undefined || value === '') return;
    formData.append(key, value);
    summary[key] = value;
  };

  appendText('name', basics?.name);
  appendText('gender', basics?.gender);
  appendText('dateOfBirth', basics?.dateOfBirth);
  appendText('country', location?.country);
  appendText('division', location?.division);
  appendText('city', location?.city);
  appendText('zip', location?.zip);
  appendText('handle', handle);

  // The "Others" category carries its name as free text (build-plan 20h):
  // fold it back in as both the category value and its lone subcategory.
  const categoryOther = contentCategories?.categoryOthersText?.trim();
  const subcategoryOther = contentCategories?.subcategoryOthersText?.trim() || categoryOther;
  const categories = (contentCategories?.categories ?? []).map(entry => {
    if (entry.value !== OTHERS_CATEGORY_VALUE) return entry;
    return {
      value: categoryOther || entry.value,
      subcategories: subcategoryOther ? [subcategoryOther] : entry.subcategories,
    };
  });
  const languageList = languages?.selected ?? [];
  const deliverableList = deliverables?.selected ?? [];
  const portfolioEntries = (portfolio ?? []).map(entry => ({
    url: entry.url,
    platform: entry.platform,
  }));

  formData.append('categories', JSON.stringify(categories));
  formData.append('languages', JSON.stringify(languageList));
  formData.append('deliverables', JSON.stringify(deliverableList));
  formData.append('portfolio', JSON.stringify(portfolioEntries));

  summary.categories = categories.map(category => category.value);
  summary.languages = languageList;
  summary.deliverables = deliverableList;
  summary.portfolio = portfolioEntries;
  summary.portfolioCount = portfolioEntries.length;

  const profilePart = toFilePart(profilePhoto, 'profile-photo.jpg');
  if (profilePart && profilePhoto) {
    formData.append('profilePhoto', profilePart as unknown as Blob);
    summary.profilePhoto = fileSummary(profilePhoto);
  }

  const coverPart = toFilePart(coverPhoto, 'cover-photo.jpg');
  if (coverPart && coverPhoto) {
    formData.append('coverPhoto', coverPart as unknown as Blob);
    summary.coverPhoto = fileSummary(coverPhoto);
  }

  summary.photoCount = [profilePart, coverPart].filter(Boolean).length;

  let thumbnailCount = 0;
  for (const entry of portfolio ?? []) {
    const thumbPart = toFilePart(entry.thumbnail, `portfolio-thumbnail-${entry.id}.jpg`);
    if (thumbPart) {
      formData.append(`portfolioThumbnail_${entry.id}`, thumbPart as unknown as Blob);
      thumbnailCount += 1;
    }
  }
  summary.portfolioThumbnailCount = thumbnailCount;

  return { formData, summary };
}
