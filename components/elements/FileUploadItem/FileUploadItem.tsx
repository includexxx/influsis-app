import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks';
import Checkbox from '../Checkbox';

export interface FileUploadItemProps {
  name: string;
  sizeLabel: string;
  progress?: number;
  included?: boolean;
  onToggleIncluded?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  sizeLabel: {
    fontSize: 12,
    lineHeight: 20,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 10,
  },
  progressLabel: {
    fontSize: 12,
    lineHeight: 20,
  },
});

// A picked portfolio file's row (Figma "_File upload item base", node
// 6393:7501) - icon badge, filename + size, a progress bar, and an
// include/exclude `Checkbox` (reused from Create Gig's "What's Included"
// rows - same pink checkmark-square asset). Sits below `FilePicker` in the
// Apply Campaign screen's "Showcase your top work" list. The file-type
// glyph uses `@expo/vector-icons`' Feather "file" icon rather than an
// extracted Figma asset - the Dev Mode MCP server's design-context tool was
// unavailable (timing out) for this node when this screen was built; see
// docs/screen/apply-campaign/README.md "Scope notes".
function FileUploadItem({
  name,
  sizeLabel,
  progress = 100,
  included,
  onToggleIncluded,
  style,
  testID,
}: FileUploadItemProps) {
  const { colors, palette } = useTheme();
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <View
      style={[
        styles.root,
        { borderColor: palette.primary[50], backgroundColor: colors.card },
        style,
      ]}
      testID={testID}>
      <View style={[styles.icon, { backgroundColor: palette.primary[50] }]}>
        <Feather name="file" size={16} color={palette.primary[400]} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.name, { color: colors.text.primary }]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[styles.sizeLabel, { color: palette.gray[300] }]}>{sizeLabel}</Text>
        <View style={styles.progressRow}>
          <View style={[styles.progressTrack, { backgroundColor: palette.gray[50] }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${clampedProgress}%`, backgroundColor: palette.primary[400] },
              ]}
            />
          </View>
          <Text style={[styles.progressLabel, { color: palette.gray[300] }]}>
            {clampedProgress}%
          </Text>
        </View>
      </View>
      <Checkbox
        checked={included}
        onPress={onToggleIncluded}
        testID={testID && `${testID}-checkbox`}
      />
    </View>
  );
}

export default FileUploadItem;
