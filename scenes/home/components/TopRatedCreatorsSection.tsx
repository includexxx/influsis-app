import { View, ScrollView, StyleSheet } from 'react-native';
import { homeStyle } from '@/styles';
import SectionHeader from '@/components/elements/SectionHeader';
import {
  CREATORS_PREVIEW_LIMIT,
  useGetTopCreatorsQuery,
} from '@/scenes/creator/api/creatorDirectoryApi';
import {
  CreatorAvatar,
  CreatorAvatarSkeleton,
  CreatorsEmptyState,
} from '@/scenes/creator/components';

export interface TopRatedCreatorsSectionProps {
  onSeeAllPress?: () => void;
  onCreatorPress?: (userId: string) => void;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
});

// Home screen's "Top Rated Creator" avatar row (Figma node 6121:6533) - the
// first CREATORS_PREVIEW_LIMIT creators from the directory (RBAC API group
// §E3, GET /creator-profiles). "See all" pushes the full virtualized list
// (scenes/main/TopCreators.tsx), which reads the same directory one page at
// a time.
function TopRatedCreatorsSection({ onSeeAllPress, onCreatorPress }: TopRatedCreatorsSectionProps) {
  const { data, isLoading, isError, refetch } = useGetTopCreatorsQuery({
    limit: CREATORS_PREVIEW_LIMIT,
  });
  const creators = data ?? [];

  return (
    <View>
      <SectionHeader
        title="Top Rated Creator"
        onSeeAllPress={onSeeAllPress}
        style={homeStyle.sectionHeaderGap}
      />
      {isError ? (
        <CreatorsEmptyState variant="error" onRetry={refetch} />
      ) : !isLoading && creators.length === 0 ? (
        <CreatorsEmptyState variant="empty" />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={[styles.row, homeStyle.avatarListGap]}>
            {isLoading
              ? Array.from({ length: CREATORS_PREVIEW_LIMIT }, (_, index) => (
                  <CreatorAvatarSkeleton key={index} />
                ))
              : creators.map(item => (
                  <CreatorAvatar
                    key={item.userId}
                    source={item.avatarUrl ? { uri: item.avatarUrl } : null}
                    displayName={item.displayName}
                    onPress={() => onCreatorPress?.(item.userId)}
                  />
                ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

export default TopRatedCreatorsSection;
