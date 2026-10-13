import { useState } from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { ApiError } from '@/services/http';
import { resolveMediaUrl } from '@/utils/media';
import Image from '@/components/elements/Image';
import StarRating from '@/components/elements/StarRating';
import Toggle from '@/components/elements/Toggle';
import { useSetPortfolioEntryHiddenMutation } from '@/scenes/campaigns/api/campaignFeedApi';
import { PortfolioEntry, PublicPortfolioEntry } from '@/scenes/campaigns/types/portfolio';
import { formatOfferDate } from '@/scenes/campaigns/utils/negotiation';
import { myProfileStyle as s } from '../myProfile.style';
import { portfolioPieceView } from '../utils/campaignWork';

const starIcon = require('@/assets/images/profile/star-rating.png');

const GENERIC = 'Something went wrong. Please try again.';

// One "Campaign work" entry (backend 23c): a completed campaign with what was
// delivered and the business's review once visible. In the owner's view
// (`editable`, My Profile, CK6) the toggle hides it from the public profile
// (CK7) - the change shows at once and is undone, with the server's reason,
// if the request fails. Another creator's entries (CK5) are read-only. A UGC
// file link is never returned, so those pieces say the files were delivered
// privately. Text is plain; only http(s) live-post links open.
function CampaignWorkCard({
  entry,
  editable,
}: {
  entry: PortfolioEntry | PublicPortfolioEntry;
  editable: boolean;
}) {
  const { colors, palette } = useTheme();
  const cover = resolveMediaUrl(entry.campaign.coverUrl);
  const testID = `campaign-work-${entry.engagementId}`;
  const hidden = editable && 'hidden' in entry && entry.hidden;

  return (
    <View
      style={[
        s.workCard,
        { backgroundColor: colors.card, borderColor: colors.border },
        hidden && s.workCardHidden,
      ]}
      testID={testID}>
      {cover ? (
        <Image source={{ uri: cover }} style={s.workCover} contentFit="cover" />
      ) : (
        <View style={s.workCoverPlaceholder}>
          <Feather name="briefcase" size={20} color={palette.primary[400]} />
        </View>
      )}
      <View style={s.workBody}>
        <Text style={[s.workTitle, { color: colors.text.primary }]}>{entry.campaign.title}</Text>
        <Text style={[s.workMeta, { color: colors.text.secondary }]}>
          {entry.business.displayName} · Completed {formatOfferDate(entry.completedAt)}
        </Text>

        {entry.pieces.map((piece, index) => {
          const view = portfolioPieceView(piece, entry.campaign.objective);
          return (
            <View key={`${piece.platform}-${piece.type}-${index}`} style={s.workPiece}>
              <Text style={[s.workPieceLabel, { color: colors.text.primary }]}>{view.label}</Text>
              {view.link ? (
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={`View live post: ${view.label}`}
                  onPress={() => Linking.openURL(view.link!)}
                  hitSlop={6}
                  testID={`${testID}-link-${index}`}>
                  <Text style={s.workLink}>View live post</Text>
                </Pressable>
              ) : (
                <Text style={[s.workMeta, { color: colors.text.secondary }]}>
                  Files delivered privately
                </Text>
              )}
            </View>
          );
        })}

        {entry.review ? (
          <View style={s.workReview} testID={`${testID}-review`}>
            <StarRating
              rating={entry.review.rating}
              icon={starIcon}
              starSize={16}
              label={`${entry.review.rating}/5`}
              accessibilityLabel={`${entry.business.displayName} rated this work ${entry.review.rating} out of 5 stars`}
            />
            <Text style={[s.workPieceLabel, { color: colors.text.primary }]}>
              {entry.review.message}
            </Text>
          </View>
        ) : null}

        {editable ? (
          <VisibilityToggle
            engagementId={entry.engagementId}
            hidden={hidden}
            testID={`${testID}-toggle`}
          />
        ) : null}
      </View>
    </View>
  );
}

// The owner's Hide/Show switch (CK7). Only My Profile renders it, so the
// read-only card never needs the campaign API.
function VisibilityToggle({
  engagementId,
  hidden,
  testID,
}: {
  engagementId: string;
  hidden: boolean;
  testID: string;
}) {
  const { colors } = useTheme();
  const [setHidden] = useSetPortfolioEntryHiddenMutation();
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    try {
      await setHidden({ engagementId, hidden: !hidden }).unwrap();
    } catch (err) {
      Alert.alert(
        "Couldn't update",
        err instanceof ApiError && err.message ? err.message : GENERIC,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <View style={s.workToggleRow}>
      <Text style={[hidden ? s.workHiddenNote : s.workMeta, { color: colors.text.secondary }]}>
        {hidden ? 'Hidden from your public profile' : 'Show on public profile'}
      </Text>
      <Toggle
        value={!hidden}
        onPress={toggle}
        disabled={pending}
        accessibilityLabel="Show on public profile"
        testID={testID}
      />
    </View>
  );
}

export default CampaignWorkCard;
