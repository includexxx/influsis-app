import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks';
import { buttonStyle as sharedButton } from '@/styles';
import Button from '../Button';
import Image from '../Image';
import BottomSheet from '../BottomSheet';

const successCheckIcon = require('@/assets/images/icons/success-check.png');

export interface SuccessSheetProps {
  title: string;
  description: string;
  buttonLabel: string;
  onButtonPress: () => void;
  onClose?: () => void;
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
  },
  badge: {
    width: 91,
    height: 91,
    borderRadius: 999,
    backgroundColor: '#01B851',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -40,
    zIndex: 2,
    shadowColor: '#2E7657',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.3,
    shadowRadius: 17,
    elevation: 10,
  },
  icon: {
    width: 51,
    height: 51,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 56,
    paddingBottom: 40,
    paddingHorizontal: 25,
    zIndex: 1,
  },
  textGroup: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.72,
  },
  description: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: -0.28,
    width: 261,
  },
  button: {
    width: '100%',
    borderRadius: 8,
  },
});

// Reusable "success" bottom sheet popup: green tick-square badge overlapping
// a white rounded-top card with a title, description and single CTA button.
// Matches the "Reset Succesfully" (Figma 6010:14455) and "Account Created
// Successfully" (Figma 6495:5693) popups, which share this exact layout.
//
// The caller must only mount this when it should be visible (e.g.
// `{isSuccessOpen && <SuccessSheet ... />}`), not render it permanently with
// an `isOpen` toggle - @gorhom/bottom-sheet's keyboard listeners (needed for
// `keyboardBehavior="interactive"`) stay attached for as long as it's
// mounted, even while closed, and fight with other TextInputs on the same
// screen (e.g. the OTP boxes on verify-otp) for keyboard focus.
function SuccessSheet({
  title,
  description,
  buttonLabel,
  onButtonPress,
  onClose,
}: SuccessSheetProps) {
  const { colors } = useTheme();

  return (
    <BottomSheet
      isOpen
      initialOpen
      enablePanDownToClose
      onClose={onClose}
      handleComponent={null}
      backgroundStyle={{ backgroundColor: 'transparent' }}>
      <View style={styles.root}>
        <View style={styles.badge}>
          <Image source={successCheckIcon} style={styles.icon} contentFit="contain" />
        </View>
        <View style={[styles.content, { backgroundColor: colors.card }]}>
          <View style={styles.textGroup}>
            <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
            <Text style={[styles.description, { color: colors.text.secondary }]}>
              {description}
            </Text>
          </View>
          <Button
            title={buttonLabel}
            titleStyle={sharedButton.primaryTitle}
            style={[sharedButton.primary, styles.button]}
            onPress={onButtonPress}
          />
        </View>
      </View>
    </BottomSheet>
  );
}

export default SuccessSheet;
