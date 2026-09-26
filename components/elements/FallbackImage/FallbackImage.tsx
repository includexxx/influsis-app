import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageSourcePropType,
  StyleProp,
  ImageStyle,
  ViewStyle,
} from 'react-native';
import { ImageContentFit } from 'expo-image';
import { useTheme } from '@/hooks';
import Image from '../Image';

export interface FallbackImageProps {
  source: ImageSourcePropType | null | undefined;
  /** The name whose first letter is shown when there's no usable image. */
  name: string;
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
  testID?: string;
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initial: {
    fontWeight: '600',
  },
});

export function getNameInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
}

function sourceKey(source: FallbackImageProps['source']): unknown {
  return source && typeof source === 'object' && 'uri' in source ? source.uri : source;
}

// A creator's or business's uploaded photo (avatar or cover), falling back to
// a gray block with the name's first letter both when there's no URL at all
// and when the URL fails to load (deleted upload, expired link, 404) - a
// broken remote image would otherwise render as an empty box. The initial
// scales with the box height so the same component serves 40px avatars and
// full-width banners.
function FallbackImage({ source, name, style, contentFit = 'cover', testID }: FallbackImageProps) {
  const { palette } = useTheme();
  const [failed, setFailed] = useState(false);
  const key = sourceKey(source);

  useEffect(() => {
    setFailed(false);
  }, [key]);

  if (source && !failed) {
    return (
      <Image
        source={source}
        style={style}
        contentFit={contentFit}
        onError={() => setFailed(true)}
        testID={testID}
      />
    );
  }

  const height = StyleSheet.flatten(style)?.height;
  const fontSize = typeof height === 'number' ? Math.min(height * 0.4, 48) : 48;

  return (
    <View
      style={[
        styles.fallback,
        style as StyleProp<ViewStyle>,
        { backgroundColor: palette.gray[50] },
      ]}
      testID={testID}>
      <Text style={[styles.initial, { fontSize, color: palette.gray[400] }]}>
        {getNameInitial(name)}
      </Text>
    </View>
  );
}

export default FallbackImage;
