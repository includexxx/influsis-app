import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme, useDetailLookup } from '@/hooks';
import { layoutStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import Image from '@/components/elements/Image';
import InfoCard from '@/components/elements/InfoCard';
import BulletList from '@/components/elements/BulletList';
import { gigDetailsStyle } from './gigDetails.styles';
import { gigs } from './gigs.data';

// The Gig Details screen (Figma "Gig Details page", node 6401:5719),
// pushed from any gig card's tap - Home's "Top Gigs" row and the full
// /top-gigs list both use the same GigCard component with an onPress that
// navigates here (scenes/main/Home.tsx, scenes/main/TopGigs.tsx).
// Registered as a dynamic route in the app/(details)/ route group
// (app/(details)/gig/[id].tsx), the same "no tab bar" reasoning as every
// other screen in that group - Figma's frame has no tab bar instance.
// Looks the tapped gig up by id in data/gigs.ts, the canonical gig list
// every gig-showing screen now shares - see docs/screen/gig-details/README.md.
export default function GigDetails() {
  const { colors } = useTheme();
  const { item: gig, notFoundElement } = useDetailLookup(gigs);

  if (!gig) {
    return notFoundElement;
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView style={layoutStyle.screen} showsVerticalScrollIndicator={false}>
        <View style={gigDetailsStyle.headerRow}>
          <ScreenHeader title="Gig Details" onBack={() => router.back()} />
        </View>

        <Image source={gig.image} style={gigDetailsStyle.image} contentFit="cover" />

        <View style={gigDetailsStyle.content}>
          <View style={gigDetailsStyle.priceRow}>
            <Text style={[gigDetailsStyle.description, { color: colors.text.primary }]}>
              {gig.description}
            </Text>
            <Text style={[gigDetailsStyle.price, { color: colors.text.primary }]}>{gig.price}</Text>
          </View>

          {!!gig.services?.length && (
            <View style={gigDetailsStyle.section}>
              <Text style={[gigDetailsStyle.sectionTitle, { color: colors.text.primary }]}>
                What I will create
              </Text>
              <View style={gigDetailsStyle.servicesGap}>
                {gig.services.map(service => (
                  <InfoCard
                    key={service.title}
                    title={service.title}
                    description={service.description}
                  />
                ))}
              </View>
            </View>
          )}

          {!!gig.descriptionBullets?.length && (
            <View style={gigDetailsStyle.section}>
              <Text style={[gigDetailsStyle.sectionTitle, { color: colors.text.primary }]}>
                Description of this Gig
              </Text>
              <BulletList items={gig.descriptionBullets} />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
