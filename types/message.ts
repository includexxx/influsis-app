import { ImageSourcePropType } from 'react-native';

export interface Conversation {
  id: string;
  avatar: ImageSourcePropType;
  name: string;
  lastMessage: string;
  time: string;
  unreadCount?: number;
  online?: boolean;
}

export type ChatMessageSender = 'me' | 'them';

export interface ChatMessage {
  id: string;
  sender: ChatMessageSender;
  text: string;
  time: string;
}

export interface ChatDateGroup {
  label: string;
  messages: ChatMessage[];
}
