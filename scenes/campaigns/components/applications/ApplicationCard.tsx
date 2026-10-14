import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { getShadowStyle } from '@/theme';
import FallbackImage from '@/components/elements/FallbackImage';
import { EngagementStatus } from '../../types/myEngagement';
import { ApplicationCardModel } from '../../utils/mapApplication';
import { APPLICATION_STATUS, statusToneColors } from './applicationStatus';
import StatusPill from './StatusPill';

// Shown when a campaign has no cover photo, or its URL fails to load.
const defaultCover = require('@/assets/images/home/hero-campaign.jpg');

export interface ApplicationCardProps extends ApplicationCardModel {
  status: EngagementStatus;
  onPress: () => void;
  testID?: string;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  identity: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  date: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  chevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  amountBlock: {
    flexShrink: 1,
    gap: 2,
  },
  amountLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  amount: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
});

// One engagement on the Applications screen's Applied / Completed tabs: the
// campaign cover and title with when it was sent, then the fee (labelled -
// the creator's rate, the latest offer, or the agreed fee) beside a tinted
// status pill. A status that needs the creator's answer (a counter-offer)
// adds a highlighted hint strip. The whole card opens the Offer screen.
function ApplicationCard({
  image,
  title,
  date,
  amountLabel,
  amount,
  status,
  onPress,
  testID,
}: ApplicationCardProps) {
  const { colors, palette, isDark } = useTheme();
  const meta = APPLICATION_STATUS[status] ?? APPLICATION_STATUS.pending;
  const hintTone = statusToneColors(meta.tone, isDark);
  // Closed outcomes keep the amount but drop the brand color from it.
  const isLive = meta.tone !== 'neutral' && meta.tone !== 'error';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${meta.label}, ${amountLabel} ${amount}, ${date}`}
      accessibilityHint="Opens the offer details"
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.card,
        getShadowStyle('sm'),
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && styles.pressed,
      ]}>
      <View style={styles.body}>
        <FallbackImage
          source={image}
          fallbackSource={defaultCover}
          name={title}
          style={styles.thumb}
        />
        <View style={styles.identity}>
          <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={2}>
            {title}
          </Text>
          <View style={styles.dateRow}>
            <Feather name="calendar" size={12} color={colors.text.secondary} />
            <Text style={[styles.date, { color: colors.text.secondary }]} numberOfLines={1}>
              {date}
            </Text>
          </View>
        </View>
        <View style={[styles.chevron, { backgroundColor: colors.surface }]}>
          <Feather name="chevron-right" size={18} color={colors.text.secondary} />
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: colors.divider }]}>
        <View style={styles.amountBlock}>
          <Text style={[styles.amountLabel, { color: colors.text.secondary }]}>{amountLabel}</Text>
          <Text
            style={[
              styles.amount,
              {
                color: isLive
                  ? isDark
                    ? palette.primary[300]
                    : palette.primary[500]
                  : colors.text.primary,
              },
            ]}
            numberOfLines={1}>
            {amount}
          </Text>
        </View>
        <StatusPill status={status} />
      </View>

      {meta.needsAction ? (
        <View style={[styles.hint, { backgroundColor: hintTone.background }]}>
          <Feather name="bell" size={14} color={hintTone.foreground} />
          <Text style={[styles.hintText, { color: hintTone.foreground }]} numberOfLines={1}>
            {meta.hint}
          </Text>
          <Feather name="arrow-right" size={14} color={hintTone.foreground} />
        </View>
      ) : null}
    </Pressable>
  );
}

export default memo(ApplicationCard);
