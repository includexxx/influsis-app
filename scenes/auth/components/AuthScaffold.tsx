import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { fonts, getShadowStyle, palette } from '@/theme';
import Image from '@/components/elements/Image';

const logomark = require('@/assets/images/icons/logomark.png');

const HERO_GRADIENT = [palette.primary[400], palette.primary[600], palette.primary[800]] as const;
// How far the form sheet rides up over the hero.
const SHEET_OVERLAP = 28;

export interface AuthScaffoldProps {
  title: string;
  subtitle: string;
  onBack?: () => void;
  children: ReactNode;
  /** Pinned under the form, e.g. the "Have an account? Sign in" switch. */
  footer?: ReactNode;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    paddingHorizontal: 24,
    paddingBottom: SHEET_OVERLAP + 32,
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -40,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  topBar: {
    height: 44,
    justifyContent: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  pressed: {
    opacity: 0.7,
  },
  logoFrame: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    marginBottom: 20,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
  title: {
    fontFamily: fonts.clashDisplay.bold,
    fontSize: 30,
    lineHeight: 36,
    color: palette.white,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.85)',
    maxWidth: 320,
  },
  sheet: {
    flexGrow: 1,
    marginTop: -SHEET_OVERLAP,
    borderTopLeftRadius: SHEET_OVERLAP,
    borderTopRightRadius: SHEET_OVERLAP,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 28,
  },
});

// Shared frame for the email sign-in / sign-up forms: a brand-gradient hero
// (glass back button, logomark, title, subtitle) under the status bar, and a
// rounded sheet that rides up over it holding the form, with an optional
// footer pinned to the bottom. Scrolls and lifts with the keyboard.
export default function AuthScaffold({
  title,
  subtitle,
  onBack,
  children,
  footer,
  testID,
}: AuthScaffoldProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]} testID={testID}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={[styles.hero, { paddingTop: insets.top + 8 }]}>
            <LinearGradient
              colors={HERO_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.glowTop} />
            <View style={styles.glowBottom} />

            <View style={styles.topBar}>
              {onBack ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                  hitSlop={8}
                  onPress={onBack}
                  style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
                  testID="auth-back">
                  <Feather name="chevron-left" size={22} color={palette.white} />
                </Pressable>
              ) : null}
            </View>

            {/* <View style={[styles.logoFrame, getShadowStyle('md')]}>
              <Image source={logomark} style={styles.logo} contentFit="cover" />
            </View> */}
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <View
            style={[
              styles.sheet,
              { backgroundColor: colors.background, paddingBottom: insets.bottom + 24 },
            ]}>
            {children}
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
