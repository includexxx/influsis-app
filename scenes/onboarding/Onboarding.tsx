import { useRef, useState } from 'react';
import {
  View,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { windowWidth } from '@/utils/deviceInfo';
import { layoutStyle, buttonStyle, cardStyle } from '@/styles';
import Button from '@/components/elements/Button';
import Image from '@/components/elements/Image';
import OnboardingSlide from '@/components/elements/OnboardingSlide';
import PaginationDots from '@/components/elements/PaginationDots';

const slide1Hero = require('@/assets/images/onboarding/slide1-hero.jpg');
const slide2Photo1 = require('@/assets/images/onboarding/slide2-photo1.jpg');
const slide2Photo2 = require('@/assets/images/onboarding/slide2-photo2.jpg');
const slide2Photo3 = require('@/assets/images/onboarding/slide2-photo3.jpg');
const slide3Card1 = require('@/assets/images/onboarding/slide3-card1.jpg');
const slide3Card2 = require('@/assets/images/onboarding/slide3-card2.jpg');
const slide3Card3 = require('@/assets/images/onboarding/slide3-card3.jpg');
const slide3Card4 = require('@/assets/images/onboarding/slide3-card4.jpg');
const slide3Hero = require('@/assets/images/onboarding/slide3-hero.jpg');

// Button labels are literal per-slide from Figma (slide 1 = "Get Started",
// slides 2-3 = "Next") - see docs/screen/onboarding-carousel.md.
const SLIDES = [
  {
    title: 'Discover and Collaborate with Businesses',
    description:
      'Working with Salman Muktadir was an absolute pleasure! They brilliantly promoted our.',
    buttonLabel: 'Get Started',
  },
  {
    title: 'Monetize Your Journey as a Content Creator',
    description:
      'Working with Salman Muktadir was an absolute pleasure! They brilliantly promoted our.',
    buttonLabel: 'Next',
  },
  {
    title: 'Manage Business Collaboration',
    description:
      'Working with Salman Muktadir was an absolute pleasure! They brilliantly promoted our.',
    buttonLabel: 'Next',
  },
];

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  fullVisual: {
    width: '100%',
    height: '100%',
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 140,
  },
  circleVisual: {
    width: '100%',
    height: '100%',
  },
  circle1: {
    position: 'absolute',
    top: 0,
    right: 16,
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  circle2: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  circle3: {
    position: 'absolute',
    top: 110,
    left: 0,
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  cardVisual: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fanCard: {
    position: 'absolute',
    width: 130,
    height: 250,
    borderRadius: 20,
  },
  heroCard: {
    width: 210,
    height: 285,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
    gap: 16,
  },
  button: {
    width: '100%',
  },
});

export default function Onboarding() {
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  function goToSlide(next: number) {
    scrollRef.current?.scrollTo({ x: next * windowWidth, animated: true });
    setIndex(next);
  }

  function handleMomentumScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / windowWidth));
  }

  function handlePrimaryPress() {
    if (index < SLIDES.length - 1) {
      goToSlide(index + 1);
    } else {
      router.replace('/auth');
    }
  }

  return (
    <SafeAreaView
      style={[layoutStyle.screen, { backgroundColor: colors.background }]}
      edges={['bottom']}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={styles.scroll}>
        <OnboardingSlide
          width={windowWidth}
          title={SLIDES[0].title}
          description={SLIDES[0].description}
          visual={
            <View style={styles.fullVisual}>
              <Image source={slide1Hero} style={styles.fullVisual} contentFit="cover" />
              <LinearGradient colors={['transparent', colors.background]} style={styles.fade} />
            </View>
          }
        />
        <OnboardingSlide
          width={windowWidth}
          title={SLIDES[1].title}
          description={SLIDES[1].description}
          visual={
            <View style={styles.circleVisual}>
              <Image source={slide2Photo1} style={styles.circle1} contentFit="cover" />
              <Image source={slide2Photo2} style={styles.circle2} contentFit="cover" />
              <Image source={slide2Photo3} style={styles.circle3} contentFit="cover" />
            </View>
          }
        />
        <OnboardingSlide
          width={windowWidth}
          title={SLIDES[2].title}
          description={SLIDES[2].description}
          visual={
            <View style={styles.cardVisual}>
              <Image
                source={slide3Card1}
                style={[styles.fanCard, { left: 8, top: 12, transform: [{ rotate: '-8deg' }] }]}
                contentFit="cover"
              />
              <Image
                source={slide3Card2}
                style={[styles.fanCard, { left: 40, top: 0, transform: [{ rotate: '-4deg' }] }]}
                contentFit="cover"
              />
              <Image
                source={slide3Card3}
                style={[styles.fanCard, { right: 40, top: 0, transform: [{ rotate: '4deg' }] }]}
                contentFit="cover"
              />
              <Image
                source={slide3Card4}
                style={[styles.fanCard, { right: 8, top: 12, transform: [{ rotate: '8deg' }] }]}
                contentFit="cover"
              />
              <Image
                source={slide3Hero}
                style={[cardStyle.heroFrame, styles.heroCard]}
                contentFit="cover"
              />
            </View>
          }
        />
      </ScrollView>
      <View style={styles.footer}>
        <PaginationDots count={SLIDES.length} activeIndex={index} />
        <Button
          title={SLIDES[index].buttonLabel}
          titleStyle={buttonStyle.primaryTitle}
          style={[buttonStyle.primary, styles.button]}
          onPress={handlePrimaryPress}
        />
      </View>
    </SafeAreaView>
  );
}
