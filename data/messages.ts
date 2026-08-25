import { ChatDateGroup, Conversation } from '@/types';

// Mock content for the Messages tab (scenes/main/Message.tsx) and its chat
// detail screen (scenes/main/ChatDetails.tsx), standing in for a real
// messaging API - see docs/screen/message/README.md "Scope notes" and
// docs/PRD.md §2.2/§4.1 (no backend exists yet). Figma's "Message" list
// (node 6279:8097) shows 8 named threads, all sharing the same preview
// text/time/unread count - mirrored as-is, same as this project's other
// mock data (e.g. Gig Details' "What I will create" breakdown). Avatars
// reuse existing headshot photos already in the repo (no distinct photo
// asset exists per thread) rather than duplicating files.
const avatars = [
  require('@/assets/images/creators/sunehra-tasnim.jpg'),
  require('@/assets/images/creators/salman-muqtadir-1.jpg'),
  require('@/assets/images/creators/salman-muqtadir-2.jpg'),
  require('@/assets/images/creators/creator-4.jpg'),
  require('@/assets/images/profile/avatar.jpg'),
  require('@/assets/images/profile/reviewer-avatar.jpg'),
  require('@/assets/images/business-details/avatar.jpg'),
];

const names = [
  'Kathryn Murphy',
  'Arlene McCoy',
  'Robert Fox',
  'Wade Warren',
  'Cameron Williamson',
  'Dianne Russell',
  'Darrell Steward',
  'Guy Hawkins',
];

export const conversations: Conversation[] = names.map((name, index) => ({
  id: `conversation-${index + 1}`,
  avatar: avatars[index % avatars.length],
  name,
  lastMessage: 'Hi, nice to meet you. How can i...',
  time: '5 min ago',
  unreadCount: 2,
  online: index === 0,
}));

// Figma's chat screen (node 6279:8211) shows one example transcript for
// Kathryn Murphy under a single "Yesterday" group - mirrored identically
// for every conversation id rather than inventing distinct transcripts
// Figma doesn't specify.
const yesterdayMessages: ChatDateGroup = {
  label: 'Yesterday',
  messages: [
    {
      id: 'msg-1',
      sender: 'them',
      text: 'Hai Rizal, I’m on the way to your home, Please wait a moment. Thanks!',
      time: '4:26 Am',
    },
    {
      id: 'msg-2',
      sender: 'me',
      text: 'Thank You! I’ll be waiting for that 💪',
      time: '5:22 Am',
    },
    {
      id: 'msg-3',
      sender: 'them',
      text: 'Hai Rizal, I’m on the way to your home, Please wait a moment. Thanks!',
      time: '4:26 Am',
    },
    {
      id: 'msg-4',
      sender: 'me',
      text: 'Thank You! I’ll be waiting for that. You can join with us.',
      time: '5:22 Am',
    },
    {
      id: 'msg-5',
      sender: 'them',
      text: 'Hai Rizal, I’m on the way to your home, Please wait a moment. Thanks!',
      time: '4:26 Am',
    },
    {
      id: 'msg-6',
      sender: 'me',
      text: 'Thank You! I’ll be waiting for that. You can join with us.',
      time: '5:22 Am',
    },
    {
      id: 'msg-7',
      sender: 'them',
      text: 'Hai Rizal, I’m on the way to your home, Please wait a moment. Thanks!',
      time: '4:26 Am',
    },
  ],
};

export const conversationMessages: Record<string, ChatDateGroup[]> = Object.fromEntries(
  conversations.map(conversation => [conversation.id, [yesterdayMessages]]),
);
