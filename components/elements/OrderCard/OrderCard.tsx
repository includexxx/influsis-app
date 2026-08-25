import {
  Platform,
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
import StatusBadge from '../StatusBadge';

const clockIcon = require('@/assets/images/icons/clock.png');

export interface OrderCardProps {
  image: ImageSourcePropType;
  title: string;
  orderedFrom: string;
  price: string;
  status: string;
  statusColor?: string;
  statusTextColor?: string;
  // When both are set the card grows a divider + due/ordered-date footer
  // row (Figma's "Gig order"/"Completed"/"Cancelled" tab card, node
  // 6212:6186); when unset it stays the shorter "Campaign" tab card (node
  // 6212:6496).
  dueDate?: string;
  orderedDate?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// Figma's `0px 2px 15.5px rgba(0,0,0,0.1)` list-card shadow - the same
// token CampaignCard's `listShadow` uses, platform-branched for the same
// reason (raw `shadow*` style props are deprecated on React Native Web).
const cardShadow =
  Platform.OS === 'web'
    ? { boxShadow: '0px 2px 15.5px rgba(0, 0, 0, 0.1)' }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 15.5,
        elevation: 4,
      };

const styles = StyleSheet.create({
  root: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    ...cardShadow,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  imageTextRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  image: {
    width: 68,
    height: 74,
    borderRadius: 8,
  },
  textCol: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  orderedFrom: {
    fontSize: 14,
    lineHeight: 20,
  },
  price: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  divider: {
    height: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dueDateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clockIcon: {
    width: 20,
    height: 20,
  },
  footerText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

// Order list card (Figma "Order_Campaign", nodes 6212:6496 "Campaign" tab
// and 6212:6186 "Gig order"/"Completed"/"Cancelled" tabs) - distinct from
// CampaignCard (components/elements/CampaignCard) since an order needs an
// "Ordered from X" line and a due/ordered-date footer that CampaignCard's
// field set has no equivalent for, rather than campaign-detail fields like
// tags, business verification or a services description.
function OrderCard({
  image,
  title,
  orderedFrom,
  price,
  status,
  statusColor,
  statusTextColor,
  dueDate,
  orderedDate,
  onPress,
  style,
  testID,
}: OrderCardProps) {
  const { colors, palette } = useTheme();
  const hasFooter = !!dueDate && !!orderedDate;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      testID={testID}
      style={[styles.root, { backgroundColor: colors.card }, style]}>
      <View style={styles.headerRow}>
        <View style={styles.imageTextRow}>
          <Image source={image} style={styles.image} contentFit="cover" />
          <View style={styles.textCol}>
            <Text style={[styles.title, { color: palette.gray[600] }]} numberOfLines={2}>
              {title}
            </Text>
            <Text style={[styles.orderedFrom, { color: palette.gray[300] }]} numberOfLines={1}>
              {orderedFrom}
            </Text>
            <Text style={[styles.price, { color: palette.primary[400] }]}>{price}</Text>
          </View>
        </View>
        <StatusBadge label={status} color={statusColor} textColor={statusTextColor} />
      </View>

      {hasFooter && (
        <>
          <View style={[styles.divider, { backgroundColor: palette.gray[100] }]} />
          <View style={styles.footerRow}>
            <View style={styles.dueDateGroup}>
              <Image source={clockIcon} style={styles.clockIcon} contentFit="contain" />
              <Text style={[styles.footerText, { color: palette.gray[200] }]}>{dueDate}</Text>
            </View>
            <Text style={[styles.footerText, { color: palette.gray[200] }]}>{orderedDate}</Text>
          </View>
        </>
      )}
    </Pressable>
  );
}

export default OrderCard;
