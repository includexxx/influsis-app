import { useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks';
import { layoutStyle, messagesStyle } from '@/styles';
import ScreenHeader from '@/components/elements/ScreenHeader';
import SearchBar from '@/components/elements/SearchBar';
import ConversationCard from '@/components/elements/ConversationCard';
import EmptyState from '@/components/elements/EmptyState';
import MessageIllustration from '@/components/elements/MessageIllustration';
import { conversations } from '@/data/messages';

// The Messages tab (Figma "Message", nodes 6279:8097 (populated) and
// 6366:6416 (empty)) - a searchable list of conversation threads, each
// tapping through to its chat detail screen at /chat/[id]. Populated
// from data/messages.ts mock content - no backend exists yet
// (docs/PRD.md §2.2/§4.1) - see docs/screen/message/README.md.
//
// Figma draws the two states as separate frames sharing one header and
// search bar; here they're one screen whose list area swaps to EmptyState
// when the query matches nothing, the same shape scenes/main/Search.tsx
// already uses.
export default function Message() {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');

  const filteredConversations = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter(
      conversation =>
        conversation.name.toLowerCase().includes(term) ||
        conversation.lastMessage.toLowerCase().includes(term),
    );
  }, [query]);

  return (
    <SafeAreaView style={[layoutStyle.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={layoutStyle.screen}
        contentContainerStyle={layoutStyle.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <ScreenHeader
          title="Messages"
          onBack={() => router.back()}
          style={messagesStyle.headerGap}
        />

        <SearchBar
          variant="rounded"
          value={query}
          onChangeText={setQuery}
          placeholder="Search your message..."
          style={messagesStyle.searchBarGap}
          testID="message-search"
        />

        {filteredConversations.length > 0 ? (
          <View style={messagesStyle.listGap}>
            {filteredConversations.map(conversation => (
              <ConversationCard
                key={conversation.id}
                {...conversation}
                onPress={() => router.push(`/chat/${conversation.id}`)}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            style={messagesStyle.emptyState}
            illustration={<MessageIllustration />}
            title="No Message Found"
            description="When we add collections. They'll be appear here"
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
