import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import { fonts } from '@/theme';
import Image from '../Image';

const backChevronIcon = require('@/assets/images/icons/back-chevron.png');

export interface AuthHeaderProps {
  title?: string;
  onBack?: () => void;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
  backButton: {
    width: 24,
    height: 24,
    marginBottom: 26,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  title: {
    fontFamily: fonts.clashDisplay.bold,
    fontSize: 28,
    lineHeight: 34,
    textAlign: 'center',
  },
});

function AuthHeader({ title, onBack, style }: AuthHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.root, style]}>
      {onBack && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          style={styles.backButton}
          onPress={onBack}>
          <Image source={backChevronIcon} style={styles.backIcon} contentFit="contain" />
        </Pressable>
      )}
      {title ? <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text> : null}
    </View>
  );
}

export default AuthHeader;
