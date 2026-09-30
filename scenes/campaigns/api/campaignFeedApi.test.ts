import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore } from '@reduxjs/toolkit';
import { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError, httpClient } from '@/services/http';
import { clearTokens, setTokens } from '@/services/tokenStore';
import { campaignFeedApi } from './campaignFeedApi';
import { submitDeliverable } from './submitDeliverable';
import { CampaignFeedItem } from '../types/campaignFeed';

const campaign: CampaignFeedItem = {
  id: 'campaign-1',
  title: 'Bkash Branding Campaign',
  type: 'sponsored_post',
  status: 'live',
  coverUrl: 'https://cdn.influsis.test/campaign-1/cover.jpg',
  avatarUrl: 'https://cdn.influsis.test/campaign-1/avatar.jpg',
  budgetAmountMinor: 50000,
  currency: 'BDT',
  licensingTier: 1,
  applicationDeadline: '2026-10-01',
  contentDeadline: null,
  campaignEndDate: null,
  publishedAt: '2026-09-01T00:00:00.000Z',
  businessId: 'business-1',
  businessName: 'Bkash Ltd. Company',
  myEngagement: null,
};

function ok(config: InternalAxiosRequestConfig, data: unknown, status = 200) {
  const response = { data, status, statusText: '', headers: {}, config };
  if (status >= 200 && status < 300) return Promise.resolve(response);
  return Promise.reject(
    new AxiosError(`status ${status}`, 'ERR_BAD_RESPONSE', config, {}, response),
  );
}

function envelope<T>(data: T) {
  return { success: true, statusCode: 200, message: 'ok', data, meta: null };
}

function errorBody(code: string, statusCode: number) {
  return { success: false, code, statusCode, message: `err ${code}`, errors: null };
}

type Store = ReturnType<typeof configureStore>;
const stores: Store[] = [];

function makeStore() {
  const store = configureStore({
    reducer: { [campaignFeedApi.reducerPath]: campaignFeedApi.reducer },
    middleware: gDM => gDM({ serializableCheck: false }).concat(campaignFeedApi.middleware),
  });
  stores.push(store as Store);
  return store;
}

async function withToken() {
  await setTokens({
    token: 'access-1',
    refreshToken: 'refresh-1',
    tokenExpires: 2_000_000_000_000,
  });
}

type Adapter = (config: InternalAxiosRequestConfig) => Promise<unknown>;
let adapter: jest.MockedFunction<Adapter>;

beforeEach(async () => {
  jest.useFakeTimers();
  await AsyncStorage.clear();
  await clearTokens();
  jest.clearAllMocks();
  adapter = jest.fn<Adapter>();
  httpClient.defaults.adapter = adapter as any;
});

