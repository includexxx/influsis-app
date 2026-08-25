import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, buttonStyle as sharedButton } from '@/styles';
import Button from '@/components/elements/Button';
import Image from '@/components/elements/Image';

const confettiImage = require('@/assets/images/profile-verification/completion-confetti.png');
const successCheckIcon = require('@/assets/images/icons/success-check.png');

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 25,
  },
  confetti: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  badge: {
    width: 91,
    height: 91,
    borderRadius: 999,
    backgroundColor: '#01B851',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  badgeIcon: {
    width: 51,
    height: 51,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 30,
    letterSpacing: -0.37,
    marginBottom: 12,
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 29,
  },
});

// Final screen of the profile-verification wizard (Figma "Profile_5" /
// "Cardyy Elearning Cards 13", node 6001:38922) - reuses the same green
// tick-square badge as SuccessSheet, but rendered inline on its own screen
// rather than as a popup, since there's no prior screen to sit on top of.
export default function Completed() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <View style={styles.center}>
        <View style={styles.card}>
          <Image source={confettiImage} style={styles.confetti} contentFit="cover" />
          <View style={styles.badge}>
            <Image source={successCheckIcon} style={styles.badgeIcon} contentFit="contain" />
          </View>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Congratulation!{'\n'}You have completed profile
          </Text>
          <Text style={[styles.description, { color: colors.text.secondary }]}>
            Your profile is ready - businesses can now discover you for campaigns that fit your niche.
          </Text>
        </View>
      </View>
      <View style={layoutStyle.scrollContent}>
        <Button
          title="Explore"
          titleStyle={sharedButton.primaryTitle}
          style={sharedButton.primary}
          onPress={() => router.replace('/home')}
          testID="profile-verification-explore"
        />
      </View>
    </SafeAreaView>
  );
}
