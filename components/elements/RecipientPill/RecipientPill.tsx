import { View, Text, StyleSheet, ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import { palette, radius } from '@/theme';
import Image from '../Image';

export interface RecipientPillProps {
  avatar: ImageSourcePropType;
  name: string;
  amount: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 68,
    paddingHorizontal: 14,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: palette.gray[50],
    backgroundColor: palette.white,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
  },
  name: {
    flex: 1,
    marginLeft: 11,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.48,
    color: palette.gray[900],
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.48,
    textAlign: 'right',
    color: palette.gray[900],
  },
});

// The "who got paid, how much" receipt pill on the withdraw confirmation
// screen (Figma node 6407:5819) - a fully-rounded white card holding a 48px
// avatar, the recipient's name and the amount.
function RecipientPill({ avatar, name, amount, style, testID }: RecipientPillProps) {
  return (
    <View style={[styles.root, style]} testID={testID}>
      <Image source={avatar} style={styles.avatar} contentFit="cover" />
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.amount}>{amount}</Text>
    </View>
  );
}

export default RecipientPill;
