import { useMemo, useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, chatStyle } from '@/styles';
import ChatHeader from '@/components/elements/ChatHeader';
import DateDivider from '@/components/elements/DateDivider';
import MessageBubble from '@/components/elements/MessageBubble';
import MessageInputBar from '@/components/elements/MessageInputBar';
import { conversations, conversationMessages } from '@/data/messages';
import { ChatDateGroup } from '@/types';

// The chat detail screen (Figma "Message", node 6279:8211), pushed from any
// ConversationCard tap on the Messages tab (scenes/main/Message.tsx).
// Registered as a dynamic route in the app/(details)/ route group
// (app/(details)/chat/[id].tsx), the same "no tab bar" reasoning as every
// other screen in that group - Figma shows this screen with a composer
// where the tab bar would be. Routed under /chat/ rather than /message/ so
// it can't collide with the /message tab route itself, following the same
// distinct-segment naming every other detail route uses (/business/[id] beside
// /businesses, /campaign/[id] beside /campaigns). Looks the tapped thread up by
// id in data/messages.ts - see docs/screen/message/README.md.
export default function ChatDetails() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversation = conversations.find(item => item.id === id);

  // Messages the user sends this session. There's no messaging API to post
  // to (docs/PRD.md §2.2/§4.1), so a sent message is appended locally and
  // lives only as long as the screen does - enough for the composer to
  // behave, without pretending it was delivered anywhere.
  const [sentMessages, setSentMessages] = useState<ChatDateGroup['messages']>([]);
  const [draft, setDraft] = useState('');

  const groups = useMemo(() => {
    const base = (id && conversationMessages[id]) || [];
    if (!sentMessages.length) return base;
    // New messages join the most recent date group.
    return base.map((group, index) =>
      index === base.length - 1
        ? { ...group, messages: [...group.messages, ...sentMessages] }
        : group,
    );
  }, [id, sentMessages]);

  if (!conversation) {
    return <Redirect href="/message" />;
  }

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    setSentMessages(previous => [
      ...previous,
      {
        id: `sent-${previous.length + 1}`,
        sender: 'me',
        text,
        time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      },
    ]);
    setDraft('');
  };

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={layoutStyle.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ChatHeader
          avatar={conversation.avatar}
          name={conversation.name}
          online={conversation.online}
          onBack={() => router.back()}
          style={[chatStyle.header, { borderBottomColor: colors.divider }]}
        />

        <ScrollView
          style={chatStyle.transcript}
          contentContainerStyle={chatStyle.transcriptContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {groups.map(group => (
            <View key={group.label}>
              <DateDivider label={group.label} style={chatStyle.dateDividerGap} />
              <View style={chatStyle.messageGap}>
                {group.messages.map(message => (
                  <MessageBubble key={message.id} {...message} />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>

        <MessageInputBar value={draft} onChangeText={setDraft} onSend={handleSend} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
