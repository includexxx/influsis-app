import { View, ScrollView } from 'react-native';
import { homeStyle } from '../home.style';
import SectionHeader from '@/components/elements/SectionHeader';
import {
  BUSINESSES_PREVIEW_LIMIT,
  useGetTopBusinessesQuery,
} from '@/scenes/business/api/businessDirectoryApi';
import { BusinessAvatar, BusinessesEmptyState } from '@/scenes/business/components';
import AvatarTile, { AVATAR_TILE_SIZE, AvatarTileSkeleton } from './AvatarTile';

export interface BusinessLogosSectionProps {
  onSeeAllPress?: () => void;
  onBusinessPress?: (userId: string) => void;
}

// Home screen's "Business" row (Figma node 6770:6071) - the first
// BUSINESSES_PREVIEW_LIMIT businesses from the directory (RBAC API group
// §E1, GET /business-profiles), each a named AvatarTile. "See all" pushes the
// full virtualized grid (scenes/business/Businesses.tsx), which reads the
// same directory one page at a time.
function BusinessLogosSection({ onSeeAllPress, onBusinessPress }: BusinessLogosSectionProps) {
  const { data, isLoading, isError, refetch } = useGetTopBusinessesQuery({
    limit: BUSINESSES_PREVIEW_LIMIT,
  });
  const businesses = data ?? [];

  return (
    <View>
      <SectionHeader
        title="Businesses"
        subtitle="Brands hiring creators on Influsis"
        onSeeAllPress={onSeeAllPress}
        style={homeStyle.sectionHeaderGap}
      />
      {isError ? (
        <BusinessesEmptyState variant="error" onRetry={refetch} />
      ) : !isLoading && businesses.length === 0 ? (
        <BusinessesEmptyState variant="empty" />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={homeStyle.avatarListGap}>
          {isLoading
            ? Array.from({ length: BUSINESSES_PREVIEW_LIMIT }, (_, index) => (
                <AvatarTileSkeleton key={index} />
              ))
            : businesses.map(item => (
                <AvatarTile
                  key={item.userId}
                  name={item.businessName}
                  verified={item.verificationStatus === 'verified'}
                  onPress={() => onBusinessPress?.(item.userId)}
                  testID={`home-business-${item.userId}`}
                  avatar={
                    <BusinessAvatar
                      source={item.avatarUrl ? { uri: item.avatarUrl } : null}
                      businessName={item.businessName}
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

export default BusinessLogosSection;
