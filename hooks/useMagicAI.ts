
import { useState, useEffect, useRef } from 'react';
import { Suggestion, Attachment, SelectionRange, WritingContext, GoalSuggestion, ChatMessage } from '../types';
import { generateDraft, iterateSelection, analyzeText, getGoalRefinements, sendChatMessage } from '../services/gemini';

interface UseMagicAIProps {
  content: string;
  isMagicMode: boolean;
  selection: SelectionRange | null;
  writingContext: WritingContext;
}

export const useMagicAI = ({ content, isMagicMode, selection, writingContext }: UseMagicAIProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Debounced Proactive Analysis
  useEffect(() => {
    if (!isMagicMode || content.length < 50) return;
    
    // Invalidate suggestion if original text is missing
    if (suggestion && !content.includes(suggestion.originalText)) {
      setSuggestion(null);
    }

    const timeoutId = setTimeout(async () => {
      // Only analyze if user isn't selecting or actively generating
      if (!selection && !isGenerating) {
        const result = await analyzeText(content, writingContext);
        if (result) {
          // Double check if text still exists (race condition prevention)
          if (content.includes(result.originalText)) {
            setSuggestion(result);
          }
        }
      }
    }, 4000); 

    return () => clearTimeout(timeoutId);
  }, [content, isMagicMode, selection, isGenerating, writingContext]);

  const draftContent = async (prompt: string, attachments: Attachment[]) => {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateDraft(prompt, attachments);
      return result;
    } catch (e) {
      setError("Failed to draft content.");
      throw e;
    } finally {
      setIsGenerating(false);
    }
  };

  const refineSelection = async (sel: SelectionRange, instruction: string) => {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await iterateSelection(sel.text, instruction, content);
      return result;
    } catch (e) {
      setError("Failed to refine selection.");
      throw e;
    } finally {
      setIsGenerating(false);
    }
  };

  const refineGoal = async (currentGoal: string): Promise<GoalSuggestion[]> => {
    setIsGenerating(true);
    setError(null);
    try {
      return await getGoalRefinements(currentGoal);
    } catch (e) {
      setError("Failed to refine goal.");
      return [];
    } finally {
      setIsGenerating(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: Date.now()
    };
    
    setChatHistory(prev => [...prev, userMsg]);
    setIsGenerating(true);
    
    try {
      const responseText = await sendChatMessage(chatHistory, text, content);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      setChatHistory(prev => [...prev, botMsg]);
    } catch (e) {
      setError("Failed to send message.");
      setChatHistory(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I'm having trouble connecting right now. Please try again.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearChat = () => setChatHistory([]);

  return {
    isGenerating,
    suggestion,
    setSuggestion,
    error,
    draftContent,
    refineSelection,
    refineGoal,
    chatHistory,
    sendMessage,
    clearChat
  };
};
