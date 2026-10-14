import { Feather } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { AccentTone, ToneColors, palette, toneColors } from '@/theme';
import { EngagementStatus } from '../../types/myEngagement';

export type StatusTone = AccentTone | 'neutral';

export interface ApplicationStatusMeta {
  label: string;
  icon: ComponentProps<typeof Feather>['name'];
  tone: StatusTone;
  /** One line on where the engagement stands / what happens next. */
  hint: string;
  /** The creator has something to answer - the card highlights the hint. */
  needsAction?: boolean;
}

// How each engagement status reads on the Applications screen: a tinted
// status pill (label + icon) and a short "where it stands" line. Closed
// outcomes share a quiet neutral tone so the live ones stand out.
export const APPLICATION_STATUS: Record<EngagementStatus, ApplicationStatusMeta> = {
  pending: {
    label: 'Pending',
    icon: 'clock',
    tone: 'primary',
    hint: 'Waiting for the business to respond',
  },
  countered: {
    label: 'Counter-offer',
    icon: 'repeat',
    tone: 'warning',
    hint: 'New offer on the table - tap to review',
    needsAction: true,
  },
  accepted: {
    label: 'Accepted',
    icon: 'check-circle',
    tone: 'success',
    hint: "You're in - the campaign is underway",
  },
  completed: {
    label: 'Completed',
    icon: 'award',
    tone: 'success',
    hint: 'Delivered and approved by the business',
  },
  declined: {
    label: 'Declined',
    icon: 'x-circle',
    tone: 'error',
    hint: 'The business passed on this one',
  },
  withdrawn: {
    label: 'Withdrawn',
    icon: 'corner-up-left',
    tone: 'neutral',
    hint: 'This application was withdrawn',
  },
  expired: {
    label: 'Expired',
    icon: 'alert-circle',
    tone: 'neutral',
    hint: 'The offer ran out of time',
  },
  cancelled: {
    label: 'Cancelled',
    icon: 'slash',
    tone: 'neutral',
    hint: 'The campaign was cancelled',
  },
};

const NEUTRAL: { light: ToneColors; dark: ToneColors } = {
  light: { background: palette.gray[25], foreground: palette.gray[400] },
  dark: { background: 'rgba(255, 255, 255, 0.08)', foreground: palette.gray[200] },
};

export function statusToneColors(tone: StatusTone, isDark: boolean): ToneColors {
  if (tone === 'neutral') return isDark ? NEUTRAL.dark : NEUTRAL.light;
  return toneColors(tone, isDark);
}
