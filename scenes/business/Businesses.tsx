import { useCallback } from 'react';
import { FlatList, ListRenderItem, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle } from '@/styles';
import { businessesStyle } from './businesses.style';
import ScreenHeader from '@/components/elements/ScreenHeader';
import { BusinessAvatar, BusinessAvatarSkeleton, BusinessesEmptyState } from './components';
import { useBusinessesFeed } from './hooks/useBusinessesFeed';
import { BusinessDirectoryItem } from './types/businessDirectory';

const COLUMNS = 4;
const INITIAL_SKELETON_ROWS = 2;

// The Businesses screen (Figma "All Businesses", node 6010:16780), pushed
// from the Home tab's "Business" section "See all" link
// (scenes/home/components/BusinessLogosSection.tsx). Registered in the
// app/(details)/ route group (outside the (main) Tabs group) since Figma
// shows no tab bar on this screen, the same reasoning as /notifications,
// /live-campaign and /campaigns. Shows every business in the directory
// (RBAC API group §E1, GET /business-profiles) via a virtualized 4-column
// FlatList, rather than the mock data/businesses.ts fixture this screen
// used before real backend wiring started.
export default function Businesses() {
  const { colors } = useTheme();
  const {
    businesses,
    isInitialLoading,
    isLoadingMore,
    isInitialError,
    isLoadMoreError,
    hasMore,
    loadMore,
    retry,
  } = useBusinessesFeed();

  const renderItem: ListRenderItem<BusinessDirectoryItem> = useCallback(
    ({ item }) => (
      <BusinessAvatar
        source={item.avatarUrl ? { uri: item.avatarUrl } : null}
        businessName={item.businessName}
        label={item.businessName}
        size={80}
        onPress={() => router.push(`/business/${item.userId}`)}
      />
    ),
    [],
  );

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <View style={layoutStyle.screen}>
        <ScreenHeader
          title="Businesses"
          onBack={() => router.back()}
          style={businessesStyle.headerGap}
        />

        {isInitialLoading ? (
          <View style={businessesStyle.gridRows}>
            {Array.from({ length: INITIAL_SKELETON_ROWS }, (_, rowIndex) => (
              <View key={rowIndex} style={businessesStyle.gridRow}>
                {Array.from({ length: COLUMNS }, (__, colIndex) => (
                  <BusinessAvatarSkeleton key={colIndex} withLabel />
                ))}
              </View>
            ))}
          </View>
        ) : isInitialError ? (
          <BusinessesEmptyState variant="error" onRetry={retry} style={businessesStyle.gridRows} />
        ) : (
          <FlatList
            data={businesses}
            keyExtractor={item => item.userId}
            renderItem={renderItem}
            numColumns={COLUMNS}
            columnWrapperStyle={businessesStyle.columnWrapper}
            style={layoutStyle.screen}
            contentContainerStyle={businessesStyle.gridRows}
            showsVerticalScrollIndicator={false}
            onEndReachedThreshold={0.4}
            onEndReached={hasMore ? loadMore : undefined}
            ListEmptyComponent={<BusinessesEmptyState variant="empty" />}
            ListFooterComponent={
              isLoadingMore ? (
                <View style={businessesStyle.gridRow}>
                  {Array.from({ length: COLUMNS }, (_, index) => (
                    <BusinessAvatarSkeleton key={index} withLabel />
                  ))}
                </View>
              ) : isLoadMoreError ? (
                <BusinessesEmptyState variant="error" onRetry={retry} />
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
