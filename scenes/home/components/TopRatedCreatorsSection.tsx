import { View, ScrollView } from 'react-native';
import { homeStyle } from '../home.style';
import SectionHeader from '@/components/elements/SectionHeader';
import {
  CREATORS_PREVIEW_LIMIT,
  useGetTopCreatorsQuery,
} from '@/scenes/creator/api/creatorDirectoryApi';
import { CreatorAvatar, CreatorsEmptyState } from '@/scenes/creator/components';
import AvatarTile, { AVATAR_TILE_SIZE, AvatarTileSkeleton } from './AvatarTile';

export interface TopRatedCreatorsSectionProps {
  onSeeAllPress?: () => void;
  onCreatorPress?: (userId: string) => void;
}

// Home screen's "Top Rated Creators" row (Figma node 6121:6533) - the first
// CREATORS_PREVIEW_LIMIT creators from the directory (RBAC API group §E3,
// GET /creator-profiles), each a named AvatarTile. "See all" pushes the full
// virtualized list (scenes/creator/TopCreators.tsx), which reads the same
// directory one page at a time.
function TopRatedCreatorsSection({ onSeeAllPress, onCreatorPress }: TopRatedCreatorsSectionProps) {
  const { data, isLoading, isError, refetch } = useGetTopCreatorsQuery({
    limit: CREATORS_PREVIEW_LIMIT,
  });
  const creators = data ?? [];

  return (
    <View>
      <SectionHeader
        title="Top Rated Creators"
        subtitle="See what others in the community are doing"
        onSeeAllPress={onSeeAllPress}
        style={homeStyle.sectionHeaderGap}
      />
      {isError ? (
        <CreatorsEmptyState variant="error" onRetry={refetch} />
      ) : !isLoading && creators.length === 0 ? (
        <CreatorsEmptyState variant="empty" />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={homeStyle.avatarListGap}>
          {isLoading
            ? Array.from({ length: CREATORS_PREVIEW_LIMIT }, (_, index) => (
                <AvatarTileSkeleton key={index} />
              ))
            : creators.map(item => (
                <AvatarTile
                  key={item.userId}
                  name={item.displayName}
                  verified={item.verificationStatus === 'verified'}
                  onPress={() => onCreatorPress?.(item.userId)}
                  testID={`home-creator-${item.userId}`}
                  avatar={
                    <CreatorAvatar
                      source={item.avatarUrl ? { uri: item.avatarUrl } : null}
                      displayName={item.displayName}
                      size={AVATAR_TILE_SIZE}
                    />
                  }
                />
              ))}
        </ScrollView>
      )}
    </View>
  );
}

export default TopRatedCreatorsSection;
