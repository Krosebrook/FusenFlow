
import { useState, useEffect, useCallback } from 'react';
import { Suggestion, Attachment, SelectionRange, WritingContext, GoalSuggestion, ChatMessage, ExpertPrompt } from '../types';
import { generateDraft, iterateSelection, analyzeText, getGoalRefinements, sendChatMessage } from '../services/gemini';
import { logger } from '../services/logger';

interface UseMagicAIProps {
  content: string;
  isMagicMode: boolean;
  selection: SelectionRange | null;
  writingContext: WritingContext;
  initialChatHistory: ChatMessage[];
  onChatUpdate: (history: ChatMessage[]) => void;
}

export const useMagicAI = ({ 
  content, 
  isMagicMode, 
  selection, 
  writingContext, 
  initialChatHistory,
  onChatUpdate 
}: UseMagicAIProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeExpert, setActiveExpert] = useState<ExpertPrompt | undefined>(undefined);
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(initialChatHistory);

  // Sync chat history when document changes
  useEffect(() => {
    setChatHistory(initialChatHistory);
  }, [initialChatHistory]);

  // Debounced Proactive Analysis
  useEffect(() => {
    if (!isMagicMode || content.length < 100) return; // Increased min length for meaningful analysis
    
    // Clear suggestion if it's no longer relevant (text changed significantly)
    if (suggestion && !content.includes(suggestion.originalText.substring(0, 20))) {
      setSuggestion(null);
    }

    const timeoutId = setTimeout(async () => {
      if (!selection && !isGenerating) {
        // Pass writingContext to analyzeText for goal-aware feedback
        const result = await analyzeText(content, writingContext);
        if (result) {
            // For general suggestions (originalText might be empty or general), we accept them.
            // For specific replacements, we check if text exists.
            if (result.originalText && content.includes(result.originalText)) {
                setSuggestion(result);
            } else if (!result.originalText) {
                 setSuggestion(result); // Global suggestion
            }
        }
      }
    }, 5000); // 5s debounce for deeper analysis

    return () => clearTimeout(timeoutId);
  }, [content, isMagicMode, selection, isGenerating, writingContext]);

  // Updated to pass current document content as context
  const draftContent = async (prompt: string, attachments: Attachment[], tools: { search?: boolean, maps?: boolean } = {}) => {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateDraft(prompt, attachments, tools, activeExpert, content);
      return result;
    } catch (e) {
      setError("Failed to draft content.");
      logger.error("Magic Draft Error", { error: e });
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
      logger.error("Refine Selection Error", { error: e });
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
      logger.error("Refine Goal Error", { error: e });
      return [];
    } finally {
      setIsGenerating(false);
    }
  };

  const sendMessage = async (text: string, attachments: Attachment[] = [], options: { thinking?: boolean, expert?: ExpertPrompt } = {}) => {
    if (!text.trim() && attachments.length === 0) return;
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text + (attachments.length > 0 ? ` [Sent ${attachments.length} attachment(s)]` : ''),
      timestamp: Date.now()
    };
    
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    onChatUpdate(newHistory);
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // Pass content as context to the chat
      const responseText = await sendChatMessage(chatHistory, text, content, attachments, { thinking: options.thinking, expert: options.expert || activeExpert });
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      const finalHistory = [...newHistory, botMsg];
      setChatHistory(finalHistory);
      onChatUpdate(finalHistory);
    } catch (e) {
      setError("Failed to send message.");
      logger.error("Chat Error", { error: e });
      
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: "I encountered an error trying to process your request. Please try again in a moment.",
        timestamp: Date.now()
      };
      const finalHistory = [...newHistory, errorMsg];
      setChatHistory(finalHistory);
      onChatUpdate(finalHistory);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearChat = () => {
    setChatHistory([]);
    onChatUpdate([]);
  };

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
    clearChat,
    activeExpert,
    setActiveExpert
  };
};
