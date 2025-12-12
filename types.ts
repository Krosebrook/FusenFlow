export interface Attachment {
  name: string;
  type: string;
  data: string; // Base64
}

export interface WritingContext {
  audience: string;
  tone: string;
  goal: string;
}

export interface GoalSuggestion {
  text: string;
  explanation: string;
}

export interface Suggestion {
  id: string;
  originalText: string; // The exact substring to replace
  suggestedText: string; // The replacement
  reason: string;
  type: 'style' | 'grammar' | 'clarity' | 'flow' | 'idea';
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