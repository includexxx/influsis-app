import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { myProfileStyle as s } from '../myProfile.style';

type FeatherIcon = keyof typeof Feather.glyphMap;

// A quiet bordered note for My Profile's Reviews and Campaign work sections:
// the empty state, a load error (with Try again), or "turn on
// discoverability".
export function ProfileNote({
  icon,
  text,
  onRetry,
  testID,
}: {
  icon: FeatherIcon;
  text: string;
  onRetry?: () => void;
  testID?: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[s.note, { borderColor: colors.border, backgroundColor: colors.card }]}
      testID={testID}>
      <Feather name={icon} size={16} color={colors.text.secondary} />
      <Text style={[s.noteText, { color: colors.text.secondary }]}>{text}</Text>
      {onRetry ? (
        <Pressable accessibilityRole="button" onPress={onRetry} hitSlop={6}>
          <Text style={s.noteAction}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// "Show more" under a paged list, or nothing once the last page is in.
// While the next page loads it reads "Loading…"; a failed next page offers
// Try again.
export function ShowMore({
  label,
  hasMore,
  isLoadingMore,
  isLoadMoreError,
  onLoadMore,
  onRetry,
  testID,
}: {
  label: string;
  hasMore: boolean;
  isLoadingMore: boolean;
  isLoadMoreError: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
  testID?: string;
}) {
  if (isLoadMoreError) {
    return <ProfileNote icon="alert-circle" text="Couldn't load more." onRetry={onRetry} />;
  }
  if (!hasMore && !isLoadingMore) return null;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isLoadingMore}
      onPress={onLoadMore}
      style={s.showMore}
      testID={testID}>
      <Text style={s.showMoreLabel}>{isLoadingMore ? 'Loading…' : label}</Text>
    </Pressable>
  );
}
