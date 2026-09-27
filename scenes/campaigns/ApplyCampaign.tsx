import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '@/hooks';
import { layoutStyle, buttonStyle as sharedButton } from '@/styles';
import { applyCampaignStyle } from './applyCampaign.style';
import Image from '@/components/elements/Image';
import ControlledTextField from '@/components/elements/ControlledTextField';
import Button from '@/components/elements/Button';
import SuccessSheet from '@/components/elements/SuccessSheet';
import { useApplyToCampaignMutation, useGetFeedCampaignQuery } from './api/campaignFeedApi';
import { ApplyCampaignSkeleton, CampaignsEmptyState } from './components';
import { CampaignFeedDetail } from './types/campaignFeed';
import { formatCampaignEngagementStatus, formatCampaignPrice } from './utils/mapCampaignFeedItem';
import { applyDefaultValues, applySchema, ApplyValues, toApplyPayload } from './utils/applySchema';
import { applyApplicationError } from './utils/applyErrors';

const backChevronIcon = require('@/assets/images/icons/back-chevron.png');

// The Apply Campaign screen (Figma "Apply campaign", node 6011:8293 /
// 6393:7254 / 6393:7407) - pushed from Campaign Details' "Apply Now"
// button. Registered as a nested dynamic route
// (app/(details)/campaign/[id]/apply.tsx, path `/campaign/[id]/apply`)
// alongside the existing `/campaign/[id]` route, the same "no tab bar"
// `(details)` group reasoning. See docs/screen/apply-campaign/README.md.
//
// Reads the campaign from CB2 (GET /feed/campaigns/:id, the same cached
// query Campaign Details used) and submits CF1 (POST /feed/campaigns/:id/
// apply) with a pitch and an asking rate, both required by the backend.
// Figma's "Showcase your top work" file upload is left out: CF1 has no file
// field, so picked files would never reach the business. The portfolio
// links are sent, though the backend currently validates and discards them.
export default function ApplyCampaign() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    data: campaign,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetFeedCampaignQuery({ id: id ?? '' }, { skip: !id });

  if (!id || error?.code === 'NOT_FOUND') {
    return <Redirect href="/home" />;
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <View style={applyCampaignStyle.headerRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          style={applyCampaignStyle.backButton}
          onPress={() => router.back()}>
          <Image
            source={backChevronIcon}
            style={applyCampaignStyle.backButton}
            contentFit="contain"
          />
        </Pressable>
      </View>

      {isLoading ? (
        <ApplyCampaignSkeleton />
      ) : isError || !campaign ? (
        <CampaignsEmptyState variant="error" onRetry={refetch} style={applyCampaignStyle.content} />
      ) : (
        <ApplyForm campaign={campaign} />
      )}
    </SafeAreaView>
  );
}

function ApplyForm({ campaign }: { campaign: CampaignFeedDetail }) {
  const { colors, palette } = useTheme();
  const [applyToCampaign] = useApplyToCampaignMutation();
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const engagementStatus = formatCampaignEngagementStatus(campaign.myEngagement);

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ApplyValues>({
    resolver: zodResolver(applySchema),
    defaultValues: applyDefaultValues,
  });

  async function onSubmit(values: ApplyValues) {
    clearErrors('root');
    try {
      await applyToCampaign({ campaignId: campaign.id, ...toApplyPayload(values) }).unwrap();
      setIsSuccessOpen(true);
    } catch (err) {
      applyApplicationError(err, setError);
    }
  }

  const recapFieldStyle = [applyCampaignStyle.recapField, { backgroundColor: palette.gray[25] }];
  const recapTextStyle = [applyCampaignStyle.recapText, { color: palette.gray[400] }];

  return (
    <>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={applyCampaignStyle.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={applyCampaignStyle.sectionBlock}>
          <Text style={[applyCampaignStyle.heading, { color: colors.text.primary }]}>
            Make your application
          </Text>

          <View style={recapFieldStyle}>
            <Text style={recapTextStyle}>{campaign.title}</Text>
          </View>

          {campaign.description && (
            <View style={recapFieldStyle}>
              <Text style={recapTextStyle} numberOfLines={4}>
                {campaign.description}
              </Text>
            </View>
          )}

          <View style={recapFieldStyle}>
            <Text style={recapTextStyle}>
              {`Budget: ${formatCampaignPrice(campaign.budgetAmountMinor, campaign.currency)}`}
            </Text>
          </View>
        </View>

        <View style={applyCampaignStyle.sectionBlock}>
          <Text style={[applyCampaignStyle.sectionTitle, { color: colors.text.primary }]}>
            Your pitch
          </Text>
          <ControlledTextField
            control={control}
            name="pitch"
            placeholder="Why are you a good fit for this campaign?"
            multiline
            maxLength={2000}
            inputStyle={applyCampaignStyle.textarea}
            testID="apply-pitch"
          />
        </View>

        <View style={applyCampaignStyle.sectionBlock}>
          <Text style={[applyCampaignStyle.sectionTitle, { color: colors.text.primary }]}>
            Your rate
          </Text>
          <ControlledTextField
            control={control}
            name="amount"
            placeholder="How much do you want for this campaign?"
            keyboardType="decimal-pad"
            leftAdornment={
              <Text style={[applyCampaignStyle.currency, { color: colors.text.primary }]}>
                {campaign.currency}
              </Text>
            }
            testID="apply-amount"
          />
        </View>

        <View style={applyCampaignStyle.sectionBlock}>
          <Text style={[applyCampaignStyle.sectionTitle, { color: colors.text.primary }]}>
            Portfolio Links
          </Text>
          <View style={applyCampaignStyle.linkList}>
            <ControlledTextField
              control={control}
              name="linkOne"
              placeholder="Add social media or portfolio links"
              autoCapitalize="none"
              keyboardType="url"
              testID="portfolio-link-one"
            />
            <ControlledTextField
              control={control}
              name="linkTwo"
              placeholder="Add social media or portfolio links"
              autoCapitalize="none"
              keyboardType="url"
              testID="portfolio-link-two"
            />
          </View>
        </View>

        {errors.root?.message ? (
          <Text
            accessibilityRole="alert"
            style={[applyCampaignStyle.rootError, { color: colors.error }]}>
            {errors.root.message}
          </Text>
        ) : null}

        {/* Already applied or invited: the backend would 409 a second apply. */}
        <Button
          title={engagementStatus ?? 'Apply Now'}
          titleStyle={sharedButton.primaryTitle}
          style={sharedButton.primary}
          onPress={handleSubmit(onSubmit)}
          isLoading={isSubmitting}
          disabled={!!engagementStatus || isSubmitting}
          testID="apply-now-button"
        />
      </ScrollView>

      {isSuccessOpen && (
        <SuccessSheet
          title="Successful!"
          description="Your application has been submitted. The business will be in touch if you're a good fit."
          buttonLabel="Go to campaign"
          buttonStyle={{ backgroundColor: '#DADADA' }}
          buttonTitleStyle={{ color: '#000000' }}
          onButtonPress={() => {
            setIsSuccessOpen(false);
            router.back();
          }}
          onClose={() => {
            setIsSuccessOpen(false);
            router.back();
          }}
        />
      )}
    </>
  );
}
