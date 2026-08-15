import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks';
import { useAppSlice, useProfileVerificationSlice } from '@/slices';
import { layoutStyle } from '@/styles';

const CATEGORY_LABELS: Record<string, string> = {
  education: 'Education',
  beauty: 'Beauty & Life Style',
  travel: 'Travel',
  music: 'Music',
  gym: 'Gym & Body Building',
  sports: 'Sports',
  health: 'Health',
};

const SOCIAL_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'Tiktok',
  youtube: 'Youtube',
  likee: 'Likee',
};

const LANGUAGE_LABELS: Record<string, string> = {
  english: 'English',
  spanish: 'Spanish',
  french: 'French',
  russian: 'Russian',
  hindi: 'Hindi',
};

function formatList(ids: string[], labels: Record<string, string>): string {
  return ids.length ? ids.map(id => labels[id] ?? id).join(', ') : 'Not set';
}

function formatDate(iso?: string): string {
  if (!iso) return 'Not set';
  const date = new Date(iso);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}/${date.getFullYear()}`;
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
  },
  username: {
    fontSize: 14,
    marginTop: 2,
  },
  fieldGroup: {
    gap: 20,
  },
  fieldLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 15,
    lineHeight: 21,
  },
});

interface FieldProps {
  label: string;
  value: string;
}

function Field({ label, value }: FieldProps) {
  const { palette, colors } = useTheme();
  return (
    <View>
      <Text style={[styles.fieldLabel, { color: palette.gray[300] }]}>{label}</Text>
      <Text style={[styles.fieldValue, { color: colors.text.primary }]}>{value}</Text>
    </View>
  );
}

// The one profile-verification-aware tab: displays what the wizard in
// scenes/profile-verification collected (Redux `profileVerification` slice)
// rather than a blank placeholder, since that data already exists. No real
// backend to fetch/edit a profile from yet (docs/PRD.md §2.2/§4.1) - this is
// read-only.
export default function Profile() {
  const { colors, palette } = useTheme();
  const { user } = useAppSlice();
  const { dateOfBirth, categories, socialPlatforms, languages, bio, username } =
    useProfileVerificationSlice();

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: colors.text.primary }]}>
            {user?.name ?? 'Your Profile'}
          </Text>
          <Text style={[styles.username, { color: palette.primary[400] }]}>
            Influsis.com/{username || '-'}
          </Text>
        </View>

        <View style={styles.fieldGroup}>
          <Field label="Date of birth" value={formatDate(dateOfBirth)} />
          <Field label="Content categories" value={formatList(categories, CATEGORY_LABELS)} />
          <Field label="Social media" value={formatList(socialPlatforms, SOCIAL_LABELS)} />
          <Field label="Languages" value={formatList(languages, LANGUAGE_LABELS)} />
          <Field label="Bio" value={bio || 'Not set'} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
