import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/hooks';
import { layoutStyle } from '@/styles';
import { palette } from '@/theme';
import { ApiError } from '@/services/http';
import { uploadMediaImage } from '@/services/mediaUpload';
import Image from '@/components/elements/Image';
import ScreenHeader from '@/components/elements/ScreenHeader';
import Button from '@/components/elements/Button';
import TextField from '@/components/elements/TextField';
import { pieceStyle as p } from './deliverablePiece.style';
import { submitDeliveryStyle as s } from './submitDelivery.style';
import { CampaignRequestCardSkeleton, CampaignsEmptyState } from './components';
import {
  useGetEngagementDeliveryQuery,
  useSubmitDeliveryRoundMutation,
} from './api/campaignFeedApi';
import { CAPTION_MAX_LENGTH, formatRevisionsLeft } from './utils/deliverables';
import {
  deliveryStatusView,
  DeliverySlot,
  initialSlots,
  isSlotReady,
  latestRound,
  roundErrorsFromApi,
  SlotSource,
  toRoundItems,
  validateSlot,
} from './utils/delivery';
import { formatOfferDate } from './utils/negotiation';
import { FeatherName } from './utils/platformIcon';

const GENERIC_ERROR = "Couldn't submit your delivery. Please try again.";
const NETWORK_ERROR = 'Cannot reach the server. Check your connection and try again.';

// An upload failure (POST /media), named on its slot. Nothing is sent then.
function uploadErrorMessage(err: unknown): string {
  const error = err instanceof ApiError ? err : null;
  if (error?.statusCode === 413) return 'That image is too large (max 5 MB).';
  if (error?.statusCode === 422) return "That image type isn't supported.";
  if (error?.code === 'NETWORK_ERROR') return NETWORK_ERROR;
  return "Couldn't upload that image. Please try again.";
}

const SOURCE_OPTIONS: { value: SlotSource; label: string; icon: FeatherName }[] = [
  { value: 'keep', label: 'Keep previous', icon: 'corner-up-left' },
  { value: 'link', label: 'Link', icon: 'link' },
  { value: 'image', label: 'Image', icon: 'image' },
];

