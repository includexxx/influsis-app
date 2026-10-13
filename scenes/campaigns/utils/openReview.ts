import { router } from 'expo-router';

// Opens one completed engagement's Review screen. The campaign title and the
// business name ride along because CK1 carries neither; an unknown name is
// left out and the screen says "the business".
export function openReview(engagement: {
  id: string;
  title?: string | null;
  business?: string | null;
}): void {
  router.push({
    pathname: '/engagement/[id]/review',
    params: {
      id: engagement.id,
      title: engagement.title ?? '',
      ...(engagement.business ? { business: engagement.business } : {}),
    },
  });
}
