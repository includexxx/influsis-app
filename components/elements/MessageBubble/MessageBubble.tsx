import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import { ChatMessageSender } from '@/types';

export interface MessageBubbleProps {
  sender: ChatMessageSender;
  text: string;
  time: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const styles = StyleSheet.create({
  root: {
    gap: 10,
  },
  fromMe: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    maxWidth: '70%',
  },
  fromThem: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
    maxWidth: '92%',
  },
  bubble: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    opacity: 0.9,
  },
  // Figma squares off the corner nearest the sender, so the bubble points
  // back at whoever sent it.
  bubbleFromMe: {
    borderBottomLeftRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  bubbleFromThem: {
    borderBottomRightRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  text: {
    fontSize: 14,
    lineHeight: 21,
  },
  time: {
    fontSize: 12,
    lineHeight: 18,
  },
});

// A single chat bubble (Figma "Courier Messages" / "My Messages", nodes
// 6279:8226 / 6279:8234) - received messages are left-aligned gray bubbles
// with gray text, sent messages are right-aligned brand-pink bubbles with
// white text, each paired with a timestamp below on the same side. Used by
// ChatDetails for every message in a conversation's transcript
// (data/messages.ts).
//
// Figma pins each bubble to a fixed width (365 received / 278 sent) around
// its one example string; these are `maxWidth` percentages of the same
// proportion instead, so real messages of any length wrap correctly rather
// than being clipped or leaving a half-empty bubble.
function MessageBubble({ sender, text, time, style, testID }: MessageBubbleProps) {
  const { palette } = useTheme();
  const fromMe = sender === 'me';

  return (
    <View style={[styles.root, fromMe ? styles.fromMe : styles.fromThem, style]} testID={testID}>
      <View
        style={[
          styles.bubble,
          fromMe ? styles.bubbleFromMe : styles.bubbleFromThem,
          { backgroundColor: fromMe ? palette.primary[400] : palette.gray[25] },
        ]}>
        <Text style={[styles.text, { color: fromMe ? palette.white : palette.gray[300] }]}>
          {text}
        </Text>
      </View>
      <Text style={[styles.time, { color: palette.gray[300] }]}>{time}</Text>
    </View>
  );
}

export default MessageBubble;
