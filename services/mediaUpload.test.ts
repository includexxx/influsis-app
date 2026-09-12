import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { PickedImageAsset, PortfolioEntry } from '@/utils/onboardingSchemas';
import { CreatorOnboardingState } from '@/slices/creatorOnboarding.slice';

const mockRequest = jest.fn<(cfg: unknown) => Promise<unknown>>();

jest.mock('./http', () => ({
  request: (cfg: unknown) => mockRequest(cfg),
}));

// RN's FormData polyfill has no public way to read back an appended part, so
// swap in a minimal fake that records exactly what `.append()` received —
// avoids depending on either DOM's or RN's private internals.
type AppendedPart = [string, unknown];
class FakeFormData {
  parts: AppendedPart[] = [];
  append(name: string, value: unknown) {
    this.parts.push([name, value]);
  }
}
const RealFormData = global.FormData;

beforeEach(() => {
  mockRequest.mockReset();
});

afterEach(() => {
  global.FormData = RealFormData;
});

// eslint-disable-next-line import/first
import { uploadOnboardingMedia, uploadPickedImage, uploadPortfolioThumbnails } from './mediaUpload';

function media(key: string) {
  return {
    id: 'm-1',
    key,
    url: `https://cdn.test/${key}`,
    fileType: 'image/jpeg',
    fileSize: 100,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

function portfolioEntry(overrides: Partial<PortfolioEntry> = {}): PortfolioEntry {
  return {
    id: 'entry-1',
    url: 'instagram.com/p/x',
    platform: 'instagram',
    ...overrides,
  };
}

describe('uploadPickedImage', () => {
  test('builds a { uri, name, type } file part and sets the multipart header', async () => {
    global.FormData = FakeFormData as any;
    mockRequest.mockResolvedValueOnce(media('profile-images/abc.jpg'));

    const key = await uploadPickedImage(
      { uri: 'file:///pic.jpg', mimeType: 'image/png', fileName: 'my-pic.png' },
      'fallback.jpg',
    );

    expect(key).toBe('profile-images/abc.jpg');
    const [cfg] = mockRequest.mock.calls[0] as [
      { url: string; method: string; headers: Record<string, string>; data: FakeFormData },
    ];
    expect(cfg.url).toBe('/media');
    expect(cfg.method).toBe('POST');
    expect(cfg.headers).toEqual({ 'Content-Type': 'multipart/form-data' });
    expect(cfg.data.parts).toEqual([
      ['file', { uri: 'file:///pic.jpg', name: 'my-pic.png', type: 'image/png' }],
    ]);
  });

  test('falls back to a default name and mime type when the asset omits them', async () => {
    global.FormData = FakeFormData as any;
    mockRequest.mockResolvedValueOnce(media('profile-images/def.jpg'));

    await uploadPickedImage({ uri: 'file:///no-metadata.jpg' }, 'fallback.jpg');

    const [cfg] = mockRequest.mock.calls[0] as [{ data: FakeFormData }];
    expect(cfg.data.parts).toEqual([
      ['file', { uri: 'file:///no-metadata.jpg', name: 'fallback.jpg', type: 'image/jpeg' }],
    ]);
  });

  test('an http(s) uri is passed through without uploading', async () => {
    const asset: PickedImageAsset = { uri: 'https://cdn.test/existing.jpg' };

    const result = await uploadPickedImage(asset);

    expect(result).toBe('https://cdn.test/existing.jpg');
    expect(mockRequest).not.toHaveBeenCalled();
  });
});

describe('uploadPortfolioThumbnails', () => {
  test('returns an empty map when no entry has a thumbnail', async () => {
    const result = await uploadPortfolioThumbnails([portfolioEntry()]);
    expect(result).toEqual({});
    expect(mockRequest).not.toHaveBeenCalled();
  });

  test('maps entry id -> media key correctly even when uploads resolve out of order', async () => {
    const entries = [
      portfolioEntry({ id: 'first', thumbnail: { uri: 'file:///a.jpg' } }),
      portfolioEntry({ id: 'second', thumbnail: { uri: 'file:///b.jpg' } }),
    ];

    // 'first' resolves after 'second' despite being requested first.
    mockRequest
      .mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve(media('key-first')), 10)),
      )
      .mockImplementationOnce(() => Promise.resolve(media('key-second')));

    const result = await uploadPortfolioThumbnails(entries);

    expect(result).toEqual({ first: 'key-first', second: 'key-second' });
  });
});

describe('uploadOnboardingMedia', () => {
  test('uploads profile photo, cover photo, and portfolio thumbnails together', async () => {
    mockRequest
      .mockResolvedValueOnce(media('profile-key'))
      .mockResolvedValueOnce(media('cover-key'))
      .mockResolvedValueOnce(media('thumb-key'));

    const state: CreatorOnboardingState = {
      currentStep: 10,
      completedSteps: [],
      completed: false,
      profilePhoto: { uri: 'file:///profile.jpg' },
      coverPhoto: { uri: 'file:///cover.jpg' },
      portfolio: [portfolioEntry({ id: 'p1', thumbnail: { uri: 'file:///thumb.jpg' } })],
    };

    const media_ = await uploadOnboardingMedia(state);

    expect(media_).toEqual({
      profilePhoto: 'profile-key',
      coverPhoto: 'cover-key',
      portfolioThumbnails: { p1: 'thumb-key' },
    });
  });

  test('omits profilePhoto/coverPhoto keys when the state has none, and returns an empty thumbnail map', async () => {
    const state: CreatorOnboardingState = {
      currentStep: 10,
      completedSteps: [],
      completed: false,
    };

    const result = await uploadOnboardingMedia(state);

    expect(result).toEqual({
      profilePhoto: undefined,
      coverPhoto: undefined,
      portfolioThumbnails: {},
    });
    expect(mockRequest).not.toHaveBeenCalled();
  });
});
