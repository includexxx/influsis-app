import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { EngagementStatus } from '../../types/myEngagement';
import { APPLICATION_STATUS, statusToneColors } from './applicationStatus';

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 13,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});

// Tinted engagement-status pill (icon + label) for the Applications cards.
export default function StatusPill({ status }: { status: EngagementStatus }) {
  const { isDark } = useTheme();
  const meta = APPLICATION_STATUS[status] ?? APPLICATION_STATUS.pending;
  const tone = statusToneColors(meta.tone, isDark);

  return (
    <View style={[styles.pill, { backgroundColor: tone.background }]}>
      <Feather name={meta.icon} size={12} color={tone.foreground} />
      <Text style={[styles.label, { color: tone.foreground }]} numberOfLines={1}>
        {meta.label}
      </Text>
    </View>
  );
}
