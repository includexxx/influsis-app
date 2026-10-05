import { ComponentProps } from 'react';
import { Feather } from '@expo/vector-icons';

export type FeatherName = ComponentProps<typeof Feather>['name'];

// One recognisable Feather glyph per deliverable platform (the Deliverables
// list and one piece's screen). Unknown platforms get a generic file icon.
const PLATFORM_ICON: Record<string, FeatherName> = {
  instagram: 'instagram',
  youtube: 'youtube',
  facebook: 'facebook',
  tiktok: 'music',
  ugc: 'camera',
};

export function platformIcon(platform: string): FeatherName {
  return PLATFORM_ICON[platform] ?? 'file';
}
