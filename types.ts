export interface Attachment {
  name: string;
  type: string;
  data: string; // Base64
}

export interface Suggestion {
  id: string;
  originalText?: string;
  suggestedText?: string;
  reason: string;
  type: 'improvement' | 'grammar' | 'idea';
}

export enum EditorMode {
  WRITING = 'WRITING',
  WAITING = 'WAITING',
}

export interface SelectionRange {
  start: number;
  end: number;
  text: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}