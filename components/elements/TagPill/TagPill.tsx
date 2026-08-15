import { View, Text, StyleProp, ViewStyle, TextStyle } from 'react-native';

export interface TagPillProps {
  label: string;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  testID?: string;
}

// Thin "rounded pill with a centered text label" shape shared by
// CampaignCard's gender tags, InfluencerCard's category tags, and
// InfluencerProfile's category tags - each caller keeps full control of its
// own padding/radius/background/typography (all genuinely different Figma
// values, not accidental duplication) via `style`/`labelStyle`; this only
// centralizes the repeated <View><Text> JSX shape and testID wiring.
function TagPill({ label, style, labelStyle, testID }: TagPillProps) {
  return (
    <View style={style} testID={testID}>
      <Text style={labelStyle}>{label}</Text>
    </View>
  );
}

export default TagPill;