// The Submit delivery screen (backend 18r1) - every piece of an accepted
// engagement delivered together as one draft round: a slot per non-cancelled
// piece with a link or an image (uploaded first with POST /media) and an
// optional caption, sent as one POST /engagements/:id/delivery/rounds. After
// the business requests changes each slot shows its comment and starts on
// "Keep previous", which carries the earlier item over (`reuseItemId`)
// without re-uploading. Submit stays disabled until every slot is ready. A
// 409 refetches the delivery; a 422 lands on the slot it names. Only the
// draft stages can submit here - the final round is 36b. Pushed from the
// Deliverables screen; `title` rides along for the header card.
export default function SubmitDeliveryScreen() {
  const { colors } = useTheme();
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const engagementId = id ?? '';
  const delivery = useGetEngagementDeliveryQuery({ engagementId }, { skip: !engagementId });
  const [submitRound] = useSubmitDeliveryRoundMutation();

  const [slots, setSlots] = useState<DeliverySlot[] | null>(null);
  const [slotErrors, setSlotErrors] = useState<Record<number, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Slots start from the first delivery read; a refetch (after a 409) keeps
  // what the creator already entered.
  useEffect(() => {
    if (delivery.data && slots === null) setSlots(initialSlots(delivery.data));
  }, [delivery.data, slots]);

  const header = (
    <ScreenHeader title="Submit delivery" onBack={() => router.back()} style={p.headerGap} />
  );

  if (!engagementId || delivery.error?.code === 'NOT_FOUND') {
    return <Redirect href="/live-campaign" />;
  }

  if (delivery.isLoading || (delivery.data && !slots)) {
    return (
      <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
        <View style={layoutStyle.scrollContent} testID="submit-delivery-loading">
          {header}
          <CampaignRequestCardSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (delivery.isError || !delivery.data || !slots) {
    return (
      <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
        <View style={layoutStyle.scrollContent}>
          {header}
          <CampaignsEmptyState variant="error" onRetry={delivery.refetch} />
        </View>
      </SafeAreaView>
    );
  }

  const data = delivery.data;
  const view = deliveryStatusView(data);

  if (!view?.canSubmit) {
    return (
      <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
        <View style={layoutStyle.scrollContent}>
          {header}
          <View
            style={[p.emptyCard, { borderColor: colors.border, backgroundColor: colors.surface }]}
            testID="submit-delivery-unavailable">
            <View style={p.emptyIcon}>
              <Feather name="check-circle" size={20} color={palette.primary[500]} />
            </View>
            <Text style={[p.hintText, { color: colors.text.secondary }]}>
              Nothing to submit right now.
            </Text>
          </View>
          <Button
            title="Back"
            style={p.primaryButton}
            titleStyle={p.primaryTitle}
            onPress={() => router.back()}
            testID="submit-delivery-back"
          />
        </View>
      </SafeAreaView>
    );
  }

  const revising = data.stage === 'draft_changes_requested';
  const reason = revising ? (latestRound(data)?.reviewReason ?? null) : null;
  const ready = slots.length > 0 && slots.every(isSlotReady);

  function updateSlot(index: number, patch: Partial<DeliverySlot>) {
    setSlots(current =>
      current ? current.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)) : current,
    );
    setSlotErrors(current => {
      if (!(index in current)) return current;
      const next = { ...current };
      delete next[index];
      return next;
    });
    setFormError(null);
  }

  async function pickImage(index: number) {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setSlotErrors(current => ({
          ...current,
          [index]: 'Allow photo access in Settings to upload an image.',
        }));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      const asset = !result.canceled ? result.assets[0] : undefined;
      if (asset) {
        updateSlot(index, {
          image: {
            uri: asset.uri,
            mimeType: asset.mimeType,
            fileName: asset.fileName ?? undefined,
          },
        });
      }
    } catch {
      setSlotErrors(current => ({
        ...current,
        [index]: "Couldn't open your photos. Please try again.",
      }));
    }
  }

  async function submit() {
    if (!slots || !ready || busy) return;
    setBusy(true);
    setFormError(null);
    setSlotErrors({});

    // Uploads one at a time, so a failure names its slot and nothing is sent.
    const mediaIds: Record<string, string> = {};
    for (const [index, slot] of slots.entries()) {
      if (slot.source !== 'image' || !slot.image) continue;
      try {
        mediaIds[slot.pieceId] = await uploadMediaImage(slot.image);
      } catch (err) {
        setSlotErrors({ [index]: uploadErrorMessage(err) });
        setBusy(false);
        return;
      }
    }

    try {
      await submitRound({ engagementId, items: toRoundItems(slots, mediaIds) }).unwrap();
      setBusy(false);
      router.back();
    } catch (err) {
      const error = err instanceof ApiError ? err : null;
      if (error?.statusCode === 409) {
        setFormError(error.message || GENERIC_ERROR);
        delivery.refetch();
      } else if (error?.statusCode === 422) {
        const mapped = roundErrorsFromApi(error.errors, slots.length);
        setSlotErrors(mapped.slots);
        setFormError(
          mapped.form ?? (Object.keys(mapped.slots).length ? null : error.message || GENERIC_ERROR),
        );
      } else {
        setFormError(error?.code === 'NETWORK_ERROR' ? NETWORK_ERROR : GENERIC_ERROR);
      }
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {header}
        <View style={p.content}>
          <View
            style={[p.card, { borderColor: colors.border, backgroundColor: colors.card }]}
            testID="submit-delivery-intro">
            <Text style={[p.cardTitle, { color: colors.text.primary }]} numberOfLines={2}>
              {title || 'Campaign'}
            </Text>
            <Text style={[p.hintText, { color: colors.text.secondary }]}>
              {revising
                ? 'Send a revised draft. Keep the pieces the business was happy with.'
                : 'Deliver every piece together. The business reviews them as one draft.'}
            </Text>
            {reason ? (
              <View style={[p.notice, p.warningNotice]} testID="submit-delivery-reason">
                <View style={[p.noticeIcon, p.warningIcon]}>
                  <Feather name="message-square" size={16} color={p.warningText.color} />
                </View>
                <View style={p.noticeBody}>
                  <Text style={[p.noticeTitle, p.warningText]}>The business asked for changes</Text>
                  <Text style={[p.noticeText, p.warningText]}>{reason}</Text>
                </View>
              </View>
            ) : null}
            {revising ? (
              <Text style={[s.metaStrong, { color: colors.text.primary }]}>
                {formatRevisionsLeft(data.revisionsRemaining)}
              </Text>
            ) : null}
            <Text style={[s.hint, { color: colors.text.secondary }]}>
              Videos are shared as links. Images can be JPEG, PNG, GIF or WebP up to 5 MB.
            </Text>
          </View>

          {slots.map((slot, index) => (
            <SlotCard
              key={slot.pieceId}
              slot={slot}
              index={index}
              error={slotErrors[index] ?? null}
              disabled={busy}
              onChange={patch => updateSlot(index, patch)}
              onPickImage={() => void pickImage(index)}
            />
          ))}

          {formError ? (
            <View
              style={[p.formBanner, p.errorNotice]}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              testID="submit-delivery-error">
              <Feather name="alert-circle" size={16} color={p.errorText.color} />
              <Text style={[p.formBannerText, p.errorText]}>{formError}</Text>
            </View>
          ) : null}

          <Button
            title={revising ? 'Submit revised draft' : 'Submit delivery'}
            style={p.primaryButton}
            titleStyle={p.primaryTitle}
            onPress={() => void submit()}
            isLoading={busy}
            disabled={!ready || busy}
            accessibilityState={{ disabled: !ready || busy }}
            testID="submit-delivery-submit"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SlotCard({
  slot,
  index,
  error,
  disabled,
  onChange,
  onPickImage,
}: {
  slot: DeliverySlot;
  index: number;
  error: string | null;
  disabled: boolean;
  onChange: (patch: Partial<DeliverySlot>) => void;
  onPickImage: () => void;
}) {
  const { colors } = useTheme();
  const options = SOURCE_OPTIONS.filter(option => option.value !== 'keep' || slot.previous);
  // Local rule messages show once there's something to judge; the server's
  // (or an upload's) message wins.
  const local = validateSlot(slot);
  const linkError = slot.source === 'link' && slot.externalUrl.trim() ? local.externalUrl : null;
  const shownError = error ?? linkError ?? local.caption ?? null;

  return (
    <View
      style={[p.card, { borderColor: colors.border, backgroundColor: colors.card }]}
      testID={`delivery-slot-${index}`}>
      <View style={s.slotHeader}>
        <Text style={[p.cardTitle, { color: colors.text.primary }]}>{slot.label}</Text>
        {slot.dueDate ? (
          <Text style={[p.cardSubtitle, { color: colors.text.secondary }]}>
            Due {formatOfferDate(slot.dueDate)}
          </Text>
        ) : null}
      </View>

      {slot.comment ? (
        <View style={s.comment} testID={`delivery-slot-${index}-comment`}>
          <Feather name="message-circle" size={14} color={palette.warning[700]} />
          <Text style={s.commentText}>{slot.comment}</Text>
        </View>
      ) : null}

      <View
        style={[p.segmented, { backgroundColor: colors.surface }]}
        accessibilityRole="radiogroup">
        {options.map(option => {
          const active = slot.source === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={`${option.label} for ${slot.label}`}
              onPress={() => !active && onChange({ source: option.value })}
              disabled={disabled}
              style={[p.segment, active && p.segmentActive]}
              testID={`delivery-slot-${index}-${option.value}`}>
              <Feather
                name={option.icon}
                size={15}
                color={active ? palette.primary[500] : colors.text.secondary}
              />
              <Text
                style={[
                  p.segmentText,
                  { color: colors.text.secondary },
                  active && p.segmentTextActive,
                ]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {slot.source === 'keep' && slot.previous ? (
        <View style={p.attachment} testID={`delivery-slot-${index}-previous`}>
          <Feather
            name={slot.previous.isUpload ? 'image' : 'link'}
            size={14}
            color={colors.text.secondary}
          />
          <Text style={[p.attachmentText, { color: colors.text.secondary }]} numberOfLines={2}>
            {slot.previous.isUpload ? 'Uploaded image' : slot.previous.externalUrl}
          </Text>
        </View>
      ) : slot.source === 'link' ? (
        <TextField
          label="Link to your content"
          placeholder="https://"
          value={slot.externalUrl}
          onChangeText={externalUrl => onChange({ externalUrl })}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          editable={!disabled}
          leftAdornment={<Feather name="link" size={16} color={colors.text.secondary} />}
          accessibilityLabel={`Link for ${slot.label}`}
          testID={`delivery-slot-${index}-url`}
        />
      ) : slot.image ? (
        <View style={p.preview}>
          <Image source={{ uri: slot.image.uri }} style={p.previewImage} contentFit="cover" />
          <View style={p.previewActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Change image for ${slot.label}`}
              onPress={onPickImage}
              disabled={disabled}
              style={p.previewAction}
              testID={`delivery-slot-${index}-pick`}>
              <Feather name="refresh-cw" size={12} color={palette.white} />
              <Text style={p.previewActionText}>Change</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove image for ${slot.label}`}
              onPress={() => onChange({ image: null })}
              disabled={disabled}
              style={p.previewAction}
              testID={`delivery-slot-${index}-remove`}>
              <Feather name="x" size={12} color={palette.white} />
              <Text style={p.previewActionText}>Remove</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Choose image for ${slot.label}`}
          onPress={onPickImage}
          disabled={disabled}
          style={[p.dropzone, { borderColor: colors.border, backgroundColor: colors.surface }]}
          testID={`delivery-slot-${index}-pick`}>
          <View style={p.dropzoneIcon}>
            <Feather name="image" size={22} color={palette.primary[500]} />
          </View>
          <Text style={[p.dropzoneTitle, { color: colors.text.primary }]}>Choose an image</Text>
          <Text style={[p.dropzoneHint, { color: colors.text.secondary }]}>Up to 5 MB.</Text>
        </Pressable>
      )}

      <TextField
        label="Caption (optional)"
        placeholder={
          slot.source === 'keep' && slot.previous?.caption
            ? slot.previous.caption
            : 'Anything the business should know'
        }
        value={slot.caption}
        onChangeText={caption => onChange({ caption })}
        multiline
        maxLength={CAPTION_MAX_LENGTH}
        editable={!disabled}
        inputStyle={p.multiline}
        accessibilityLabel={`Caption for ${slot.label}`}
        testID={`delivery-slot-${index}-caption`}
      />

      {shownError ? (
        <Text
          style={p.fieldError}
          accessibilityRole="alert"
          testID={`delivery-slot-${index}-error`}>
          {shownError}
        </Text>
      ) : null}
    </View>
  );
}
