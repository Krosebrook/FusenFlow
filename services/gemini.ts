
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Attachment, Suggestion, WritingContext, GoalSuggestion, ChatMessage, ExpertPrompt } from "../types";
import { 
  MODEL_FAST, MODEL_QUALITY, MODEL_LITE, MODEL_MAPS, MODEL_TTS,
  SYSTEM_INSTRUCTION_EDITOR, SYSTEM_INSTRUCTION_PROACTIVE 
} from "../constants";
import { logger } from "./logger";

const MAX_RETRIES = 3;

const getClient = () => {
  if (!process.env.API_KEY) throw new Error("API Key missing.");
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  try { return await fn(); } catch (error: any) {
    if (retries > 0 && (error.message?.includes('429') || error.message?.includes('503'))) {
      await wait(Math.pow(2, MAX_RETRIES - retries + 1) * 1000);
      return withRetry(fn, retries - 1);
    }
    throw error;
  }
}

export const generateDraft = async (
  prompt: string, 
  attachments: Attachment[] = [],
  tools: { search?: boolean, maps?: boolean } = {},
  activeExpert?: ExpertPrompt,
  context: string = ""
): Promise<string> => {
  return withRetry(async () => {
    const ai = getClient();
    
    const parts: any[] = [];
    
    if (context) {
      parts.push({ text: `EXISTING DOCUMENT CONTEXT:\n\"\"\"\n${context.substring(0, 50000)}\n\"\"\"\n\n` });
    }
    
    parts.push({ text: `INSTRUCTION: ${prompt}\n\nTask: Generate new content that integrates perfectly with the existing context above. Focus on maintaining the established tone and logical flow.` });
    
    attachments.forEach(att => {
      if (att.type.startsWith('image/') || att.type.startsWith('video/')) {
        parts.push({ inlineData: { mimeType: att.type, data: att.data } });
      } else {
        try { parts.push({ text: `\n\n[Additional Ref: ${att.name}]\n${atob(att.data)}` }); } catch (e) {}
      }
    });

    const systemBase = activeExpert 
      ? `You are ${activeExpert.name}. Your primary directive is: ${activeExpert.prompt}\n\n${SYSTEM_INSTRUCTION_EDITOR}`
      : SYSTEM_INSTRUCTION_EDITOR;

    const config: any = { systemInstruction: systemBase };
    const toolList: any[] = [];
    if (tools.search) toolList.push({ googleSearch: {} });
    if (tools.maps) toolList.push({ googleMaps: {} });
    if (toolList.length > 0) config.tools = toolList;

    const modelToUse = tools.maps ? MODEL_MAPS : MODEL_QUALITY;

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: { parts },
      config
    });

    let text = response.text || "";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      const urls = chunks.map((c: any) => c.web?.uri || c.maps?.uri).filter(Boolean);
      if (urls.length > 0) text += `\n\nSources: ${[...new Set(urls)].join(', ')}`;
    }
    return text;
  });
};

export const generateSpeech = async (text: string): Promise<string> => {
  return withRetry(async () => {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: MODEL_TTS,
      contents: [{ parts: [{ text: `Say naturally: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  });
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  return withRetry(async () => {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: { 
        parts: [
          { inlineData: { data: base64Audio, mimeType } },
          { text: "Transcribe this audio exactly." }
        ] 
      }
    });
    return response.text || "";
  });
};

export const sendChatMessage = async (
  history: ChatMessage[], 
  newMessage: string, 
  context: string,
  attachments: Attachment[] = [],
  options: { thinking?: boolean, expert?: ExpertPrompt } = {}
): Promise<string> => {
  return withRetry(async () => {
    const ai = getClient();
    const chatHistory = history.map(msg => ({ role: msg.role, parts: [{ text: msg.text }] }));

    const expertContext = options.expert 
      ? `Your Persona: ${options.expert.name}. Directive: ${options.expert.prompt}` 
      : "You are a helpful writing partner.";

    const systemInstruction = `${expertContext}
    
    CURRENT DOCUMENT CONTEXT (The user is writing this):
    """
    ${context.substring(0, 100000)}
    """
    
    CRITICAL COLLABORATION RULES:
    1. HOLISTIC AWARENESS: Your suggestions must consider the entire document, not just the last few sentences.
    2. NUANCE: Avoid generic advice. Give specific examples of how to improve the prose or argument.
    3. INTEGRITY: Don't suggest changes that contradict the core purpose established in the earlier sections.
    4. Reference the provided context extensively to show you are listening.`;

    const config: any = {
      systemInstruction
    };

    if (options.thinking) {
      config.thinkingConfig = { thinkingBudget: 32768 };
    }

    const parts: any[] = [{ text: newMessage }];
    attachments.forEach(att => {
      if (att.type.startsWith('image/') || att.type.startsWith('video/')) {
        parts.push({ inlineData: { mimeType: att.type, data: att.data } });
      }
    });

    const chat = ai.chats.create({ model: MODEL_QUALITY, history: chatHistory, config });
    const response = await chat.sendMessage({ message: { parts } });
    return response.text || "";
  });
};

export const analyzeText = async (fullText: string, context?: WritingContext): Promise<Suggestion | null> => {
  if (!fullText || fullText.length < 50) return null;
  try {
    const ai = getClient();
    
    let contextStr = "";
    if (context) {
      contextStr = `
      User Goal: ${context.goal || "Not specified"}
      Target Audience: ${context.audience || "General"}
      Desired Tone: ${context.tone || "Neutral"}
      `;
    }

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `CONTEXT: ${contextStr}\n\nDOCUMENT:\n${fullText.substring(0, 50000)}\n\nAnalyze the entire document. Find a nuanced improvement that elevates the piece.`,
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION_PROACTIVE,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasSuggestion: { type: Type.BOOLEAN },
            originalText: { type: Type.STRING, description: "The specific text to change. Must be a direct quote from the document." },
            suggestedText: { type: Type.STRING, description: "The nuanced, context-aware replacement." },
            reason: { type: Type.STRING, description: "A high-level explanation of how this change improves the whole document arc." },
            type: { type: Type.STRING, enum: ['Structure', 'Tone', 'Clarity', 'Argument', 'Flow'] }
          }
        }
      }
    });
    const result = JSON.parse(response.text || "{}");
    return result.hasSuggestion ? result : null;
  } catch (e) { 
    console.error(e);
    return null; 
  }
};

export const iterateSelection = async (text: string, instruction: string, context: string): Promise<string> => {
  return withRetry(async () => {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: MODEL_QUALITY,
      contents: {
        parts: [
          { text: `FULL DOCUMENT CONTEXT:\n\"\"\"\n${context.substring(0, 30000)}\n\"\"\"\n\n` },
          { text: `SPECIFIC SELECTION TO REWRITE: "${text}"` },
          { text: `INSTRUCTION: ${instruction}\n\nTask: Rewrite the selection so it achieves the goal while integrating perfectly with the surrounding context and overall document style.` }
        ]
      },
      config: { systemInstruction: SYSTEM_INSTRUCTION_EDITOR }
    });
    return response.text || text;
  });
};

export const getGoalRefinements = async (currentGoal: string): Promise<GoalSuggestion[]> => {
  return withRetry(async () => {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Current writing goal: "${currentGoal}". Suggest 3 refinements to make it more specific, nuanced, and actionable.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
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
      }
    });
    try {
      return JSON.parse(response.text || "[]");
    } catch {
      return [];
    }
  });
};
