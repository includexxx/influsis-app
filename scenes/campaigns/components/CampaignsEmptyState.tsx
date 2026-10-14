import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import EmptyState from '@/components/elements/EmptyState';
import SearchIllustration from '@/components/elements/SearchIllustration';
import Button from '@/components/elements/Button';

export type CampaignsStatusVariant = 'empty' | 'noJoined' | 'noBusinessCampaigns' | 'error';

export interface CampaignsEmptyStateProps {
  variant?: CampaignsStatusVariant;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
}

const COPY: Record<CampaignsStatusVariant, { title: string; description: string }> = {
  empty: {
    title: 'No campaigns found',
    description:
      'There are no campaigns available right now. Check back soon for new opportunities.',
  },
  noJoined: {
    title: "You haven't joined any campaigns",
    description: 'Campaigns you join will show up here. Apply to a campaign to get started.',
  },
  noBusinessCampaigns: {
    title: 'No ongoing campaigns',
    description: "This business doesn't have any live campaigns right now. Check back later.",
  },
  error: {
    title: 'Something went wrong',
    description: "We couldn't load campaigns. Check your connection and try again.",
  },
};

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: 20,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  retryButton: {
    paddingHorizontal: 28,
    height: 44,
    borderRadius: 22,
  },
  retryTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
});

// "No campaigns yet" / "failed to load" card shared by every screen backed
// by scenes/campaigns/api/campaignFeedApi.ts: Home's "Campaigns" and
// "Active Campaigns" previews, and the full Campaigns / Live Campaigns
// screens. Reuses the Search screen's EmptyState + SearchIllustration shape
// (docs/screen/search) since this project has no dedicated campaign
// illustration yet; `variant="error"` swaps the copy and adds a retry
// action.
function CampaignsEmptyState({ variant = 'empty', onRetry, style }: CampaignsEmptyStateProps) {
  const { palette } = useTheme();
  const copy = COPY[variant];

  return (
    <View style={[styles.root, style]}>
      <EmptyState
        illustration={<SearchIllustration />}
        title={copy.title}
        description={copy.description}
      />
      {variant === 'error' && onRetry ? (
        <Button
          title="Try again"
          accessibilityRole="button"
          onPress={onRetry}
          style={[styles.retryButton, { backgroundColor: palette.primary[400] }]}
          titleStyle={[styles.retryTitle, { color: palette.white }]}
        />
      ) : null}
    </View>
  );
}

export default CampaignsEmptyState;
