import { GoogleGenAI, Schema, Type } from "@google/genai";
import { Attachment, Suggestion, WritingContext, GoalSuggestion } from "../types";
import { MODEL_FAST, MODEL_QUALITY, SYSTEM_INSTRUCTION_EDITOR, SYSTEM_INSTRUCTION_PROACTIVE } from "../constants";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
    throw new Error("API Key missing");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateDraft = async (
  prompt: string, 
  attachments: Attachment[] = []
): Promise<string> => {
  try {
    const ai = getClient();
    const parts: any[] = [{ text: prompt }];
    
    attachments.forEach(att => {
      if (att.type.startsWith('image/')) {
        parts.push({
          inlineData: {
            mimeType: att.type,
            data: att.data
          }
        });
      } else {
        parts.push({ text: `\n\n[Attachment: ${att.name}]\n${atob(att.data)}` });
      }
    });

    const response = await ai.models.generateContent({
      model: MODEL_QUALITY,
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_EDITOR,
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Error generating draft:", error);
    throw error;
  }
};

export const iterateSelection = async (
  selection: string,
  instruction: string,
  context: string
): Promise<string> => {
  try {
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
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_EDITOR,
      }
    });

    return response.text?.trim() || selection;
  } catch (error) {
    console.error("Error iterating selection:", error);
    throw error;
  }
};

export const analyzeText = async (fullText: string, context?: WritingContext): Promise<Suggestion | null> => {
  if (!fullText || fullText.length < 50) return null;

  try {
    const ai = getClient();
    
    const responseSchema: Schema = {
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

    const contextLimit = 30000;
    const textToAnalyze = fullText.length > contextLimit 
      ? fullText.substring(fullText.length - contextLimit) 
      : fullText;

    // Construct the context-aware prompt
    let contextBlock = "";
    if (context) {
      contextBlock = `
      WRITING CONTEXT:
      - Target Audience: ${context.audience || 'General'}
      - Desired Tone: ${context.tone || 'Neutral'}
      - Primary Goal: ${context.goal || 'Inform'}
      `;
    }

    const contents = `
    ${contextBlock}

    DOCUMENT CONTENT TO ANALYZE:
    ${textToAnalyze}
    `;

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_PROACTIVE,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const result = JSON.parse(response.text || "{}");
    
    if (result.hasSuggestion && result.originalText && result.suggestedText) {
      return {
        id: Date.now().toString(),
        originalText: result.originalText,
        suggestedText: result.suggestedText,
        reason: result.reason,
        type: result.type
      };
    }
    
    return null;

  } catch (error) {
    // Silent fail is expected for background tasks
    return null;
  }
};

export const getGoalRefinements = async (currentGoal: string): Promise<GoalSuggestion[]> => {
  try {
    const ai = getClient();
    
    const responseSchema: Schema = {
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

    const prompt = `
    The user has a rough writing goal: "${currentGoal}".
    Provide 3 distinct, more specific, and actionable versions of this goal.
    Explain briefly how each refines the objective.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: "You are a strategic writing coach. Help the user clarify their intent."
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result.suggestions || [];
  } catch (error) {
    console.error("Error refining goal:", error);
    return [];
  }
};