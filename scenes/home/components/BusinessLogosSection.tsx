import { View, ScrollView, StyleSheet } from 'react-native';
import { homeStyle } from '../home.style';
import SectionHeader from '@/components/elements/SectionHeader';
import {
  BUSINESSES_PREVIEW_LIMIT,
  useGetTopBusinessesQuery,
} from '@/scenes/business/api/businessDirectoryApi';
import {
  BusinessAvatar,
  BusinessAvatarSkeleton,
  BusinessesEmptyState,
} from '@/scenes/business/components';

export interface BusinessLogosSectionProps {
  onSeeAllPress?: () => void;
  onBusinessPress?: (userId: string) => void;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
});

// Home screen's "Business" logo row (Figma node 6770:6071) - the first
// BUSINESSES_PREVIEW_LIMIT businesses from the directory (RBAC API group
// §E1, GET /business-profiles). "See all" pushes the full virtualized grid
// (scenes/business/Businesses.tsx), which reads the same directory one page at
// a time.
function BusinessLogosSection({ onSeeAllPress, onBusinessPress }: BusinessLogosSectionProps) {
  const { data, isLoading, isError, refetch } = useGetTopBusinessesQuery({
    limit: BUSINESSES_PREVIEW_LIMIT,
  });
  const businesses = data ?? [];

  return (
    <View>
      <SectionHeader
        title="Business"
        onSeeAllPress={onSeeAllPress}
        style={homeStyle.sectionHeaderGap}
      />
      {isError ? (
        <BusinessesEmptyState variant="error" onRetry={refetch} />
      ) : !isLoading && businesses.length === 0 ? (
        <BusinessesEmptyState variant="empty" />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={[styles.row, homeStyle.avatarListGap]}>
            {isLoading
              ? Array.from({ length: BUSINESSES_PREVIEW_LIMIT }, (_, index) => (
                  <BusinessAvatarSkeleton key={index} />
                ))
              : businesses.map(item => (
                  <BusinessAvatar
                    key={item.userId}
                    source={item.avatarUrl ? { uri: item.avatarUrl } : null}
                    businessName={item.businessName}
                    onPress={() => onBusinessPress?.(item.userId)}
                  />
                ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

export default BusinessLogosSection;
