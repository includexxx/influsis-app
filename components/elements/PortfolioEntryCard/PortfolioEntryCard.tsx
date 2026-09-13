import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import { radius, spacing } from '@/theme';
import { profileStepStyle } from '@/styles';
import { PORTFOLIO_PLATFORM_OPTIONS, PortfolioPlatform } from '@/data/portfolioPlatforms';
import { PickedImageAsset, PortfolioEntry } from '@/utils/onboardingSchemas';
import TextField from '../TextField';
import CategoryChip from '../CategoryChip';
import ImageUploader from '../ImageUploader';

export interface PortfolioEntryCardProps {
  entry: PortfolioEntry;
  index: number;
  onChangeUrl: (url: string) => void;
  onChangePlatform: (platform: PortfolioPlatform) => void;
  onChangeThumbnail: (asset?: PickedImageAsset) => void;
  onDelete: () => void;
  urlError?: string;
  duplicate?: boolean;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  warning: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});

// One portfolio entry in the onboarding Portfolio step (build-plan 20f):
// a content link, a platform tag (4 chips), and an optional manually-uploaded
// thumbnail. A malformed link surfaces `urlError`; `duplicate` shows a
// non-blocking warning. `AccordionItem` / `FileUploadItem` set the folder
// conventions this follows.
function PortfolioEntryCard({
  entry,
  index,
  onChangeUrl,
  onChangePlatform,
  onChangeThumbnail,
  onDelete,
  urlError,
  duplicate,
  testID,
}: PortfolioEntryCardProps) {
  const { colors, palette } = useTheme();
  const [isUrlFocused, setIsUrlFocused] = useState(false);

  return (
    <View
      style={[styles.root, { borderColor: palette.gray[100], backgroundColor: colors.card }]}
      testID={testID}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text.primary }]}>Sample {index + 1}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Remove sample"
          hitSlop={8}
          onPress={onDelete}
          testID={testID ? `${testID}-delete` : undefined}>
          <Feather name="trash-2" size={18} color={palette.gray[500]} />
        </Pressable>
      </View>

      <TextField
        label="Content link"
        placeholder="instagram.com/p/..."
        value={entry.url}
        onChangeText={onChangeUrl}
        onFocus={() => setIsUrlFocused(true)}
        onBlur={() => setIsUrlFocused(false)}
        error={urlError}
        inputRowStyle={
          isUrlFocused && !urlError ? { borderColor: palette.primary[400] } : undefined
        }
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        testID={testID ? `${testID}-url` : undefined}
      />
      {duplicate ? (
        <Text style={[styles.warning, { color: palette.gray[500] }]}>
          You&apos;ve already added this link
        </Text>
      ) : null}

      <View style={styles.chipRow}>
        {PORTFOLIO_PLATFORM_OPTIONS.map(option => (
          <CategoryChip
            key={option.value}
            label={option.label}
            selected={entry.platform === option.value}
            onPress={() => onChangePlatform(option.value)}
            testID={testID ? `${testID}-platform-${option.value}` : undefined}
          />
        ))}
      </View>

      <Text style={[profileStepStyle.helperText, { color: palette.gray[300] }]}>
        Thumbnail (optional)
      </Text>
      <ImageUploader
        imageUri={entry.thumbnail?.uri}
        aspect={[1, 1]}
        onChange={(_uri, asset) => onChangeThumbnail(asset)}
        testID={testID ? `${testID}-thumbnail` : undefined}
      />
    </View>
  );
}

export default PortfolioEntryCard;