afterEach(() => {
  stores.splice(0).forEach(s => s.dispatch(campaignFeedApi.util.resetApiState()));
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('campaignFeedApi', () => {
  test('getTopCampaigns GETs page 1 of /feed/campaigns with the given limit', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope([campaign])));

    const data = await store
      .dispatch(campaignFeedApi.endpoints.getTopCampaigns.initiate({ limit: 3 }))
      .unwrap();

    expect(data).toEqual([campaign]);
    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/feed/campaigns');
    expect(call.method).toBe('get');
    expect(call.params).toEqual({ page: 1, limit: 3 });
    expect(call.headers.Authorization).toBe('Bearer access-1');
  });

  test('getCampaignsFeedPage GETs the given page/limit of /feed/campaigns', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope([campaign])));

    await store
      .dispatch(campaignFeedApi.endpoints.getCampaignsFeedPage.initiate({ page: 2, limit: 10 }))
      .unwrap();

    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/feed/campaigns');
    expect(call.method).toBe('get');
    expect(call.params).toEqual({ page: 2, limit: 10 });
  });

  test('getCampaignsFeedPage sends CB1 filters and sort alongside page/limit', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope([campaign])));

    await store
      .dispatch(
        campaignFeedApi.endpoints.getCampaignsFeedPage.initiate({
          page: 1,
          limit: 10,
          q: '  food  ',
          category: ['food', 'lifestyle'],
          platform: 'instagram',
          city: 'Dhaka',
          budgetMin: 10000,
          budgetMax: 500000,
          deadlineBefore: '2026-10-31',
          sort: '-budgetAmountMinor',
        }),
      )
      .unwrap();

    const call = adapter.mock.calls[0][0];
    expect(call.params).toEqual({
      page: 1,
      limit: 10,
      q: 'food',
      category: ['food', 'lifestyle'],
      platform: 'instagram',
      city: 'Dhaka',
      budgetMin: 10000,
      budgetMax: 500000,
      deadlineBefore: '2026-10-31',
      sort: '-budgetAmountMinor',
    });
    expect(httpClient.getUri(call)).toContain('category=food&category=lifestyle');
  });

  test('getCampaignsFeedPage sends businessId to list one business campaigns', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope([campaign])));

    await store
      .dispatch(
        campaignFeedApi.endpoints.getCampaignsFeedPage.initiate({
          page: 1,
          limit: 10,
          businessId: 'business-1',
        }),
      )
      .unwrap();

    expect(adapter.mock.calls[0][0].params).toEqual({
      page: 1,
      limit: 10,
      businessId: 'business-1',
    });
  });

  test('blank search text and an empty category list are left out of the request', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope([campaign])));

    await store
      .dispatch(
        campaignFeedApi.endpoints.getTopCampaigns.initiate({ limit: 3, q: '   ', category: [] }),
      )
      .unwrap();

    expect(adapter.mock.calls[0][0].params).toEqual({ page: 1, limit: 3 });
  });

  test('getTopRecommendedCampaigns GETs page 1 of /feed/campaigns/recommended with the given limit', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope([campaign])));

    const data = await store
      .dispatch(campaignFeedApi.endpoints.getTopRecommendedCampaigns.initiate({ limit: 3 }))
      .unwrap();

    expect(data).toEqual([campaign]);
    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/feed/campaigns/recommended');
    expect(call.params).toEqual({ page: 1, limit: 3 });
  });

  test('getRecommendedCampaignsFeedPage GETs the given page/limit of /feed/campaigns/recommended', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope([campaign])));

    await store
      .dispatch(
        campaignFeedApi.endpoints.getRecommendedCampaignsFeedPage.initiate({ page: 2, limit: 10 }),
      )
      .unwrap();

    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/feed/campaigns/recommended');
    expect(call.params).toEqual({ page: 2, limit: 10 });
  });

  test('getFeedCampaign GETs one campaign by id', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope({ id: 'campaign-1', title: 'X' })));

    const data = await store
      .dispatch(campaignFeedApi.endpoints.getFeedCampaign.initiate({ id: 'campaign-1' }))
      .unwrap();

    expect(data).toEqual({ id: 'campaign-1', title: 'X' });
    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/feed/campaigns/campaign-1');
    expect(call.method).toBe('get');
  });

  test('getFeedCampaign surfaces a 404 as a NOT_FOUND ApiError', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, errorBody('NOT_FOUND', 404), 404));

    const result = await store.dispatch(
      campaignFeedApi.endpoints.getFeedCampaign.initiate({ id: 'missing' }),
    );

    expect((result.error as ApiError).code).toBe('NOT_FOUND');
  });

  test('getTopJoinedCampaigns GETs page 1 of /me/engagements filtered to accepted', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope([])));

    const data = await store
      .dispatch(campaignFeedApi.endpoints.getTopJoinedCampaigns.initiate({ limit: 3 }))
      .unwrap();

    expect(data).toEqual([]);
    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/me/engagements');
    expect(call.params).toEqual({ page: 1, limit: 3, engagementStatus: ['accepted'] });
    expect(httpClient.getUri(call)).toContain('engagementStatus=accepted');
    expect(httpClient.getUri(call)).not.toContain('engagementStatus[]');
  });

  test('getCreatorEarnings sums agreed fees of completed engagements across pages', async () => {
    await withToken();
    const store = makeStore();
    const row = (agreedAmountMinor: number | null) => ({
      id: 'e',
      campaignId: 'c',
      agreedAmountMinor,
      currency: 'BDT',
    });
    adapter.mockImplementation(c => {
      const { page } = c.params as { page: number };
      const rows =
        page === 1 ? Array.from({ length: 50 }, () => row(10000)) : [row(5000), row(null)];
      return ok(c, envelope(rows));
    });

    const data = await store
      .dispatch(campaignFeedApi.endpoints.getCreatorEarnings.initiate())
      .unwrap();

    expect(data).toEqual({ totalMinor: 505000, currency: 'BDT', completedCount: 52 });
    expect(adapter).toHaveBeenCalledTimes(2);
    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/me/engagements');
    expect(call.params).toEqual({ page: 1, limit: 50, engagementStatus: ['completed'] });
  });

  test('getCreatorEarnings is zero in BDT when nothing is completed', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope([])));

    const data = await store
      .dispatch(campaignFeedApi.endpoints.getCreatorEarnings.initiate())
      .unwrap();

    expect(data).toEqual({ totalMinor: 0, currency: 'BDT', completedCount: 0 });
  });

  test('a failed fetch surfaces as a result.error ApiError', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, errorBody('INTERNAL_ERROR', 500), 500));

    const result = await store.dispatch(
      campaignFeedApi.endpoints.getTopCampaigns.initiate({ limit: 3 }),
    );

    expect(result.error).toBeInstanceOf(ApiError);
    expect((result.error as ApiError).code).toBe('INTERNAL_ERROR');
  });
  test('acceptMyEngagement reads the engagement, then accepts the business offer', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => {
      if (c.method === 'get') {
        return ok(
          c,
          envelope({
            id: 'eng-1',
            offers: [
              { id: 'offer-old', senderType: 'business', status: 'superseded' },
              { id: 'offer-2', senderType: 'business', status: 'pending' },
            ],
          }),
        );
      }
      return ok(c, envelope({ id: 'eng-1', status: 'accepted', offers: [] }));
    });

    await store
      .dispatch(campaignFeedApi.endpoints.acceptMyEngagement.initiate({ engagementId: 'eng-1' }))
      .unwrap();

    expect(adapter.mock.calls[0][0].url).toBe('/me/engagements/eng-1');
    const accept = adapter.mock.calls[1][0];
    expect(accept.url).toBe('/me/engagements/eng-1/accept');
    expect(accept.method).toBe('post');
    expect(JSON.parse(accept.data as string)).toEqual({ offerId: 'offer-2' });
  });

  test('acceptMyEngagement fails without a POST when no business offer is pending', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c =>
      ok(
        c,
        envelope({ id: 'eng-1', offers: [{ id: 'o', senderType: 'creator', status: 'pending' }] }),
      ),
    );

    const result = await store.dispatch(
      campaignFeedApi.endpoints.acceptMyEngagement.initiate({ engagementId: 'eng-1' }),
    );

    expect((result as { error?: ApiError }).error?.code).toBe('OFFER_NOT_PENDING');
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  test('declineMyEngagement POSTs an empty reason by default', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope({ id: 'eng-1', status: 'declined' })));

    await store
      .dispatch(campaignFeedApi.endpoints.declineMyEngagement.initiate({ engagementId: 'eng-1' }))
      .unwrap();

    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/me/engagements/eng-1/decline');
    expect(call.method).toBe('post');
    expect(JSON.parse(call.data as string)).toEqual({ reason: '' });
  });

  test('getMyEngagement GETs /me/engagements/:id', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope({ id: 'eng-1', offers: [] })));

    const data = await store
      .dispatch(campaignFeedApi.endpoints.getMyEngagement.initiate({ engagementId: 'eng-1' }))
      .unwrap();

    expect(data).toEqual({ id: 'eng-1', offers: [] });
    expect(adapter.mock.calls[0][0].url).toBe('/me/engagements/eng-1');
    expect(adapter.mock.calls[0][0].method).toBe('get');
  });

  test('acceptOffer POSTs the given offer id straight to CF4', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope({ id: 'eng-1', status: 'accepted' })));

    await store
      .dispatch(
        campaignFeedApi.endpoints.acceptOffer.initiate({
          engagementId: 'eng-1',
          offerId: 'offer-3',
        }),
      )
      .unwrap();

    expect(adapter).toHaveBeenCalledTimes(1);
    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/me/engagements/eng-1/accept');
    expect(call.method).toBe('post');
    expect(JSON.parse(call.data as string)).toEqual({ offerId: 'offer-3' });
  });

  test('sendCounterOffer POSTs the amount and note, omitting an empty note', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope({ id: 'eng-1', status: 'countered' }), 201));

    await store
      .dispatch(
        campaignFeedApi.endpoints.sendCounterOffer.initiate({
          engagementId: 'eng-1',
          amountMinor: 2_500_000,
          note: 'Two reels take a full day.',
        }),
      )
      .unwrap();
    await store
      .dispatch(
        campaignFeedApi.endpoints.sendCounterOffer.initiate({
          engagementId: 'eng-1',
          amountMinor: 2_400_000,
        }),
      )
      .unwrap();

    const [withNote, withoutNote] = adapter.mock.calls.map(([c]) => c);
    expect(withNote.url).toBe('/engagements/eng-1/offers');
    expect(withNote.method).toBe('post');
    expect(JSON.parse(withNote.data as string)).toEqual({
      amountMinor: 2_500_000,
      note: 'Two reels take a full day.',
    });
    expect(JSON.parse(withoutNote.data as string)).toEqual({ amountMinor: 2_400_000 });
  });

  test('sendCounterOffer sends scope only when given (backend 18l)', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope({ id: 'eng-1', status: 'countered' }), 201));
    const scope = [{ platform: 'instagram', type: 'reels', count: 1 }];

    await store
      .dispatch(
        campaignFeedApi.endpoints.sendCounterOffer.initiate({
          engagementId: 'eng-1',
          amountMinor: 2_000_000,
          scope,
        }),
      )
      .unwrap();

    expect(JSON.parse(adapter.mock.calls[0][0].data as string)).toEqual({
      amountMinor: 2_000_000,
      scope,
    });
  });

  test('sendCounterOffer surfaces the 409 code from the backend', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, errorBody('NEGOTIATION_LIMIT_REACHED', 409), 409));

    const result = await store.dispatch(
      campaignFeedApi.endpoints.sendCounterOffer.initiate({
        engagementId: 'eng-1',
        amountMinor: 100,
      }),
    );

    const error = (result as { error?: ApiError }).error;
    expect(error?.code).toBe('NEGOTIATION_LIMIT_REACHED');
    expect(error?.statusCode).toBe(409);
  });

  test('withdrawOffer POSTs to the offer withdraw path with no body', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope({ id: 'eng-1', status: 'pending' })));

    await store
      .dispatch(
        campaignFeedApi.endpoints.withdrawOffer.initiate({ engagementId: 'eng-1', offerId: 'o-1' }),
      )
      .unwrap();

    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/engagements/eng-1/offers/o-1/withdraw');
    expect(call.method).toBe('post');
    expect(call.data).toBeUndefined();
  });

  test('withdrawMyEngagement POSTs the reason to CF6, empty by default', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope({ id: 'eng-1', status: 'withdrawn' })));

    await store
      .dispatch(
        campaignFeedApi.endpoints.withdrawMyEngagement.initiate({
          engagementId: 'eng-1',
          reason: 'Took another booking.',
        }),
      )
      .unwrap();
    await store
      .dispatch(campaignFeedApi.endpoints.withdrawMyEngagement.initiate({ engagementId: 'eng-2' }))
      .unwrap();

    const [first, second] = adapter.mock.calls.map(([c]) => c);
    expect(first.url).toBe('/me/engagements/eng-1/withdraw');
    expect(first.method).toBe('post');
    expect(JSON.parse(first.data as string)).toEqual({ reason: 'Took another booking.' });
    expect(JSON.parse(second.data as string)).toEqual({ reason: '' });
  });

  test('applyToCampaign POSTs the pitch and rate to /feed/campaigns/:id/apply', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope({ id: 'eng-1', status: 'pending' }), 201));

    await store
      .dispatch(
        campaignFeedApi.endpoints.applyToCampaign.initiate({
          campaignId: 'campaign-1',
          pitch: 'I post food reels',
          proposedAmountMinor: 450000,
          portfolioUrls: ['https://instagram.com/me'],
        }),
      )
      .unwrap();

    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/feed/campaigns/campaign-1/apply');
    expect(call.method).toBe('post');
    expect(JSON.parse(call.data as string)).toEqual({
      pitch: 'I post food reels',
      proposedAmountMinor: 450000,
      portfolioUrls: ['https://instagram.com/me'],
    });
  });

  test('applyToCampaign passes a proposed scope through (backend 18l)', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope({ id: 'eng-1', status: 'pending' }), 201));
    const scope = [{ platform: 'tiktok', type: 'video', count: 2 }];

    await store
      .dispatch(
        campaignFeedApi.endpoints.applyToCampaign.initiate({
          campaignId: 'campaign-1',
          pitch: 'I post food reels',
          proposedAmountMinor: 450000,
          scope,
        }),
      )
      .unwrap();

    expect(JSON.parse(adapter.mock.calls[0][0].data as string)).toEqual({
      pitch: 'I post food reels',
      proposedAmountMinor: 450000,
      scope,
    });
  });
  test('getEngagementDeliverables GETs the engagement pieces (CI1)', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope([])));

    await store
      .dispatch(
        campaignFeedApi.endpoints.getEngagementDeliverables.initiate({ engagementId: 'eng-1' }),
      )
      .unwrap();

    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/engagements/eng-1/deliverables');
    expect(call.method).toBe('get');
  });

  test('recordPosted POSTs the live post URL (CI4)', async () => {
    await withToken();
    const store = makeStore();
    adapter.mockImplementation(c => ok(c, envelope({ id: 'sub-1' })));

    await store
      .dispatch(
        campaignFeedApi.endpoints.recordPosted.initiate({
          engagementId: 'eng-1',
          pieceId: 'piece-1',
          livePostUrl: 'https://instagram.com/p/live',
        }),
      )
      .unwrap();

    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/engagements/eng-1/deliverables/piece-1/posted');
    expect(call.method).toBe('post');
    expect(JSON.parse(call.data as string)).toEqual({
      livePostUrl: 'https://instagram.com/p/live',
    });
  });

  test('submitDeliverable sends a link as JSON with a trimmed caption (CI2)', async () => {
    await withToken();
    adapter.mockImplementation(c => ok(c, envelope({ id: 'sub-1' }), 201));

    await submitDeliverable({
      engagementId: 'eng-1',
      pieceId: 'piece-1',
      kind: 'link',
      externalUrl: ' https://youtube.com/shorts/1 ',
      caption: '  First cut  ',
    });

    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/engagements/eng-1/deliverables/piece-1/submissions');
    expect(call.method).toBe('post');
    expect(JSON.parse(call.data as string)).toEqual({
      externalUrl: 'https://youtube.com/shorts/1',
      caption: 'First cut',
    });
  });

  test('submitDeliverable sends an image as multipart with a file part (CI2)', async () => {
    await withToken();
    adapter.mockImplementation(c => ok(c, envelope({ id: 'sub-1' }), 201));

    await submitDeliverable({
      engagementId: 'eng-1',
      pieceId: 'piece-1',
      kind: 'image',
      image: { uri: 'file:///photo.jpg', fileName: 'photo.jpg', mimeType: 'image/jpeg' },
    });

    const call = adapter.mock.calls[0][0];
    expect(call.url).toBe('/engagements/eng-1/deliverables/piece-1/submissions');
    expect(call.data).toBeInstanceOf(FormData);
    expect(String(call.headers?.['Content-Type'])).toContain('multipart/form-data');
  });
});
