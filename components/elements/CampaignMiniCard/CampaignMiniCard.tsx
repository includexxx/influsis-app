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
import Image from '../Image';

export interface CampaignMiniCardProps {
  image: ImageSourcePropType;
  startedLabel: string;
  title: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    width: 127,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  image: {
    width: 127,
    height: 70,
  },
  content: {
    paddingHorizontal: 6,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 6,
  },
  started: {
    fontSize: 12,
    lineHeight: 15,
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});

// Compact campaign card for the Home screen's "Popular Campaigns" row
// (Figma node 6121:6551) - a smaller, detail-free sibling of CampaignCard.
function CampaignMiniCard({
  image,
  startedLabel,
  title,
  onPress,
  style,
  testID,
}: CampaignMiniCardProps) {
  const { colors, palette } = useTheme();

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      testID={testID}
      style={[styles.root, style]}>
      <Image source={image} style={styles.image} contentFit="cover" />
      <View style={styles.content}>
        <Text style={[styles.started, { color: palette.primary[400] }]}>{startedLabel}</Text>
        <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={2}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

export default CampaignMiniCard;
