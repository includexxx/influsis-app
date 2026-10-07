import { describe, expect, jest, test } from '@jest/globals';
import { CampaignFeedDetail, CampaignRequirementSection } from '../types/campaignFeed';
import {
  formatCampaignLocation,
  formatCategoryLabel,
  formatDeliverable,
  formatPostedDate,
  formatPreferredGender,
  getAudienceGroups,
  getBriefSections,
  getCampaignDetailsAvatarUrl,
  getDeadlineCountdown,
} from './mapCampaignDetails';

jest.mock('@/utils/config', () => ({
  __esModule: true,
  default: { apiUrl: 'http://192.168.0.10:3001/api/v1' },
}));

function section(overrides: Partial<CampaignRequirementSection>): CampaignRequirementSection {
  return {
    id: 's',
    sectionKey: 'custom',
    label: 'Section',
    hint: null,
    icon: null,
    tone: null,
    layout: 'list',
    sortOrder: 0,
    items: ['item'],
    readOnly: false,
    ...overrides,
  };
}

const business = {
  businessId: 'b1',
  businessName: 'Dhaka Delights Ltd.',
  avatarUrl: null as string | null,
  verificationStatus: 'verified',
};

describe('getCampaignDetailsAvatarUrl', () => {
  test("prefers the campaign's own avatar, resolving a localhost origin", () => {
    const campaign = {
      avatarUrl: 'http://localhost:3001/uploads/campaign-images/a.webp',
      business: { ...business, avatarUrl: 'https://cdn.test/logo.png' },
    } as CampaignFeedDetail;
    expect(getCampaignDetailsAvatarUrl(campaign)).toBe(
      'http://192.168.0.10:3001/uploads/campaign-images/a.webp',
    );
  });

  test("falls back to the business avatar only when it's an absolute URL", () => {
    const withUrl = {
      avatarUrl: null,
      business: { ...business, avatarUrl: 'https://cdn.test/logo.png' },
    } as CampaignFeedDetail;
    const withKey = {
      avatarUrl: null,
      business: { ...business, avatarUrl: 'profile-images/logo.png' },
    } as CampaignFeedDetail;
    expect(getCampaignDetailsAvatarUrl(withUrl)).toBe('https://cdn.test/logo.png');
    expect(getCampaignDetailsAvatarUrl(withKey)).toBeNull();
  });
});

describe('formatDeliverable', () => {
  test('labels count, type and platform', () => {
    expect(formatDeliverable({ id: 'd', platform: 'instagram', type: 'reels', count: 3 })).toEqual({
      title: '3 × Reels',
      description: 'Instagram',
    });
  });

  test('passes unknown values through', () => {
    expect(formatDeliverable({ id: 'd', platform: 'ugc', type: 'livestream', count: 1 })).toEqual({
      title: '1 × livestream',
      description: 'UGC',
    });
  });
});

describe('formatPreferredGender', () => {
  test('capitalizes the stored value', () => {
    expect(formatPreferredGender('any')).toBe('Any');
    expect(formatPreferredGender('female')).toBe('Female');
  });
});

describe('formatCampaignLocation', () => {
  test('joins the parts that are set', () => {
    expect(formatCampaignLocation({ city: 'Dhaka', state: null, country: 'Bangladesh' })).toBe(
      'Dhaka, Bangladesh',
    );
  });

  test('returns null when nothing is set', () => {
    expect(formatCampaignLocation({ city: null, state: null, country: null })).toBeNull();
  });
});

describe('getBriefSections', () => {
  test('drops the deliverables projection and empty sections, and sorts by sortOrder', () => {
    const result = getBriefSections([
      section({ id: 'timing', sectionKey: 'timing', sortOrder: 2 }),
      section({ id: 'deliverables', sectionKey: 'deliverables', sortOrder: 1 }),
      section({ id: 'empty', sortOrder: 3, items: [] }),
      section({ id: 'dos', sortOrder: 0 }),
    ]);
    expect(result.map(s => s.id)).toEqual(['dos', 'timing']);
  });
});

describe('getDeadlineCountdown', () => {
  const today = new Date(2026, 9, 7); // 07 Oct, 2026, local time

  test('counts whole calendar days left', () => {
    expect(getDeadlineCountdown('2026-10-20', today)).toEqual({
      label: '13 days left',
      state: 'open',
    });
    expect(getDeadlineCountdown('2026-10-10', today)).toEqual({
      label: '3 days left',
      state: 'soon',
    });
    expect(getDeadlineCountdown('2026-10-08', today)).toEqual({
      label: '1 day left',
      state: 'soon',
    });
  });

  test('marks today and past deadlines', () => {
    expect(getDeadlineCountdown('2026-10-07', today)).toEqual({
      label: 'Closes today',
      state: 'today',
    });
    expect(getDeadlineCountdown('2026-10-06', today)).toEqual({ label: 'Closed', state: 'closed' });
  });

  test('ignores a late hour on the current day', () => {
    expect(getDeadlineCountdown('2026-10-08', new Date(2026, 9, 7, 23, 59))?.label).toBe(
      '1 day left',
    );
  });

  test('returns null for a missing or malformed deadline', () => {
    expect(getDeadlineCountdown(null, today)).toBeNull();
    expect(getDeadlineCountdown('soon', today)).toBeNull();
  });
});

describe('formatPostedDate', () => {
  test('formats the date part of the timestamp', () => {
    expect(formatPostedDate('2026-09-26T10:19:12.511Z')).toBe('26 Sep, 2026');
    expect(formatPostedDate(null)).toBeNull();
    expect(formatPostedDate('garbage')).toBeNull();
  });
});

describe('formatCategoryLabel', () => {
  test('uses the known label, else capitalizes the key', () => {
    expect(formatCategoryLabel('beauty')).toBe('Beauty & Lifestyle');
    expect(formatCategoryLabel('gadgets')).toBe('Gadgets');
  });
});

describe('getAudienceGroups', () => {
  test('keeps only the filled-in groups, in order', () => {
    expect(
      getAudienceGroups({
        audienceLocation: 'Dhaka',
        ageRanges: ['18-24'],
        interests: [],
        subCategories: [],
        objectives: ['Awareness'],
      }),
    ).toEqual([
      { label: 'Location', items: ['Dhaka'] },
      { label: 'Age range', items: ['18-24'] },
      { label: 'Objectives', items: ['Awareness'] },
    ]);
  });

  test('is empty when nothing is targeted', () => {
    expect(
      getAudienceGroups({
        audienceLocation: null,
        ageRanges: [],
        interests: [],
        subCategories: [],
        objectives: [],
      }),
    ).toEqual([]);
  });
});
