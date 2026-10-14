import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { authApi } from '@/services/authApi';
import { profilesApi } from '@/services/profilesApi';
import { campaignFeedApi } from '@/scenes/campaigns/api/campaignFeedApi';
import { businessDirectoryApi } from '@/scenes/business/api/businessDirectoryApi';
import { creatorDirectoryApi } from '@/scenes/creator/api/creatorDirectoryApi';
import type { AuthState } from '@/slices/auth.slice';

// RTK Query tags only reach queries of the same createApi instance, so a
// mutation in one API can't invalidate another's cache by itself. This
// listener does it on every successful mutation whose effect shows up
// elsewhere, so screens update without an app reload. Same-API invalidation
// stays on each endpoint's own `invalidatesTags`.
const cacheSync = createListenerMiddleware();

// The logged-in user's id, for the creator-directory tags keyed by userId.
function selfId(state: unknown): string | undefined {
  return (state as { auth?: AuthState }).auth?.account?.id;
}

// Onboarding / editing the creator profile changes:
// - GET /auth/me (handle, profile summary, isOnboardingComplete). Nothing
//   stays subscribed to it after launch, so it's refetched outright (the
//   auth slice's getMe matcher copies the result into `auth.account`) rather
//   than invalidated, which would be a no-op.
// - the creator's own public profile (My Profile reads its reputation from
//   it) and the directory rows (name, avatar, discoverability).
// - the recommended feed, ranked by the profile's categories.
cacheSync.startListening({
  matcher: isAnyOf(
    profilesApi.endpoints.onboardCreator.matchFulfilled,
    profilesApi.endpoints.updateMyProfile.matchFulfilled,
  ),
  effect: (_action, { dispatch, getState }) => {
    dispatch(authApi.endpoints.getMe.initiate(undefined, { forceRefetch: true, subscribe: false }));
    const userId = selfId(getState());
    dispatch(
      creatorDirectoryApi.util.invalidateTags([
        'CreatorDirectory',
        ...(userId
          ? [
              { type: 'CreatorProfile' as const, id: userId },
              { type: 'CreatorCampaignPortfolio' as const, id: userId },
            ]
          : []),
      ]),
    );
    dispatch(campaignFeedApi.util.invalidateTags(['CampaignFeed']));
  },
});

// Reviewing the business can reveal both sides' reviews (blind reveal), so
// the business's rating and review list change, and so do the creator's own
// public received reviews, rating, and campaign work.
cacheSync.startListening({
  matcher: campaignFeedApi.endpoints.submitEngagementReview.matchFulfilled,
  effect: (_action, { dispatch, getState }) => {
    dispatch(
      businessDirectoryApi.util.invalidateTags([
        'BusinessDirectory',
        'BusinessProfile',
        'BusinessReviews',
      ]),
    );
    const userId = selfId(getState());
    dispatch(
      creatorDirectoryApi.util.invalidateTags([
        'CreatorDirectory',
        ...(userId
          ? [
              { type: 'CreatorProfile' as const, id: userId },
              { type: 'CreatorReviews' as const, id: userId },
              { type: 'CreatorCampaignPortfolio' as const, id: userId },
            ]
          : []),
      ]),
    );
  },
});

// Hiding/showing a campaign-work entry changes the creator's public portfolio
// (the own CK6 list is already patched optimistically).
cacheSync.startListening({
  matcher: campaignFeedApi.endpoints.setPortfolioEntryHidden.matchFulfilled,
  effect: (_action, { dispatch, getState }) => {
    const userId = selfId(getState());
    if (!userId) return;
    dispatch(
      creatorDirectoryApi.util.invalidateTags([{ type: 'CreatorCampaignPortfolio', id: userId }]),
    );
  },
});

export default cacheSync;
