import { StyleSheet, StyleProp, ImageStyle } from 'react-native';
import Image from '../Image';

const badgeIcon = require('@/assets/images/home/verified-badge.png');
const checkIcon = require('@/assets/images/influencers/verified-check.png');

export type VerifiedBadgeVariant = 'badge' | 'check';

export interface VerifiedBadgeProps {
  variant?: VerifiedBadgeVariant;
  style?: StyleProp<ImageStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  badge: {
    width: 20,
    height: 20,
  },
  check: {
    width: 13,
    height: 12.5,
  },
});

// Verified checkmark shown next to a name/title across campaign cards,
// brand/campaign detail headers, and influencer cards/profiles. Two Figma
// assets exist for the same concept at two different sizes - `variant`
// selects between them: 'badge' (20x20, assets/images/home/verified-badge.png,
// used by CampaignCard/BrandDetails/CampaignDetails) and 'check' (13x12.5,
// assets/images/influencers/verified-check.png, used by InfluencerCard/
// InfluencerProfile) - centralizing what was previously 5 separate
// require() + inline <Image> duplications.
function VerifiedBadge({ variant = 'badge', style, testID }: VerifiedBadgeProps) {
  const source = variant === 'check' ? checkIcon : badgeIcon;

  return (
    <Image source={source} style={[styles[variant], style]} contentFit="contain" testID={testID} />
  );
}

export default VerifiedBadge;
