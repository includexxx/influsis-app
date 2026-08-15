import { View, TextInput, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import Image from '../Image';

const paperclipIcon = require('@/assets/images/messages/paperclip.png');
const happyEmojiIcon = require('@/assets/images/messages/happy-emoji.png');
const sendIcon = require('@/assets/images/messages/send.png');

export interface MessageInputBarProps {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    height: 42,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  glyph: {
    width: 22,
    height: 22,
  },
  input: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  sendButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    width: 28,
    height: 28,
  },
});

// Bottom composer bar on the chat detail screen (Figma "Message Box", node
// 6279:8254) - a rounded text field carrying the attachment and emoji
// glyphs, plus a standalone send button, above a full-bleed top divider.
// Every glyph is the icon Figma exports for this node, rasterized to PNG by
// scripts/rasterize-messages-assets.py (expo-image does not render SVG),
// the same pipeline the Search screen's megaphone already uses.
function MessageInputBar({
  value,
  onChangeText,
  onSend,
  placeholder = 'Type your message',
  style,
  testID,
}: MessageInputBarProps) {
  const { colors, palette } = useTheme();

  return (
    <View
      style={[styles.root, { backgroundColor: colors.card, borderTopColor: colors.divider }, style]}
      testID={testID}>
      <View style={[styles.field, { backgroundColor: palette.gray[25] }]}>
        <Image source={paperclipIcon} style={styles.glyph} contentFit="contain" />
        <TextInput
          style={[styles.input, { color: colors.text.primary }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.gray[300]}
          onSubmitEditing={onSend}
          returnKeyType="send"
        />
        <Image source={happyEmojiIcon} style={styles.glyph} contentFit="contain" />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Send message"
        hitSlop={8}
        style={styles.sendButton}
        onPress={onSend}>
        <Image source={sendIcon} style={styles.sendIcon} contentFit="contain" />
      </Pressable>
    </View>
  );
}

export default MessageInputBar;
