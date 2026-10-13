import { describe, expect, test } from '@jest/globals';
import { PortfolioPiece } from '@/scenes/campaigns/types/portfolio';
import { isHttpUrl, portfolioPieceView } from './campaignWork';

function piece(overrides: Partial<PortfolioPiece> = {}): PortfolioPiece {
  return {
    platform: 'instagram',
    type: 'reels',
    title: null,
    finalKind: 'live_post',
    livePostUrl: 'https://www.instagram.com/reel/abc',
    ...overrides,
  };
}

describe('portfolioPieceView', () => {
  test('a live post links to its http(s) URL', () => {
    const view = portfolioPieceView(piece(), null);
    expect(view.link).toBe('https://www.instagram.com/reel/abc');
    expect(view.privately).toBe(false);
    expect(view.label).toBeTruthy();
  });

  test('a file-link piece was delivered privately', () => {
    expect(portfolioPieceView(piece({ finalKind: 'file_link', livePostUrl: null }), null)).toEqual(
      expect.objectContaining({ link: null, privately: true }),
    );
  });

  test('a missing or non-http live-post URL is never opened', () => {
    expect(portfolioPieceView(piece({ livePostUrl: null }), null).link).toBeNull();
    expect(portfolioPieceView(piece({ livePostUrl: 'javascript:alert(1)' }), null).link).toBeNull();
  });

  test('a custom piece is named by its title', () => {
    expect(
      portfolioPieceView(piece({ platform: 'custom', type: 'custom', title: 'Store visit' }), null)
        .label,
    ).toBe('Store visit');
  });
});

test('isHttpUrl', () => {
  expect(isHttpUrl('https://a.test')).toBe(true);
  expect(isHttpUrl('http://a.test')).toBe(true);
  expect(isHttpUrl('ftp://a.test')).toBe(false);
  expect(isHttpUrl(null)).toBe(false);
});
