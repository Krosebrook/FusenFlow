import { GoogleGenAI, Schema, Type } from "@google/genai";
import { Attachment, Suggestion } from "../types";
import { MODEL_FAST, MODEL_QUALITY, SYSTEM_INSTRUCTION_EDITOR, SYSTEM_INSTRUCTION_PROACTIVE } from "../constants";

// Helper to ensure API Key is present
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
    throw new Error("API Key missing");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Generates content based on a prompt and optional attachments.
 * Used for "Write something for me" feature.
 */
export const generateDraft = async (
  prompt: string, 
  attachments: Attachment[] = []
): Promise<string> => {
  try {
    const ai = getClient();
    
    // Prepare contents
    const parts: any[] = [{ text: prompt }];
    
    // Add attachments
    attachments.forEach(att => {
      // Basic handling for text/image. 
      // For simplicity in this demo, we assume images or text compatible with inlineData
      if (att.type.startsWith('image/')) {
        parts.push({
          inlineData: {
            mimeType: att.type,
            data: att.data
          }
        });
      } else {
        // For text files, we append content to the prompt part or as a separate text part
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

/**
 * Iterates on a specific selection of text.
 * Used for "Inline changes".
 */
export const iterateSelection = async (
  selection: string,
  instruction: string,
  context: string // The surrounding text can be useful context
): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `
    Context of the document: "${context.substring(0, 500)}..."
    
    The user wants to change this specific text: "${selection}"
    
    Instruction: ${instruction}
    
    Return ONLY the rewritten text to replace the selection. Do not add quotes or explanations.
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

/**
 * Proactively analyzes text for suggestions.
 */
export const analyzeText = async (text: string): Promise<Suggestion | null> => {
  if (!text || text.length < 50) return null;

  try {
    const ai = getClient();
    
    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        hasSuggestion: { type: Type.BOOLEAN },
        reason: { type: Type.STRING },
        suggestedText: { type: Type.STRING },
        type: { type: Type.STRING, enum: ['improvement', 'grammar', 'idea'] }
      },
      required: ['hasSuggestion']
    };

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Analyze this text segment: "${text.substring(text.length - 1000)}"`, // Analyze last 1000 chars
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_PROACTIVE,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const result = JSON.parse(response.text || "{}");
    
    if (result.hasSuggestion) {
      return {
        id: Date.now().toString(),
        reason: result.reason,
        suggestedText: result.suggestedText,
        type: result.type
      };
    }
    
    return null;

  } catch (error) {
    console.warn("Proactive analysis failed silently:", error);
    return null;
  }
};