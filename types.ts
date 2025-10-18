
export interface Message {
  role: 'user' | 'assistant';
  text: string;
  time: string;
  imageUrl?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}
