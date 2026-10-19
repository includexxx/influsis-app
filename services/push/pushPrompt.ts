import { createListenerMiddleware, isAnyOf, UnknownAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DataPersistKeys } from '@/hooks/useDataPersist';
import { campaignFeedApi } from '@/scenes/campaigns/api/campaignFeedApi';
import { notificationReceived } from '@/slices/notificationsLive.slice';
import { promptShown, PushState } from '@/slices/push.slice';
import type { AuthState } from '@/slices/auth.slice';
import { pushDeps } from './deps';
import { readPushPermission } from './registration';

// When to offer push (build-plan 38e1; backend PUSH_NOTIFICATIONS §12.1):
// never on first launch, only right after a moment that shows its value -
// the creator's first join request, accepted engagement, or invitation. The
// explainer is shown once per device (PUSH_PROMPT_SHOWN, wiped at sign-out
// so the next creator gets their own); "Not now" doesn't bring it back.

const PROMPT_EVENTS = new Set(['engagement.invited', 'engagement.accepted']);

const isPromptMoment = (action: UnknownAction): boolean =>
  isAnyOf(
    campaignFeedApi.endpoints.applyToCampaign.matchFulfilled,
    campaignFeedApi.endpoints.acceptOffer.matchFulfilled,
    campaignFeedApi.endpoints.acceptMyEngagement.matchFulfilled,
  )(action) ||
  (notificationReceived.match(action) && PROMPT_EVENTS.has(action.payload.eventType));

const pushPrompt = createListenerMiddleware();

pushPrompt.startListening({
  predicate: isPromptMoment,
  effect: async (_action, api) => {
    // Several moments at once (e.g. accept + its live event) prompt once.
    api.cancelActiveListeners();
    const state = api.getState() as { auth: AuthState; push: PushState };
    if (state.auth.status !== 'authenticated' || state.push.promptVisible) return;
    // Already answered on Android, where an unanswered and a refused
    // permission read the same without asking.
    if (state.push.permission === 'denied' || state.push.permission === 'blocked') return;

    const deps = pushDeps(api.dispatch, api.getState);
    if (!deps.messaging()) return;
    if (await AsyncStorage.getItem(DataPersistKeys.PUSH_PROMPT_SHOWN).catch(() => null)) return;
    if ((await readPushPermission(deps)) !== 'unknown') return;

    await AsyncStorage.setItem(DataPersistKeys.PUSH_PROMPT_SHOWN, 'true').catch(() => undefined);
    api.dispatch(promptShown());
  },
});

export default pushPrompt;
