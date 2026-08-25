import { useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, businessesStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import CircleAvatar from '@/components/elements/CircleAvatar';
import { businesses } from '@/data/businesses';

const COLUMNS = 4;

// The Businesses screen (Figma "All Businesses", node 6010:16780), pushed from the
// Home tab's "Business" section "See all" link (scenes/main/Home.tsx).
// Registered in the app/(details)/ route group (outside the (main) Tabs
// group) since Figma shows no tab bar on this screen, the same reasoning
// as /notifications, /live-campaign and /campaigns. Populated
// from data/businesses.ts mock content - no backend exists yet
// (docs/PRD.md §2.2/§4.1) - see docs/screen/businesses/README.md.
export default function Businesses() {
  const { colors } = useTheme();

  const rows = useMemo(() => {
    const chunks: (typeof businesses)[] = [];
    for (let i = 0; i < businesses.length; i += COLUMNS) {
      chunks.push(businesses.slice(i, i + COLUMNS));
    }
    return chunks;
  }, []);

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Businesses" onBack={() => router.back()} style={businessesStyle.headerGap} />

        <View style={businessesStyle.gridRows}>
          {rows.map((row, index) => (
            <View key={index} style={businessesStyle.gridRow}>
              {row.map(item => (
                <CircleAvatar
                  key={item.id}
                  source={item.source}
                  label={item.label}
                  size={80}
                  onPress={() => router.push(`/business/${item.id}`)}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
