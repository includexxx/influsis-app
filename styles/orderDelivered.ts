import { Platform, StyleSheet } from 'react-native';
import { palette } from '@/theme';

// Shared fragments for the Order Delivered scene
// (scenes/main/OrderDelivered.tsx, Figma "Balance", node 6574:6294) - the
// confirmation state shown after submitting the Order Deliver screen's
// "Delivery" button.

// Same `0px 24px 17px rgba(46,118,87,0.3)` badge shadow SuccessSheet's own
// `badgeShadow` uses - this screen reuses that component's exact badge
// size/color/icon, just laid out as a static centered page instead of a
// bottom sheet (see OrderDelivered.tsx's own header comment for why).
const badgeShadow =
  Platform.OS === 'web'
    ? { boxShadow: '0px 24px 17px rgba(46, 118, 87, 0.3)' }
    : {
        shadowColor: '#2E7657',
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.3,
        shadowRadius: 17,
        elevation: 10,
      };

export const orderDeliveredStyle = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  badge: {
    width: 91,
    height: 91,
    borderRadius: 999,
    backgroundColor: '#01B851',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    ...badgeShadow,
  },
  icon: {
    width: 51,
    height: 51,
  },
  title: {
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1D1D1D',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 12,
    color: palette.gray[300],
  },
  button: {
    marginTop: 32,
    width: '100%',
  },
});
