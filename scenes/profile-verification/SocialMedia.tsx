import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, buttonStyle as sharedButton, profileStepStyle } from '@/styles';
import { useProfileVerificationSlice } from '@/slices';
import Button from '@/components/elements/Button';
import ProfileStepHeader from '@/components/elements/ProfileStepHeader';
import SelectableListItem from '@/components/elements/SelectableListItem';

const TOTAL_STEPS = 5;

const SOCIAL_OPTIONS = [
  { id: 'facebook', label: 'Facebook', icon: require('@/assets/images/icons/facebook.png') },
  { id: 'instagram', label: 'Instagram', icon: require('@/assets/images/icons/instagram.png') },
  {
    id: 'tiktok',
    label: 'Tiktok',
    icon: require('@/assets/images/profile-verification/social-tiktok.png'),
  },
  {
    id: 'youtube',
    label: 'Youtube',
    icon: require('@/assets/images/profile-verification/social-youtube.png'),
  },
  {
    id: 'likee',
    label: 'Likee',
    icon: require('@/assets/images/profile-verification/social-likee.png'),
  },
];

export default function SocialMedia() {
  const { colors } = useTheme();
  const { socialPlatforms, toggleSocialPlatform, dispatch } = useProfileVerificationSlice();

  function handleNext() {
    router.push('/profile-verification/languages');
  }

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ProfileStepHeader
          step={3}
          totalSteps={TOTAL_STEPS}
          title="Connect your social media"
          description="Brands seek creators within age ranges for campaign"
          style={profileStepStyle.header}
        />
        <View style={profileStepStyle.optionList}>
          {SOCIAL_OPTIONS.map(option => (
            <SelectableListItem
              key={option.id}
              icon={option.icon}
              label={option.label}
              selected={socialPlatforms.includes(option.id)}
              onPress={() => dispatch(toggleSocialPlatform(option.id))}
              testID={`social-${option.id}`}
            />
          ))}
        </View>
      </ScrollView>
      <View style={layoutStyle.scrollContent}>
        <Button
          title="Next"
          titleStyle={sharedButton.primaryTitle}
          style={sharedButton.primary}
          onPress={handleNext}
          disabled={socialPlatforms.length === 0}
        />
      </View>
    </SafeAreaView>
  );
}
