import { describe, expect, jest, test } from '@jest/globals';
import { CampaignFeedDetail, CampaignRequirementSection } from '../types/campaignFeed';
import {
  formatCampaignLocation,
  formatDeliverable,
  formatPreferredGender,
  getBriefSections,
  getCampaignDetailsAvatarUrl,
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
