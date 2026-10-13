import { describe, expect, test } from '@jest/globals';
import { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react-native';
import { campaignFeedApi } from '@/scenes/campaigns/api/campaignFeedApi';
import { PublicPortfolioEntry } from '@/scenes/campaigns/types/portfolio';
import CampaignWorkCard from './CampaignWorkCard';

const entry: PublicPortfolioEntry = {
  engagementId: 'e1',
  completedAt: '2026-10-14T09:05:00.000Z',
  campaign: { id: 'c1', title: 'Bkash Eid Campaign', objective: null, coverUrl: null },
  business: { userId: 'b1', displayName: 'Bkash Ltd.', handle: 'bkash', avatarUrl: null },
  pieces: [],
  review: { rating: 4.5, message: 'Great reel.', submittedAt: '2026-10-15T10:00:00.000Z' },
};

function renderCard(editable: boolean, card = entry) {
  const store = configureStore({
    reducer: { [campaignFeedApi.reducerPath]: campaignFeedApi.reducer },
    middleware: gDM => gDM({ serializableCheck: false }).concat(campaignFeedApi.middleware),
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return render(<CampaignWorkCard entry={card} editable={editable} />, { wrapper });
}

describe('<CampaignWorkCard />', () => {
  test("another creator's entry is read-only", () => {
    renderCard(false);

    expect(screen.getByText('Bkash Eid Campaign')).toBeTruthy();
    expect(screen.getByText('Great reel.')).toBeTruthy();
    expect(screen.queryByTestId('campaign-work-e1-toggle')).toBeNull();
    expect(screen.queryByText('Show on public profile')).toBeNull();
  });

  test('the owner gets the toggle', () => {
    renderCard(true, { ...entry, hidden: true } as PublicPortfolioEntry);

    expect(screen.getByTestId('campaign-work-e1-toggle')).toBeTruthy();
    expect(screen.getByText('Hidden from your public profile')).toBeTruthy();
  });
});
