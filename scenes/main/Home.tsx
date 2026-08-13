import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks';
import { layoutStyle, homeStyle } from '@/styles';
import Image from '@/components/elements/Image';
import AppHeader from '@/components/elements/AppHeader';
import SectionHeader from '@/components/elements/SectionHeader';
import CampaignCard from '@/components/elements/CampaignCard';
import CampaignMiniCard from '@/components/elements/CampaignMiniCard';
import GigCard from '@/components/elements/GigCard';
import CircleAvatar from '@/components/elements/CircleAvatar';
import {
  activeCampaigns,
  brandLogos,
  popularCampaigns,
  campaigns,
  gigs,
  topRatedInfluencerAvatars,
} from '@/data/home';

const searchIcon = require('@/assets/images/home/search.png');

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 54,
    borderRadius: 67,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchIcon: {
    width: 20,
    height: 20,
  },
  searchPlaceholder: {
    fontSize: 16,
  },
  heroCard: {
    width: 370,
  },
});

// The Home tab of the main app shell (Figma "Home", node 6121:6522).
// Sections are populated from data/home.ts mock content - no backend
// exists yet (docs/PRD.md §2.2/§4.1) - see docs/screen/home/README.md for
// the full scope notes.
export default function Home() {
  const { colors, palette } = useTheme();

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={[layoutStyle.scrollContent, homeStyle.sectionGap]}
        showsVerticalScrollIndicator={false}>
        <AppHeader />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search your campaign"
          style={[
            styles.searchBar,
            { borderColor: palette.gray[50], backgroundColor: palette.gray[25], marginTop: -16 },
          ]}>
          <Image source={searchIcon} style={styles.searchIcon} contentFit="contain" />
          <Text style={[styles.searchPlaceholder, { color: palette.gray[300] }]}>
            Search your campaign
          </Text>
        </Pressable>

        <View style={{ marginTop: -16 }}>
          <SectionHeader title="Active Campaigns" style={homeStyle.sectionHeaderGap} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={[styles.row, homeStyle.horizontalListGap]}>
              {activeCampaigns.map(item => (
                <CampaignCard key={item.id} variant="hero" style={styles.heroCard} {...item} />
              ))}
            </View>
          </ScrollView>
        </View>

        <View>
          <SectionHeader title="Brand" style={homeStyle.sectionHeaderGap} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={[styles.row, homeStyle.avatarListGap]}>
              {brandLogos.map((source, index) => (
                <CircleAvatar key={index} source={source} />
              ))}
            </View>
          </ScrollView>
        </View>

        <View>
          <SectionHeader title="Popular Campaigns" style={homeStyle.sectionHeaderGap} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={[styles.row, homeStyle.horizontalListGap]}>
              {popularCampaigns.map(item => (
                <CampaignMiniCard key={item.id} {...item} />
              ))}
            </View>
          </ScrollView>
        </View>

        <View>
          <SectionHeader title="Campaigns" style={homeStyle.sectionHeaderGap} />
          <View style={homeStyle.campaignListGap}>
            {campaigns.map(item => (
              <CampaignCard key={item.id} variant="list" {...item} />
            ))}
          </View>
        </View>

        <View>
          <SectionHeader title="Top Gigs" style={homeStyle.sectionHeaderGap} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={[styles.row, homeStyle.horizontalListGap]}>
              {gigs.map(item => (
                <GigCard key={item.id} {...item} />
              ))}
            </View>
          </ScrollView>
        </View>

        <View>
          <SectionHeader title="Top Rated Influencer" style={homeStyle.sectionHeaderGap} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={[styles.row, homeStyle.avatarListGap]}>
              {topRatedInfluencerAvatars.map((source, index) => (
                <CircleAvatar key={index} source={source} />
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
