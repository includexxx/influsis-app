import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';

import { ApiError, request } from '@/services/http';
import { campaignFeedApi } from './api/campaignFeedApi';
import { CampaignFeedDetail } from './types/campaignFeed';
import ApplyCampaign from './ApplyCampaign';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: (...args: unknown[]) => mockBack(...args) },
  useLocalSearchParams: () => ({ id: 'c37bd636-54fb-4469-9752-a3ce2cc2128c' }),
  Redirect: ({ href }: { href: string }) => {
    const { Text: RNText } = jest.requireActual<typeof import('react-native')>('react-native');
    return <RNText>{`redirect:${href}`}</RNText>;
  },
}));

// See SuccessSheet.test.tsx: BottomSheet's native path mounts
// @gorhom/bottom-sheet, whose internals are incompatible with
// react-native-reanimated's jest mock. Force the plain-View web fallback.
jest.mock('@/utils/deviceInfo', () => ({
  ...(jest.requireActual('@/utils/deviceInfo') as typeof import('@/utils/deviceInfo')),
  isWeb: true,
}));

jest.mock('@/services/http', () => {
  class ApiError extends Error {
    code: string;
    statusCode: number;
    errors: Record<string, string> | null;
    constructor(body: {
      code?: string;
      statusCode: number;
      message?: string;
      errors?: Record<string, string>;
    }) {
      super(body.message ?? 'api error');
      this.name = 'ApiError';
      this.code = body.code ?? 'UNKNOWN';
      this.statusCode = body.statusCode;
      this.errors = body.errors ?? null;
    }
  }
  return { __esModule: true, request: jest.fn(), ApiError };
});

const mockRequest = request as jest.MockedFunction<typeof request>;

type RequestConfig = { url: string; method?: string; data?: unknown };

// request() is generic over its resolved type; the mocks return plain values.
// The creator's completed engagements (GET /me/engagements) answer with
// `completed` (none by default), so `handler` only sees the campaign calls.
function answerWith(handler: (cfg: RequestConfig) => unknown, completed: unknown[] = []) {
  mockRequest.mockImplementation((async (cfg: unknown) => {
    const config = cfg as RequestConfig;
    return config.url === '/me/engagements' ? completed : handler(config);
  }) as typeof request);
}

// The requests the screen sent, minus the completed-engagements lookup.
function campaignCalls() {
  return mockRequest.mock.calls.filter(([cfg]) => (cfg as RequestConfig).url !== '/me/engagements');
}

const campaign: CampaignFeedDetail = {
  id: 'c37bd636-54fb-4469-9752-a3ce2cc2128c',
  businessId: '8ba43b43-fb06-4ee2-a25d-caa71f4189b5',
  type: 'campaign',
  status: 'live',
  publishedAt: '2026-09-26T10:19:12.511Z',
  title: 'New Shop Openning',
  description: 'Celebrate our new Gulshan branch with us.',
  country: 'Bangladesh',
  state: null,
  city: 'Dhaka',
  zipCode: null,
  coverUrl: null,
  avatarUrl: null,
  preferredGender: 'any',
  audienceLocation: null,
  budgetMinAmountMinor: 600000,
  budgetMaxAmountMinor: 600000,
  currency: 'BDT',
  licensingTier: 1,
  appliedPromoCode: null,
  applicationDeadline: '2026-10-10',
  contentDeadline: '2026-10-10',
  campaignEndDate: '2026-10-10',
  preferredPostingDates: null,
  promoting: ['Grand opening offers'],
  objective: null,
  categories: ['food'],
  subCategories: [],
  ageRanges: [],
  interests: [],
  requirements: [
    {
      id: 'timing',
      sectionKey: 'timing',
      label: 'Timing',
      hint: null,
      icon: null,
      tone: null,
      layout: 'list',
      sortOrder: 1,
      items: ['Content due by 2026-10-10'],
      readOnly: true,
    },
  ],
  deliverables: [
    { id: 'd1', platform: 'instagram', type: 'reels', count: 2, title: null, description: null },
  ],
  business: {
    businessId: '8ba43b43-fb06-4ee2-a25d-caa71f4189b5',
    businessName: 'Dhaka Delights Ltd.',
    avatarUrl: null,
    verificationStatus: 'verified',
  },
  myEngagement: null,
  createdAt: '2026-09-26T10:00:00.000Z',
  updatedAt: '2026-09-26T10:00:00.000Z',
};

let store: ReturnType<typeof makeStore>;

function makeStore() {
  return configureStore({
    reducer: { [campaignFeedApi.reducerPath]: campaignFeedApi.reducer },
    middleware: gDM => gDM({ serializableCheck: false }).concat(campaignFeedApi.middleware),
  });
}

function renderScreen() {
  store = makeStore();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return render(<ApplyCampaign />, { wrapper });
}

