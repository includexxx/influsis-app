import { View, Text, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { palette } from '@/theme';
import FallbackImage from '@/components/elements/FallbackImage';
import StatusBadge from '@/components/elements/StatusBadge';
import { campaignDetailsStyle as s } from '../../campaignDetails.style';

const defaultCover = require('@/assets/images/home/hero-campaign.jpg');

/** The frosted round back button that floats over the cover (and over the
 * loading skeleton, so the screen can always be left). */
export function GlassBackButton({ onPress, top }: { onPress: () => void; top: number }) {
  return (
    <View style={[s.coverTopBar, { top }]} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
        onPress={onPress}
        style={({ pressed }) => pressed && s.pressed}
        testID="campaign-details-back">
        <BlurView intensity={40} tint="dark" style={s.glassButton}>
          <Feather name="chevron-left" size={24} color={palette.white} />
        </BlurView>
      </Pressable>
    </View>
  );
}

export interface CampaignCoverProps {
  title: string;
  coverUrl: string | null;
  location: string | null;
  tags: string[];
  /** "Applied" / "Invited" / ... when the creator is already engaged. */
  engagementStatus?: string;
  topInset: number;
  onBack: () => void;
}

// Full-bleed cover photo painted under the status bar: a frosted back button
// and the engagement status on top, category pills, the title and location
// over a dark bottom scrim. The content sheet below overlaps its bottom edge.
export default function CampaignCover({
  title,
  coverUrl,
  location,
  tags,
  engagementStatus,
  topInset,
  onBack,
}: CampaignCoverProps) {
  return (
    <View style={s.cover} testID="campaign-details-cover">
      <FallbackImage
        source={coverUrl ? { uri: coverUrl } : null}
        fallbackSource={defaultCover}
        name={title}
        style={s.coverImage}
      />
      <LinearGradient
        colors={['rgba(3, 3, 4, 0.45)', 'rgba(3, 3, 4, 0)', 'rgba(3, 3, 4, 0.8)']}
        locations={[0, 0.35, 1]}
        style={s.coverScrim}
      />

      <GlassBackButton onPress={onBack} top={topInset + 8} />
      {engagementStatus ? (
        // Full-width like the back button's row, so it must not swallow
        // the back button's touches.
        <View
          pointerEvents="none"
          style={[s.coverTopBar, { top: topInset + 16, justifyContent: 'flex-end' }]}>
          <StatusBadge
            label={engagementStatus}
            color={palette.success[500]}
            textColor={palette.white}
          />
        </View>
      ) : null}

      <View style={s.coverBottom}>
        {tags.length ? (
          <View style={s.tagRow}>
            {tags.map(tag => (
              <BlurView key={tag} intensity={30} tint="light" style={s.glassPill}>
                <Text style={s.glassPillText}>{tag}</Text>
              </BlurView>
            ))}
          </View>
        ) : null}
        <Text style={s.coverTitle} numberOfLines={3} accessibilityRole="header">
          {title}
        </Text>
        {location ? (
          <View style={s.coverMetaRow}>
            <Feather name="map-pin" size={14} color="rgba(255, 255, 255, 0.85)" />
            <Text style={s.coverMeta} numberOfLines={1}>
              {location}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
