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
import DeliverablesEditor from '@/components/elements/DeliverablesEditor';
import OptionSheet from '@/components/elements/OptionSheet';
import { ApiError } from '@/services/http';
import { useApplyToCampaignMutation, useGetFeedCampaignQuery } from './api/campaignFeedApi';
import { ApplyCampaignSkeleton, CampaignsEmptyState } from './components';
import { CampaignFeedDetail } from './types/campaignFeed';
import { formatCampaignEngagementStatus, formatCampaignPrice } from './utils/mapCampaignFeedItem';
import { applyDefaultValues, applySchema, ApplyValues, toApplyPayload } from './utils/applySchema';
import { applyApplicationError } from './utils/applyErrors';
import { ScopeItem } from './types/myEngagement';
import {
  addableScopeOptions,
  addScopeItem,
  isSameScope,
  SCOPE_MAX_ITEMS,
  scopeErrorsFromApi,
  scopeFromList,
  scopeItemLabel,
  scopeListErrorFromApi,
  scopePairKey,
  validateScope,
} from './utils/scope';

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
// Backend 18l: the campaign's deliverables are shown, and the creator can
// propose a different list - sent as CF1 `scope` only when it differs.
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
  const campaignScope = scopeFromList(campaign.deliverables ?? []);
  // null = accept the campaign's deliverables (editor closed).
  const [scopeRows, setScopeRows] = useState<ScopeItem[] | null>(null);
  const [scopeRowErrors, setScopeRowErrors] = useState<Record<number, string>>({});
  const [scopeListError, setScopeListError] = useState<string | null>(null);
  const [scopeSheetOpen, setScopeSheetOpen] = useState(false);

  function changeScope(next: ScopeItem[] | null) {
    setScopeRows(next);
    setScopeRowErrors({});
    setScopeListError(null);
  }

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
    let scope: ScopeItem[] | undefined;
    if (scopeRows) {
      const checked = validateScope(scopeRows);
      if (!checked.ok) {
        setScopeRowErrors(checked.rowErrors);
        setScopeListError(checked.error);
        return;
      }
      if (!isSameScope(checked.scope, campaignScope)) scope = checked.scope;
    }
    try {
      await applyToCampaign({
        campaignId: campaign.id,
        ...toApplyPayload(values),
        ...(scope ? { scope } : {}),
      }).unwrap();
      setIsSuccessOpen(true);
    } catch (err) {
      // A 422 about the proposed deliverables belongs on the editor.
      if (err instanceof ApiError && err.statusCode === 422 && scopeRows) {
        const byRow = scopeErrorsFromApi(err.errors);
        const list = scopeListErrorFromApi(err.errors);
        if (Object.keys(byRow).length || list) {
          setScopeRowErrors(byRow);
          setScopeListError(list);
          return;
        }
      }
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

        <View style={applyCampaignStyle.sectionBlock} testID="apply-deliverables">
          <Text style={[applyCampaignStyle.sectionTitle, { color: colors.text.primary }]}>
            Deliverables
          </Text>
          {scopeRows ? (
            <>
              <Pressable
                accessibilityRole="button"
                onPress={() => changeScope(null)}
                testID="apply-use-campaign-deliverables">
                <Text style={[applyCampaignStyle.linkText, { color: palette.primary[500] }]}>
                  Use the campaign&apos;s deliverables
                </Text>
              </Pressable>
              <DeliverablesEditor
                items={scopeRows.map(row => ({
                  key: scopePairKey(row),
                  label: scopeItemLabel(row),
                  count: row.count,
                }))}
                onCountChange={(index, count) =>
                  changeScope(scopeRows.map((row, i) => (i === index ? { ...row, count } : row)))
                }
                onRemove={index => changeScope(scopeRows.filter((_, i) => i !== index))}
                onAddPress={() => setScopeSheetOpen(true)}
                addDisabled={
                  scopeRows.length >= SCOPE_MAX_ITEMS || addableScopeOptions(scopeRows).length === 0
                }
                rowErrors={scopeRowErrors}
                error={scopeListError}
                testID="apply-scope-editor"
              />
            </>
          ) : (
            <>
              {campaignScope.length ? (
                campaignScope.map(item => (
                  <Text
                    key={scopePairKey(item)}
                    style={[applyCampaignStyle.scopeLine, { color: colors.text.primary }]}>
                    {item.count} × {scopeItemLabel(item)}
                  </Text>
                ))
              ) : (
                <Text style={recapTextStyle}>This campaign lists no deliverables.</Text>
              )}
              <Pressable
                accessibilityRole="button"
                onPress={() => changeScope(campaignScope)}
                testID="apply-propose-deliverables">
                <Text style={[applyCampaignStyle.linkText, { color: palette.primary[500] }]}>
                  Propose different deliverables
                </Text>
              </Pressable>
            </>
          )}
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

      {scopeSheetOpen && scopeRows ? (
        <OptionSheet
          options={addableScopeOptions(scopeRows)}
          onSelect={value => {
            changeScope(addScopeItem(scopeRows, value));
            setScopeSheetOpen(false);
          }}
          onClose={() => setScopeSheetOpen(false)}
        />
      ) : null}

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
