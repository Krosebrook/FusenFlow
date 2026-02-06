
import { GoogleGenAI, Type } from "@google/genai";
import { Attachment, Suggestion, WritingContext, GoalSuggestion, ChatMessage } from "../types";
import { MODEL_FAST, MODEL_QUALITY, SYSTEM_INSTRUCTION_EDITOR, SYSTEM_INSTRUCTION_PROACTIVE } from "../constants";
import { logger } from "./logger";

const MAX_RETRIES = 3;

// Fixed: Simplified to use process.env.API_KEY directly as required by guidelines
const getClient = () => {
  if (!process.env.API_KEY) {
    logger.error("API_KEY missing from environment");
    throw new Error("API Key missing. Please check your configuration.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRetryable = error.message?.includes('429') || error.message?.includes('503');
    if (retries > 0 && isRetryable) {
      const delay = Math.pow(2, MAX_RETRIES - retries + 1) * 1000;
      logger.warn(`AI Request failed, retrying in ${delay}ms...`, { retriesLeft: retries - 1 });
      await wait(delay);
      return withRetry(fn, retries - 1);
    }
    throw error;
  }
}

export const generateDraft = async (
  prompt: string, 
  attachments: Attachment[] = []
): Promise<string> => {
  return withRetry(async () => {
    logger.info("Generating draft", { promptLength: prompt.length });
    // Creating new client instance right before usage
    const ai = getClient();
    const parts: any[] = [{ text: prompt }];
    
    attachments.forEach(att => {
      if (att.type.startsWith('image/')) {
        parts.push({
          inlineData: { mimeType: att.type, data: att.data }
        });
      } else {
        try {
          parts.push({ text: `\n\n[Attachment: ${att.name}]\n${atob(att.data)}` });
        } catch (e) {
          logger.warn("Could not decode text attachment", { name: att.name });
        }
      }
    });

    const response = await ai.models.generateContent({
      model: MODEL_QUALITY,
      contents: { parts },
      config: { systemInstruction: SYSTEM_INSTRUCTION_EDITOR }
    });

    return response.text || "";
  });
};

export const iterateSelection = async (
  selection: string,
  instruction: string,
  context: string
): Promise<string> => {
  return withRetry(async () => {
    logger.info("Iterating selection", { instruction });
    const ai = getClient();
    const prompt = `
    Full Document Context (for tone reference): "${context.substring(0, 2000)}..."
    Target Text to Change: "${selection}"
    User Instruction: ${instruction}
    Return ONLY the rewritten text. No markdown, no quotes.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
      config: { systemInstruction: SYSTEM_INSTRUCTION_EDITOR }
    });

    return response.text?.trim() || selection;
  });
};

export const analyzeText = async (fullText: string, context?: WritingContext): Promise<Suggestion | null> => {
  if (!fullText || fullText.length < 50) return null;

  try {
    const ai = getClient();
    
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        hasSuggestion: { type: Type.BOOLEAN },
        originalText: { 
          type: Type.STRING, 
          description: "The exact substring from the source text that should be replaced. Must match exactly." 
        },
        suggestedText: { type: Type.STRING },
        reason: { type: Type.STRING },
        type: { type: Type.STRING, enum: ['style', 'grammar', 'clarity', 'flow', 'idea'] }
      },
      required: ['hasSuggestion']
    };

    let contextBlock = context ? `
      WRITING CONTEXT:
      - Target Audience: ${context.audience || 'General'}
      - Desired Tone: ${context.tone || 'Neutral'}
      - Primary Goal: ${context.goal || 'Inform'}
    ` : "";

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `${contextBlock}\n\nDOCUMENT CONTENT:\n${fullText.substring(0, 10000)}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_PROACTIVE,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const result = JSON.parse(response.text || "{}");
    if (result.hasSuggestion && result.originalText && result.suggestedText) {
      return {
        id: Math.random().toString(36).substring(7),
        originalText: result.originalText,
        suggestedText: result.suggestedText,
        reason: result.reason,
        type: result.type
      };
    }
    return null;
  } catch (error) {
    logger.debug("Background analysis skipped or failed", { error });
    return null;
  }
};

export const getGoalRefinements = async (currentGoal: string): Promise<GoalSuggestion[]> => {
  return withRetry(async () => {
    const ai = getClient();
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        suggestions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ['text', 'explanation']
          }
        }
      },
      required: ['suggestions']
    };

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Refine this goal: "${currentGoal}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: "Strategic writing coach mode."
      }
    });

    return JSON.parse(response.text || "{}").suggestions || [];
  });
};

export const sendChatMessage = async (
  history: ChatMessage[], 
  newMessage: string, 
  context: string
): Promise<string> => {
  return withRetry(async () => {
    const ai = getClient();
    
    // Convert flat internal history to Gemini SDK format
    const chatHistory = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    const chat = ai.chats.create({
      model: MODEL_QUALITY,
      history: chatHistory,
      config: {
        systemInstruction: `You are a versatile writing companion and editor. 
        Your capabilities include:
        1. Brainstorming & Ideation
        2. Outlining & Structure
        3. Tone Analysis
        4. Grammar & Mechanics Check
        5. Thesaurus & Synonyms
        6. Fact Verification guidance
        7. Character Development
        8. Plot Hole Detection
        9. Stylistic Rewriting
        10. Summarization
        11. Translation
        12. SEO Keyword optimization
        13. Formatting assistance (Markdown)
        14. Title generation
        15. Writing prompts to unblock writer's block

        ALWAYS answer in the context of the user's current document content provided below.
        Be concise, helpful, and encouraging.
        
        CURRENT DOCUMENT CONTEXT:
        """${context.substring(0, 10000)}"""`
      }
    });

    const response = await chat.sendMessage({ message: newMessage });
    return response.text || "I couldn't generate a response.";
  });
};
