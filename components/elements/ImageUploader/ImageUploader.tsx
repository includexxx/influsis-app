import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/hooks';
import Image from '../Image';

const uploadCloudIcon = require('@/assets/images/create-gig/upload-cloud.png');
const successCheckIcon = require('@/assets/images/create-gig/upload-success-check.png');

export interface ImageUploaderProps {
  imageUri?: string;
  onChange: (uri: string) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  empty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 49,
    alignItems: 'center',
  },
  emptyContent: {
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
  emptyTextGroup: {
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
  filled: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 12,
  },
  previewWrap: {
    width: 148,
    height: 148,
  },
  preview: {
    width: 148,
    height: 148,
    borderRadius: 8,
  },
  successBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    width: 12,
    height: 12,
  },
  changeButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.07,
  },
});

// Gig cover photo/video picker (Figma "_File upload base", node 6525:6049
// empty / 6525:6135 filled) - the empty state is a dashed pink drop-zone,
// the filled state swaps in a 148x148 preview with a green success badge
// and a "Change Image" pill, both wired to the same device image picker.
// Fills the previously-empty `components/elements/ImageUploader` stub.
function ImageUploader({ imageUri, onChange, style, testID }: ImageUploaderProps) {
  const { colors, palette } = useTheme();

  async function handlePick() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      onChange(result.assets[0].uri);
    }
  }

  if (imageUri) {
    return (
      <View
        style={[
          styles.filled,
          { borderColor: palette.gray[50], backgroundColor: colors.card },
          style,
        ]}
        testID={testID}>
        <View style={styles.previewWrap}>
          <Image source={{ uri: imageUri }} style={styles.preview} contentFit="cover" />
          <View style={[styles.successBadge, { backgroundColor: palette.secondary[400] }]}>
            <Image source={successCheckIcon} style={styles.successIcon} contentFit="contain" />
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          style={[styles.changeButton, { backgroundColor: palette.neutralGray[50] }]}
          onPress={handlePick}>
          <Text style={[styles.changeButtonText, { color: palette.gray[500] }]}>Change Image</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      style={[styles.empty, { borderColor: palette.primary[400] }, style]}
      onPress={handlePick}
      testID={testID}>
      <View style={styles.emptyContent}>
        <View
          style={[
            styles.badge,
            { backgroundColor: palette.primary[50], borderColor: palette.gray[25] },
          ]}>
          <Image source={uploadCloudIcon} style={styles.badgeIcon} contentFit="contain" />
        </View>
        <View style={styles.emptyTextGroup}>
          <Text style={[styles.actionLabel, { color: colors.text.primary }]}>
            Tap to upload images or video
          </Text>
          <Text style={[styles.helperText, { color: palette.gray[300] }]}>
            SVG, PNG, JPG or GIF (max. 800x400px)
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default ImageUploader;
