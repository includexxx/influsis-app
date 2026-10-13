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
import { PortfolioEntry } from '@/scenes/campaigns/types/portfolio';
import { formatOfferDate } from '@/scenes/campaigns/utils/negotiation';
import { myProfileStyle as s } from '../myProfile.style';
import { portfolioPieceView } from '../utils/campaignWork';

const starIcon = require('@/assets/images/profile/star-rating.png');

const GENERIC = 'Something went wrong. Please try again.';

// One "Campaign work" entry on My Profile (backend 23c CK6): a completed
// campaign with what was delivered and the business's review once visible.
// The toggle hides it from the public profile (CK7) - the change shows at
// once and is undone, with the server's reason, if the request fails. A UGC
// file link is never returned, so those pieces say the files were delivered
// privately. Text is plain; only http(s) live-post links open.
function CampaignWorkCard({ entry }: { entry: PortfolioEntry }) {
  const { colors, palette } = useTheme();
  const [setHidden] = useSetPortfolioEntryHiddenMutation();
  const [pending, setPending] = useState(false);
  const cover = resolveMediaUrl(entry.campaign.coverUrl);
  const testID = `campaign-work-${entry.engagementId}`;

  async function toggle() {
    setPending(true);
    try {
      await setHidden({ engagementId: entry.engagementId, hidden: !entry.hidden }).unwrap();
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
    <View
      style={[
        s.workCard,
        { backgroundColor: colors.card, borderColor: colors.border },
        entry.hidden && s.workCardHidden,
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
              accessibilityLabel={`${entry.business.displayName} rated you ${entry.review.rating} out of 5 stars`}
            />
            <Text style={[s.workPieceLabel, { color: colors.text.primary }]}>
              {entry.review.message}
            </Text>
          </View>
        ) : null}

        <View style={s.workToggleRow}>
          <Text
            style={[
              entry.hidden ? s.workHiddenNote : s.workMeta,
              { color: colors.text.secondary },
            ]}>
            {entry.hidden ? 'Hidden from your public profile' : 'Show on public profile'}
          </Text>
          <Toggle
            value={!entry.hidden}
            onPress={toggle}
            disabled={pending}
            accessibilityLabel="Show on public profile"
            testID={`${testID}-toggle`}
          />
        </View>
      </View>
    </View>
  );
}

export default CampaignWorkCard;
