import { useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, brandsStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import CircleAvatar from '@/components/elements/CircleAvatar';
import { brands } from '@/data/brands';

const COLUMNS = 4;

// The Brands screen (Figma "All Brands", node 6010:16780), pushed from the
// Home tab's "Brand" section "See all" link (scenes/main/Home.tsx).
// Registered as a root-level route (app/brands.tsx, outside the (main)
// Tabs group) since Figma shows no tab bar on this screen, the same
// reasoning as /notifications, /live-campaign and /campaigns. Populated
// from data/brands.ts mock content - no backend exists yet
// (docs/PRD.md §2.2/§4.1) - see docs/screen/brands/README.md.
export default function Brands() {
  const { colors } = useTheme();

  const rows = useMemo(() => {
    const chunks: (typeof brands)[] = [];
    for (let i = 0; i < brands.length; i += COLUMNS) {
      chunks.push(brands.slice(i, i + COLUMNS));
    }
    return chunks;
  }, []);

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Brands" onBack={() => router.back()} style={brandsStyle.headerGap} />

        <View style={brandsStyle.gridRows}>
          {rows.map((row, index) => (
            <View key={index} style={brandsStyle.gridRow}>
              {row.map(item => (
                <CircleAvatar key={item.id} source={item.source} label={item.label} size={94} />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
