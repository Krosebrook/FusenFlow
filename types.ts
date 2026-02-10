
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

export interface ExpertPrompt {
  id: string;
  name: string;
  prompt: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  lastModified: number;
  writingContext: WritingContext;
  chatHistory: ChatMessage[];
  experts: ExpertPrompt[];
}

export interface Snapshot {
  id: string;
  timestamp: number;
  content: string;
  label: string;
  trigger: 'manual' | 'auto' | 'ai-pre-flight';
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
  type: 'style' | 'grammar' | 'clarity' | 'flow' | 'idea' | 'structure' | 'argument';
}

export interface SelectionRange {
  start: number;
  end: number;
  text: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
