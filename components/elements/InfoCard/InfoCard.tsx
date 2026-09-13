import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';

export interface InfoCardProps {
  title: string;
  description?: string;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 4,
  },
  title: {
    fontSize: 16,
    lineHeight: 27,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
  },
});

// Tinted title + description card (Figma "Rectangle 28" and siblings, node
// 6401:5746 - the Gig Details screen's "What I will create" breakdown).
// `backgroundColor` defaults to Figma's confirmed `palette.primary[50]`
// pink but is overridable, generic enough for any future "info tile" this
// project doesn't have a design for yet. `description` is optional for the
// Create Gig preview step (`scenes/main/CreateGigPreview.tsx`), whose
// "What's Included" features are single-line only - unlike the Gig Details
// screen's services, which always have both.
function InfoCard({ title, description, backgroundColor, style, testID }: InfoCardProps) {
  const { colors, palette } = useTheme();

  return (
    <View
      style={[styles.root, { backgroundColor: backgroundColor ?? palette.primary[50] }, style]}
      testID={testID}>
      <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: palette.gray[400] }]}>{description}</Text>
      ) : null}
    </View>
  );
}

export default InfoCard;
