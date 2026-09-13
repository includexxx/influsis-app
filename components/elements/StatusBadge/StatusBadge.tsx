import { View, Text, Platform, StyleSheet, StyleProp, ViewStyle } from 'react-native';

export interface StatusBadgeProps {
  label: string;
  color?: string;
  textColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// Figma's subtle `4px 4px 8px rgba(17,24,39,0.04)` badge shadow, platform-
// branched the same way NotificationCard's `cardShadow` is.
const badgeShadow =
  Platform.OS === 'web'
    ? { boxShadow: '4px 4px 8px rgba(17, 24, 39, 0.04)' }
    : {
        shadowColor: '#111827',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
      };

const styles = StyleSheet.create({
  root: {
    height: 24,
    borderRadius: 19,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    lineHeight: 20,
    letterSpacing: 0.5,
    fontWeight: '500',
  },
});

// Small colored status pill (Figma "Item", node 6138:5549's "Ongoing" badge
// on the Search screen's result cards) - `color` defaults to Figma's
// confirmed green (`#B2FFD2`, the same tone CampaignCard's gender tag pills
// use) but is overridable for other statuses this project hasn't designed
// yet (e.g. an Order screen's "Completed"/"Cancelled"). `textColor` was
// added for the Create Gig preview's "Pending" badge (Figma node 6549:5987,
// `#F79009` text on `#FEF0C7`), which - unlike every prior status this
// component rendered - doesn't use the default near-black label color.
function StatusBadge({
  label,
  color = '#B2FFD2',
  textColor = '#030304',
  style,
  testID,
}: StatusBadgeProps) {
  return (
    <View style={[styles.root, badgeShadow, { backgroundColor: color }, style]} testID={testID}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
}

export default StatusBadge;
