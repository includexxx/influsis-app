import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, cardStyle as sharedCard, textStyle as sharedText } from '@/styles';
import Image from '@/components/elements/Image';
import SocialAuthButton from '@/components/elements/SocialAuthButton';
import Divider from '@/components/elements/Divider';

const logomark = require('@/assets/images/icons/logomark.png');
const emailIcon = require('@/assets/images/icons/email-outline.png');
const instagramIcon = require('@/assets/images/icons/instagram.png');
const facebookIcon = require('@/assets/images/icons/facebook.png');
const googleIcon = require('@/assets/images/icons/google.png');
const collage1 = require('@/assets/images/onboarding/landing-collage1.jpg');
const collage2 = require('@/assets/images/onboarding/landing-collage2.jpg');
const collage3 = require('@/assets/images/onboarding/landing-collage3.jpg');
const collage4 = require('@/assets/images/onboarding/landing-collage4.jpg');
const landingHero = require('@/assets/images/onboarding/landing-hero.jpg');

const styles = StyleSheet.create({
  collage: {
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  collageCard: {
    position: 'absolute',
    width: 110,
    height: 165,
    borderRadius: 16,
  },
  heroCard: {
    width: 168,
    height: 220,
  },
  business: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logomark: {
    width: 64,
    height: 64,
  },
  title: {
    marginTop: 12,
  },
  buttonList: {
    gap: 16,
  },
  divider: {
    marginVertical: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
});

export default function SignInLanding() {
  const { colors, palette } = useTheme();

  function continueWithEmail() {
    router.push('/auth/sign-in');
  }

  // Instagram/Facebook/Google have no real OAuth backend yet (see PRD ->
  // Epic 2/3) - they route through the same email sign-in form as a stub
  // so the flow stays fully clickable end to end.
  function continueWithProvider() {
    router.push('/auth/sign-in');
  }

  function goToSignUp() {
    router.push('/auth/sign-up');
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.collage}>
          <Image
            source={collage1}
            style={[styles.collageCard, { left: -10, top: -20, transform: [{ rotate: '-10deg' }] }]}
            contentFit="cover"
          />
          <Image
            source={collage2}
            style={[styles.collageCard, { right: 0, top: 10, transform: [{ rotate: '17deg' }] }]}
            contentFit="cover"
          />
          <Image
            source={collage3}
            style={[
              styles.collageCard,
              { right: 20, bottom: -20, transform: [{ rotate: '-7deg' }] },
            ]}
            contentFit="cover"
          />
          <Image
            source={collage4}
            style={[
              styles.collageCard,
              { left: 10, bottom: -10, transform: [{ rotate: '18deg' }] },
            ]}
            contentFit="cover"
          />
          <Image
            source={landingHero}
            style={[sharedCard.heroFrame, styles.heroCard]}
            contentFit="cover"
          />
        </View>

        <View style={styles.business}>
          <Image source={logomark} style={styles.logomark} contentFit="contain" />
          <Text style={[sharedText.authHeading, styles.title, { color: colors.text.primary }]}>
            Welcome to Influsis
          </Text>
        </View>

        <View style={styles.buttonList}>
          <SocialAuthButton
            label="Continue with Email"
            icon={emailIcon}
            onPress={continueWithEmail}
          />
          <Divider style={styles.divider} />
          <SocialAuthButton
            label="Continue with Instagram"
            icon={instagramIcon}
            onPress={continueWithProvider}
          />
          <SocialAuthButton
            label="Continue with Facebook"
            icon={facebookIcon}
            onPress={continueWithProvider}
          />
          <SocialAuthButton
            label="Continue with Google"
            icon={googleIcon}
            onPress={continueWithProvider}
          />
        </View>

        <View style={styles.footer}>
          <Text style={[sharedText.footerText, { color: colors.text.secondary }]}>
            Don&apos;t have an account?{' '}
          </Text>
          <Text
            style={[sharedText.footerLink, { color: palette.primary[400] }]}
            onPress={goToSignUp}>
            Sign Up
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
