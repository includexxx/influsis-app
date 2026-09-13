import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, cardStyle as sharedCard, textStyle as sharedText } from '@/styles';
import { authClient, SocialProvider } from '@/services/betterAuthClient';
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
  socialError: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: -4,
  },
});

export default function SignInLanding() {
  const { colors, palette } = useTheme();
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);

  function continueWithEmail() {
    router.push('/auth/sign-in');
  }

  // Instagram has no backend OAuth support (the backend's better-auth
  // instance only configures google/facebook - see
  // backend/docs/auth-better-auth.md) - it routes through the email
  // sign-in form as a stub so the flow stays fully clickable end to end.
  function continueWithInstagram() {
    router.push('/auth/sign-in');
  }

  // Google/Facebook (build-plan 23b): real redirect-based OAuth via the
  // backend's better-auth mount. authClient.signIn.social() opens the
  // provider's consent screen and redirects back into the app via the
  // `influsis://` scheme; providers/SocialAuthBridge.tsx picks up the
  // resulting session and hands it off to the existing auth engine.
  async function continueWithProvider(provider: SocialProvider) {
    setSocialError(null);
    setLoadingProvider(provider);
    try {
      const { error } = await authClient.signIn.social({ provider });
      if (error) {
        setSocialError(error.message ?? 'Could not start sign-in. Please try again.');
      }
    } catch {
      setSocialError('Could not start sign-in. Please try again.');
    } finally {
      setLoadingProvider(null);
    }
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
          <Link href="/home" style={{ color: palette.primary[400] }}>
            Skip to Home
          </Link>
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
            onPress={continueWithInstagram}
          />
          <SocialAuthButton
            label={loadingProvider === 'facebook' ? 'Connecting...' : 'Continue with Facebook'}
            icon={facebookIcon}
            disabled={loadingProvider !== null}
            onPress={() => continueWithProvider('facebook')}
          />
          <SocialAuthButton
            label={loadingProvider === 'google' ? 'Connecting...' : 'Continue with Google'}
            icon={googleIcon}
            disabled={loadingProvider !== null}
            onPress={() => continueWithProvider('google')}
          />
        </View>
        {socialError ? (
          <Text style={[styles.socialError, { color: colors.error }]}>{socialError}</Text>
        ) : null}

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
