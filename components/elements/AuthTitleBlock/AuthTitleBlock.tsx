import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import { textStyle as sharedText } from '@/styles';

export interface AuthTitleBlockProps {
  title: string;
  description: string;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    alignSelf: 'center',
    width: 274,
    marginBottom: 32,
  },
  title: {
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 12,
  },
});

// Centered "heading + description" block used at the top of the Forgot
// Password / OTP Verification / Create New Password screens (Figma nodes
// 6360:10001 / 6360:10005 / 6360:10013 - all the same layout shape, only the
// copy differs per screen). See docs/screen/auth for per-screen copy.
function AuthTitleBlock({ title, description, style }: AuthTitleBlockProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.root, style]}>
      <Text style={[sharedText.authHeading, styles.title, { color: colors.text.primary }]}>
        {title}
      </Text>
      <Text style={[styles.description, { color: colors.text.secondary }]}>{description}</Text>
    </View>
  );
}

export default AuthTitleBlock;
