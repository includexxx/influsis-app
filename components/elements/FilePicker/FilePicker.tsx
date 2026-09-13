import {
  View,
  Text,
  Pressable,
  PressableProps,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/hooks';
import Image from '../Image';

const uploadCloudIcon = require('@/assets/images/create-gig/upload-cloud.png');

export interface FilePickerProps extends Omit<PressableProps, 'style'> {
  label?: string;
  helperText?: string;
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  root: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 49,
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 28,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIcon: {
    width: 20,
    height: 20,
  },
  textGroup: {
    alignItems: 'center',
    gap: 4,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});

// Dashed drop-zone trigger (Figma "_File upload base" empty state, e.g.
// node 6393:7436) - a tap-to-add-a-file affordance generic enough for a
// list of multiple files, unlike `ImageUploader` (which replaces a single
// cover image in place, Create Gig's own file-upload need). Used by the
// Apply Campaign screen's "Showcase your top work" section, where each pick
// appends a `FileUploadItem` row below rather than swapping this trigger
// out for a preview.
function FilePicker({
  label = 'Tap to upload images or video',
  helperText = 'SVG, PNG, JPG or GIF (max. 800x400px)',
  style,
  ...others
}: FilePickerProps) {
  const { colors, palette } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      style={[styles.root, { borderColor: palette.primary[400] }, style]}
      {...others}>
      <View style={styles.content}>
        <View
          style={[
            styles.badge,
            { backgroundColor: palette.primary[50], borderColor: palette.gray[25] },
          ]}>
          <Image source={uploadCloudIcon} style={styles.badgeIcon} contentFit="contain" />
        </View>
        <View style={styles.textGroup}>
          <Text style={[styles.actionLabel, { color: colors.text.primary }]}>{label}</Text>
          <Text style={[styles.helperText, { color: palette.gray[300] }]}>{helperText}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default FilePicker;
