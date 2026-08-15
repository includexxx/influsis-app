import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import Image from '../Image';

const backChevronIcon = require('@/assets/images/icons/back-chevron.png');

export interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: {
    width: 24,
    height: 24,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '600',
  },
});

// In-row back button + centered page title (Figma "Notification" screen
// header, node 6346:5666) - distinct from AuthHeader, which stacks the back
// button above a left-aligned heading instead of placing both in one row.
// Reusable for any pushed screen that needs this "< Title" top bar shape.
function ScreenHeader({ title, onBack, rightElement, style }: ScreenHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.root, style]}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          style={styles.side}
          onPress={onBack}>
          <Image source={backChevronIcon} style={styles.side} contentFit="contain" />
        </Pressable>
      ) : (
        <View style={styles.side} />
      )}
      <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={1}>
        {title}
      </Text>
      {rightElement ?? <View style={styles.side} />}
    </View>
  );
}

export default ScreenHeader;
