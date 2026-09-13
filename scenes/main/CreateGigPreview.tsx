import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import {
  layoutStyle,
  buttonStyle as sharedButton,
  gigDetailsStyle,
  createGigStyle,
} from '@/styles';
import { useCreateGigSlice } from '@/slices';
import ScreenHeader from '@/components/elements/ScreenHeader';
import Image from '@/components/elements/Image';
import InfoCard from '@/components/elements/InfoCard';
import BulletList from '@/components/elements/BulletList';
import StatusBadge from '@/components/elements/StatusBadge';
import Button from '@/components/elements/Button';
import SuccessSheet from '@/components/elements/SuccessSheet';

const editIcon = require('@/assets/images/create-gig/edit-icon.png');

// Step 3 of the Create Gig wizard - "preview" (Figma "Gig Details page",
// node 6058:6342) plus, once submitted, the read-only "Pending" view of the
// same screen (node 6549:5925, no edit icon or Continue button). Both are
// this one scene keyed off `status` rather than two routes/screens - see
// slices/createGig.slice.ts's `submit` reducer and
// docs/screen/create-gig/preview.md "Cross-cutting scope notes". Reuses
// InfoCard/BulletList, the same components the pre-existing Gig Details
// screen (scenes/main/GigDetails.tsx) uses for its near-identical layout.
export default function CreateGigPreview() {
  const { colors } = useTheme();
  const { coverImageUri, title, price, description, features, status, dispatch, submit } =
    useCreateGigSlice();
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  const isPending = status === 'pending';
  const includedFeatures = features.filter(feature => feature.included && feature.text.trim());
  const descriptionParagraphs = description
    .split('\n')
    .map(paragraph => paragraph.trim())
    .filter(Boolean);

  function handlePublish() {
    dispatch(submit());
    setIsSuccessOpen(true);
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView style={layoutStyle.screen} showsVerticalScrollIndicator={false}>
        <View style={gigDetailsStyle.headerRow}>
          <ScreenHeader
            title="Gig preview"
            onBack={() => router.back()}
            rightElement={
              isPending ? (
                <StatusBadge label="Pending" color="#FEF0C7" textColor="#F79009" />
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Edit gig"
                  hitSlop={8}
                  onPress={() => router.push('/create')}
                  testID="edit-gig-button">
                  <Image source={editIcon} style={createGigStyle.editIcon} contentFit="contain" />
                </Pressable>
              )
            }
          />
        </View>

        {coverImageUri ? (
          <Image source={{ uri: coverImageUri }} style={gigDetailsStyle.image} contentFit="cover" />
        ) : null}

        <View style={gigDetailsStyle.content}>
          <View style={gigDetailsStyle.priceRow}>
            <Text style={[gigDetailsStyle.description, { color: colors.text.primary }]}>
              {title}
            </Text>
            <Text style={[gigDetailsStyle.price, { color: colors.text.primary }]}>${price}</Text>
          </View>

          {!!includedFeatures.length && (
            <View style={gigDetailsStyle.section}>
              <Text style={[gigDetailsStyle.sectionTitle, { color: colors.text.primary }]}>
                What I will create
              </Text>
              <View style={gigDetailsStyle.servicesGap}>
                {includedFeatures.map(feature => (
                  <InfoCard key={feature.id} title={feature.text} />
                ))}
              </View>
            </View>
          )}

          {!!descriptionParagraphs.length && (
            <View style={gigDetailsStyle.section}>
              <Text style={[gigDetailsStyle.sectionTitle, { color: colors.text.primary }]}>
                Description of this Gig
              </Text>
              <BulletList items={descriptionParagraphs} />
            </View>
          )}
        </View>
      </ScrollView>

      {!isPending && (
        <View style={layoutStyle.scrollContent}>
          <Button
            title="Next"
            titleStyle={sharedButton.primaryTitle}
            style={sharedButton.primary}
            onPress={handlePublish}
            testID="publish-gig-button"
          />
        </View>
      )}

      {isSuccessOpen && (
        <SuccessSheet
          title="Congratulation"
          description="Your gig is under review. Gig wil be publish within 24 hours."
          buttonLabel="View Gig"
          buttonStyle={{ backgroundColor: '#DADADA' }}
          buttonTitleStyle={{ color: '#000000' }}
          onButtonPress={() => setIsSuccessOpen(false)}
          onClose={() => setIsSuccessOpen(false)}
        />
      )}
    </SafeAreaView>
  );
}
