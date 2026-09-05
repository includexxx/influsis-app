import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import Image from '../Image';

const calendarTop = require('@/assets/images/home/calendar-vector2.png');
const calendarBody = require('@/assets/images/home/calendar-vector1.png');

export interface CalendarBadgeProps {
  date: string;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    width: 16,
    height: 16,
  },
  iconTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '33%',
  },
  iconBody: {
    position: 'absolute',
    top: '42%',
    left: 0,
    right: 0,
    height: '58%',
  },
  date: {
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.06,
    fontWeight: '500',
  },
});

// Due-date badge (Figma's "fi-sr-calendar" icon + date text) reused across
// CampaignCard's price/due-date row. Composited from the icon's two Figma
// layers (ring header + body) rather than a single flattened asset.
function CalendarBadge({ date, style }: CalendarBadgeProps) {
  const { palette } = useTheme();

  return (
    <View style={[styles.root, style]}>
      <View style={styles.icon}>
        <Image source={calendarTop} style={styles.iconTop} contentFit="contain" />
        <Image source={calendarBody} style={styles.iconBody} contentFit="contain" />
      </View>
      <Text style={[styles.date, { color: palette.primary[400] }]}>{date}</Text>
    </View>
  );
}

export default CalendarBadge;
