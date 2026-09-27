import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ImageSourcePropType,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/hooks';
import { getShadowStyle, radius, spacing } from '@/theme';
import FallbackImage from '../FallbackImage';

export interface CampaignRequestCardProps {
  /** `null` (or a URL that fails to load) shows the name's initial. */
  avatar: ImageSourcePropType | null;
  businessName: string;
  /** Replaces the default "{businessName} invited you to join a Campaign" copy. */
  message?: string;
  time: string;
  onAccept?: () => void;
  onDecline?: () => void;
  /** Dims and disables both buttons, e.g. while a response is being sent. */
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: radius.lg,
    padding: 13,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: radius.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: 14,
    lineHeight: 17,
    letterSpacing: -0.28,
    fontWeight: '600',
  },
  time: {
    fontSize: 14,
    lineHeight: 17,
    letterSpacing: -0.28,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    height: 23,
    minWidth: 53,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  disabled: {
    opacity: 0.5,
  },
  actionLabel: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '500',
  },
});

// A business's campaign invitation row (Figma "Frame 1707480346" and 6
// siblings, node 6475:6500 etc, the Applications screen's "Request" tab) -
// a square-ish 88px rounded-corner business logo, "{business} invited you to join
// a Campaign" + a relative timestamp, and an Accept/Decline pill-button
// pair. New component - no existing card in this app pairs an avatar with
// two trailing action buttons (ConversationCard's trailing slot is a
// time/unread-count stack, not buttons), so this isn't a variant of an
// existing card. Uses the app's own confirmed `shadows.sm` token
// (theme/shadows.ts) for its card shadow rather than a new bespoke value,
// since Figma provided no exact shadow spec here (get_design_context was
// unavailable for this screen - see docs/screen/apply-campaign/
// campaign-list.md "Scope notes"). Accept/Decline colors use the near-black
// `Gray 900`/`Gray 50` pair pulled directly from Figma's own variable
// definitions for this frame.
function CampaignRequestCard({
  avatar,
  businessName,
  message,
  time,
  onAccept,
  onDecline,
  disabled = false,
  style,
  testID,
}: CampaignRequestCardProps) {
  const { colors, palette } = useTheme();

  return (
    <View
      style={[styles.root, getShadowStyle('sm'), { backgroundColor: colors.card }, style]}
      testID={testID}>
      <FallbackImage source={avatar} name={businessName} style={styles.avatar} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={2}>
          {message ?? `${businessName} invited you to join a Campaign`}
        </Text>
        <Text style={[styles.time, { color: palette.gray[300] }]}>{time}</Text>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Accept ${businessName}'s invitation`}
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onAccept}
            style={[
              styles.actionButton,
              { backgroundColor: palette.gray[900] },
              disabled && styles.disabled,
            ]}
            testID={testID ? `${testID}-accept` : undefined}>
            <Text style={[styles.actionLabel, { color: palette.white }]}>Accept</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Decline ${businessName}'s invitation`}
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onDecline}
            style={[
              styles.actionButton,
              { backgroundColor: palette.gray[50] },
              disabled && styles.disabled,
            ]}
            testID={testID ? `${testID}-decline` : undefined}>
            <Text style={[styles.actionLabel, { color: palette.gray[900] }]}>Decline</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default CampaignRequestCard;
