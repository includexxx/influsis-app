import {
  View,
  Text,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/hooks';
import { fonts } from '@/theme';
import Image from '../Image';
import { router } from 'expo-router';

const notificationBellIcon = require('@/assets/images/home/notification-bell.png');

export interface AppHeaderProps {
  onNotificationPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: {
    fontFamily: fonts.clashDisplay.bold,
    fontSize: 28,
  },
  bellButton: {
    width: 40,
    height: 40,
  },
});

// Wordmark + notification bell row shown at the top of every main app tab
// screen (Figma "Home", node 6121:6522) - reused wherever this shape repeats.
function AppHeader({ onNotificationPress, style }: AppHeaderProps) {
  const { palette } = useTheme();

  return (
    <View style={[styles.root, style]}>
      <Pressable onPress={() => router.push('/home')}>
        <Text style={[styles.wordmark, { color: palette.primary[400] }]}>Influsis.</Text>
      </Pressable>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Notifications"
        style={styles.bellButton}
        onPress={onNotificationPress}>
        <Image source={notificationBellIcon} style={styles.bellButton} contentFit="contain" />
      </TouchableOpacity>
    </View>
  );
}

export default AppHeader;
