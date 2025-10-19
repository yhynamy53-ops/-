
export interface GroundingSource {
  uri: string;
  title?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  text: string;
  time: string;
  imageUrl?: string;
  sources?: GroundingSource[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}
