import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import EmptyState from '@/components/elements/EmptyState';
import SearchIllustration from '@/components/elements/SearchIllustration';
import Button from '@/components/elements/Button';

export type CreatorsStatusVariant = 'empty' | 'error';

export interface CreatorsEmptyStateProps {
  variant?: CreatorsStatusVariant;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
}

const COPY: Record<CreatorsStatusVariant, { title: string; description: string }> = {
  empty: {
    title: 'No creators found',
    description: 'There are no creators to show right now. Check back soon.',
  },
  error: {
    title: 'Something went wrong',
    description: "We couldn't load creators. Check your connection and try again.",
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

// "No creators yet" / "failed to load" card shared by every screen backed by
// scenes/creator/api/creatorDirectoryApi.ts: Home's "Top Rated Creator"
// preview and the full Top Creators screen. Reuses the Search screen's
// EmptyState + SearchIllustration shape (docs/screen/search) since this
// project has no dedicated creator illustration yet; `variant="error"`
// swaps the copy and adds a retry action.
function CreatorsEmptyState({ variant = 'empty', onRetry, style }: CreatorsEmptyStateProps) {
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

export default CreatorsEmptyState;