async function fillAndSubmit() {
  fireEvent.changeText(await screen.findByTestId('apply-pitch'), 'I post food reels');
  fireEvent.changeText(screen.getByTestId('apply-amount'), '4,500');
  fireEvent.changeText(screen.getByTestId('portfolio-link-one'), 'instagram.com/me');
  await act(async () => {
    fireEvent.press(screen.getByTestId('apply-now-button'));
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  mockRequest.mockReset();
  mockBack.mockReset();
});

afterEach(() => {
  store?.dispatch(campaignFeedApi.util.resetApiState());
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('<ApplyCampaign />', () => {
  test('shows a skeleton, then the campaign recap and the form', async () => {
    answerWith(() => campaign);
    renderScreen();

    expect(screen.getByTestId('apply-campaign-skeleton')).toBeTruthy();
    expect(await screen.findByText('New Shop Openning')).toBeTruthy();
    expect(screen.getByText('Budget per creator: BDT 6,000')).toBeTruthy();
    expect(screen.getByTestId('apply-pitch')).toBeTruthy();
  });

  test('shows validation errors without calling the API', async () => {
    answerWith(() => campaign);
    renderScreen();
    await screen.findByText('New Shop Openning');

    await act(async () => {
      fireEvent.press(screen.getByTestId('apply-now-button'));
    });

    expect(screen.getByText('Tell the business why you are a good fit')).toBeTruthy();
    expect(screen.getByText('Enter your rate')).toBeTruthy();
    expect(campaignCalls()).toHaveLength(1);
  });

  test('submits the application and shows the success sheet', async () => {
    answerWith(({ method }) => (method === 'POST' ? { id: 'eng-1', status: 'pending' } : campaign));
    renderScreen();

    await fillAndSubmit();

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/feed/campaigns/c37bd636-54fb-4469-9752-a3ce2cc2128c/apply',
        method: 'POST',
        data: {
          pitch: 'I post food reels',
          proposedAmountMinor: 450000,
          portfolioUrls: ['https://instagram.com/me'],
        },
      }),
    );
    expect(await screen.findByText('Successful!')).toBeTruthy();
  });

  test('shows the backend message when the campaign no longer accepts applications', async () => {
    answerWith(({ method }) => {
      if (method === 'POST') {
        throw new ApiError({
          code: 'CONFLICT',
          statusCode: 409,
          message: 'The application deadline has passed.',
        });
      }
      return campaign;
    });
    renderScreen();

    await fillAndSubmit();

    expect(await screen.findByText('The application deadline has passed.')).toBeTruthy();
    expect(screen.queryByText('Successful!')).toBeNull();
  });

  test('puts backend field errors on the matching input', async () => {
    answerWith(({ method }) => {
      if (method === 'POST') {
        throw new ApiError({
          code: 'VALIDATION_FAILED',
          statusCode: 422,
          message: 'Validation failed',
          errors: { proposedAmountMinor: 'proposedAmountMinor must be a positive number' },
        });
      }
      return campaign;
    });
    renderScreen();

    await fillAndSubmit();

    expect(await screen.findByText('proposedAmountMinor must be a positive number')).toBeTruthy();
  });

  test('disables Apply when the creator already applied', async () => {
    answerWith(() => ({
      ...campaign,
      myEngagement: { id: 'e1', origin: 'requested', status: 'pending' },
    }));
    renderScreen();

    const button = await screen.findByTestId('apply-now-button');
    expect(screen.getByText('Applied')).toBeTruthy();
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  test('disables Apply when the creator already completed the campaign', async () => {
    answerWith(
      () => campaign,
      [{ id: 'eng-done', campaignId: campaign.id, status: 'completed', campaign: null }],
    );
    renderScreen();

    expect(await screen.findByText('Completed')).toBeTruthy();
    const button = screen.getByTestId('apply-now-button');
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  test('redirects home when the campaign is not found', async () => {
    answerWith(() => {
      throw new ApiError({ code: 'NOT_FOUND', statusCode: 404, message: 'Not found' });
    });
    renderScreen();

    expect(await screen.findByText('redirect:/home')).toBeTruthy();
  });
  test("shows the campaign's deliverables (backend 18l)", async () => {
    answerWith(() => campaign);
    renderScreen();

    expect(await screen.findByTestId('apply-deliverables')).toBeTruthy();
    expect(screen.getByText('2 × Instagram Reels')).toBeTruthy();
    expect(screen.getByTestId('apply-propose-deliverables')).toBeTruthy();
  });

  test('sends a proposed deliverables list as scope', async () => {
    answerWith(({ method }) => (method === 'POST' ? { id: 'eng-1', status: 'pending' } : campaign));
    renderScreen();

    fireEvent.press(await screen.findByTestId('apply-propose-deliverables'));
    fireEvent.press(screen.getByLabelText('Increase Instagram Reels'));
    await fillAndSubmit();

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        data: {
          pitch: 'I post food reels',
          proposedAmountMinor: 450000,
          portfolioUrls: ['https://instagram.com/me'],
          scope: [{ platform: 'instagram', type: 'reels', count: 3 }],
        },
      }),
    );
  });

  test('an opened but unchanged proposal sends no scope', async () => {
    answerWith(({ method }) => (method === 'POST' ? { id: 'eng-1', status: 'pending' } : campaign));
    renderScreen();

    fireEvent.press(await screen.findByTestId('apply-propose-deliverables'));
    await fillAndSubmit();

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        data: {
          pitch: 'I post food reels',
          proposedAmountMinor: 450000,
          portfolioUrls: ['https://instagram.com/me'],
        },
      }),
    );
  });

  test('an empty proposal blocks submit with the message', async () => {
    answerWith(() => campaign);
    renderScreen();

    fireEvent.press(await screen.findByTestId('apply-propose-deliverables'));
    fireEvent.press(screen.getByLabelText('Remove Instagram Reels'));
    await fillAndSubmit();

    expect(screen.getAllByText('Add at least one deliverable.').length).toBeGreaterThan(0);
    expect(campaignCalls()).toHaveLength(1);
  });

  describe('objective and custom deliverables (backend 18q)', () => {
    const customItem = {
      id: 'd2',
      platform: 'custom' as const,
      type: 'custom',
      count: 1,
      title: 'Unboxing clip',
      description: '<p>Show the <strong>box</strong></p>',
    };
    const ugcCampaign: CampaignFeedDetail = {
      ...campaign,
      objective: 'ugc_content',
      deliverables: [...campaign.deliverables, customItem],
    };

    test('labels rows by the objective and offers only its deliverables', async () => {
      answerWith(() => ugcCampaign);
      renderScreen();

      expect(await screen.findByText('2 × Video for Instagram (Reel)')).toBeTruthy();
      expect(screen.getByText('1 × Unboxing clip')).toBeTruthy();

      fireEvent.press(screen.getByTestId('apply-propose-deliverables'));
      fireEvent.press(screen.getByTestId('apply-scope-editor-add'));

      expect(await screen.findByText('Image for Instagram')).toBeTruthy();
      expect(screen.getByText('Video for TikTok (Reel)')).toBeTruthy();
      expect(screen.queryByText('Story on Facebook')).toBeNull();
      expect(screen.queryByText(/UGC/)).toBeNull();
    });

    test('a campaign without an objective offers no retired UGC pair', async () => {
      answerWith(() => campaign);
      renderScreen();

      fireEvent.press(await screen.findByTestId('apply-propose-deliverables'));
      fireEvent.press(screen.getByTestId('apply-scope-editor-add'));

      expect(await screen.findByText('TikTok Post')).toBeTruthy();
      expect(screen.queryByText('UGC Video')).toBeNull();
      expect(screen.queryByText('UGC Photo')).toBeNull();
    });

    test('re-counting a custom item sends its title and description unchanged', async () => {
      answerWith(({ method }) =>
        method === 'POST' ? { id: 'eng-1', status: 'pending' } : ugcCampaign,
      );
      renderScreen();

      fireEvent.press(await screen.findByTestId('apply-propose-deliverables'));
      fireEvent.press(screen.getByLabelText('Increase Unboxing clip'));
      await fillAndSubmit();

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          data: expect.objectContaining({
            scope: [
              { platform: 'instagram', type: 'reels', count: 2 },
              {
                platform: 'custom',
                type: 'custom',
                count: 2,
                title: 'Unboxing clip',
                description: '<p>Show the <strong>box</strong></p>',
              },
            ],
          }),
        }),
      );
    });

    test('removing a custom item sends scope without it', async () => {
      answerWith(({ method }) =>
        method === 'POST' ? { id: 'eng-1', status: 'pending' } : ugcCampaign,
      );
      renderScreen();

      fireEvent.press(await screen.findByTestId('apply-propose-deliverables'));
      fireEvent.press(screen.getByLabelText('Remove Unboxing clip'));
      await fillAndSubmit();

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          data: expect.objectContaining({
            scope: [{ platform: 'instagram', type: 'reels', count: 2 }],
          }),
        }),
      );
    });

    test('an untouched list with a custom item sends no scope', async () => {
      answerWith(({ method }) =>
        method === 'POST' ? { id: 'eng-1', status: 'pending' } : ugcCampaign,
      );
      renderScreen();

      fireEvent.press(await screen.findByTestId('apply-propose-deliverables'));
      await fillAndSubmit();

      const post = mockRequest.mock.calls.find(([cfg]) => (cfg as RequestConfig).method === 'POST');
      expect((post?.[0] as RequestConfig).data).not.toHaveProperty('scope');
    });

    test("shows a custom item's description error on its row", async () => {
      answerWith(({ method }) => {
        if (method === 'POST') {
          throw new ApiError({
            code: 'VALIDATION_FAILED',
            statusCode: 422,
            message: 'Validation failed',
            errors: { 'scope[1].description': 'must contain text' },
          });
        }
        return ugcCampaign;
      });
      renderScreen();

      fireEvent.press(await screen.findByTestId('apply-propose-deliverables'));
      fireEvent.press(screen.getByLabelText('Increase Unboxing clip'));
      await fillAndSubmit();

      expect(
        await within(screen.getByTestId('apply-scope-editor-row-1')).findByText(
          'must contain text',
        ),
      ).toBeTruthy();
    });
  });
});
