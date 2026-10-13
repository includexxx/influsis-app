import { CampaignObjective } from '@/scenes/campaigns/types/campaignFeed';
import { PortfolioPiece } from '@/scenes/campaigns/types/portfolio';
import { scopeItemLabel } from '@/scenes/campaigns/utils/scope';

export interface PortfolioPieceView {
  label: string;
  /** An http(s) live-post URL to open, or null. */
  link: string | null;
  /** No public link: the files went to the business privately. */
  privately: boolean;
}

export function isHttpUrl(value: string | null | undefined): value is string {
  return !!value && /^https?:\/\//i.test(value.trim());
}

// One delivered piece of a Campaign work entry (backend 23c). Only a live
// post has a public link, and only an http(s) one is opened; a UGC file link
// is never returned, so those pieces say the files were delivered privately.
export function portfolioPieceView(
  piece: PortfolioPiece,
  objective: CampaignObjective | null,
): PortfolioPieceView {
  const label = scopeItemLabel(piece, objective);
  const link =
    piece.finalKind === 'live_post' && isHttpUrl(piece.livePostUrl)
      ? piece.livePostUrl.trim()
      : null;
  return { label, link, privately: link === null };
}
