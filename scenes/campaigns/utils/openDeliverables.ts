import { router } from 'expo-router';

// Opens one accepted engagement's Deliverables screen. The campaign title
// rides along because CI1/CF3 carry no campaign summary (the Offer screen
// does the same).
export function openDeliverables(engagement: { id: string; title?: string | null }): void {
  router.push({
    pathname: '/engagement/[id]/deliverables',
    params: { id: engagement.id, title: engagement.title ?? '' },
  });
}
