
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Attachment, Suggestion, WritingContext, GoalSuggestion, ChatMessage, ExpertPrompt, OutlineItem } from "../types";
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

// Helper to safely decode base64 to UTF-8 string
const decodeBase64ToString = (base64: string): string => {
  try {
    const binString = atob(base64);
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0) || 0);
    return new TextDecoder().decode(bytes);
  } catch (e) {
    return atob(base64); // Fallback
  }
};

export const generateDraft = async (
  prompt: string, 
  attachments: Attachment[] = [],
  tools: { search?: boolean, maps?: boolean } = {},
  activeExpert?: ExpertPrompt,
  context: string = "",
  writingContext?: WritingContext
): Promise<string> => {
  return withRetry(async () => {
    const ai = getClient();
    
    const parts: any[] = [];
    
    // Inject Writing Context if available
    if (writingContext) {
       parts.push({ text: `
         WRITING CONFIGURATION:
         - Goal: ${writingContext.goal || "Not specified"}
         - Format: ${writingContext.format || "Open format"}
         - Audience: ${writingContext.audience || "General"}
         - Tone: ${writingContext.tone || "Neutral"}
       `});
    }

    if (context) {
      parts.push({ text: `EXISTING DOCUMENT CONTEXT:\n\"\"\"\n${context.substring(0, 50000)}\n\"\"\"\n\n` });
    }
    
    parts.push({ text: `INSTRUCTION: ${prompt}\n\nTask: Generate new content that integrates perfectly with the existing context above. Focus on maintaining the established tone and logical flow.` });
    
    attachments.forEach(att => {
      // PDF and Images/Videos are treated as inlineData for multimodal processing
      if (att.type.startsWith('image/') || att.type.startsWith('video/') || att.type === 'application/pdf') {
        parts.push({ inlineData: { mimeType: att.type, data: att.data } });
      } else {
        // Text files are decoded and appended as context
        try { 
          const decodedText = decodeBase64ToString(att.data);
          parts.push({ text: `\n\n[Additional Ref: ${att.name}]\n${decodedText}` }); 
        } catch (e) {
          console.warn(`Failed to decode attachment ${att.name}`, e);
        }
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

export const generateBrainstorming = async (content: string, context: WritingContext): Promise<string> => {
  return withRetry(async () => {
    const ai = getClient();
    
    const contextStr = `
      GOAL: ${context.goal || "Write a compelling piece"}
      FORMAT: ${context.format || "Open format"}
      AUDIENCE: ${context.audience || "General Audience"}
      TONE: ${context.tone || "Creative"}
    `;

    const prompt = `
      You are a creative muse and brainstorming partner.
      
      CONTEXT:
      ${contextStr}
      
      CURRENT CONTENT (Snippet):
      """
      ${content.substring(0, 20000) || "(No content yet)"}
      """
      
      TASK:
      Generate 5 distinct, creative ideas to help the user move forward. 
      These can be:
      - Plot twists or narrative beats
      - Character details or conflicts
      - Thematic expansions
      - Metaphors or imagery to explore
      
      Format the output as a concise, inspiring Markdown list. Do not write the draft itself, just the ideas.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_QUALITY,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are a highly creative brainstorming partner. Focus on divergent thinking and novel connections.",
        temperature: 0.9 // Higher temperature for creativity
      }
    });

    return response.text || "I couldn't generate ideas right now. Try adjusting your goal.";
  });
};

export const generateSummary = async (text: string, context: WritingContext): Promise<string> => {
  return withRetry(async () => {
    const ai = getClient();
    const contextStr = `
      WRITING CONTEXT:
      - Goal: ${context.goal || "Not specified"}
      - Format: ${context.format || "General"}
      - Audience: ${context.audience || "General"}
      - Tone: ${context.tone || "Neutral"}
    `;

    const prompt = `
      You are an expert editor.
      
      CONTEXT:
      ${contextStr}
      
      TEXT TO SUMMARIZE:
      """
      ${text.substring(0, 100000)}
      """
      
      TASK:
      Provide a concise summary of the text above. 
      The summary should be tailored to the stated writing goal and audience.
      Highlight the key narrative arcs, arguments, or themes.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_EDITOR,
      }
    });

    return response.text || "Could not generate summary.";
  });
};

export const generateOutline = async (text: string, context: WritingContext): Promise<OutlineItem[]> => {
  return withRetry(async () => {
    const ai = getClient();
    const contextStr = `
      WRITING CONTEXT:
      - Goal: ${context.goal || "Not specified"}
      - Format: ${context.format || "General"}
      - Audience: ${context.audience || "General"}
      - Tone: ${context.tone || "Neutral"}
    `;

    const prompt = `
      Analyze the provided document and create a logical, hierarchical outline. 
      The outline should represent the document's structure, reflecting the stated writing goal and format.
      
      ${contextStr}
      
      DOCUMENT CONTENT:
      """
      ${text.substring(0, 80000)}
      """
      
      Output ONLY a JSON array of objects. Each object must have:
      - level (integer, 1 for main sections, 2 for subsections, etc.)
      - text (string, the label for that section)
    `;

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              level: { type: Type.INTEGER },
              text: { type: Type.STRING }
            },
            required: ['level', 'text']
          }
        }
      }
    });

    try {
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Failed to parse outline JSON", e);
      return [];
    }
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
  options: { thinking?: boolean, expert?: ExpertPrompt, search?: boolean } = {},
  writingContext?: WritingContext
): Promise<string> => {
  return withRetry(async () => {
    const ai = getClient();
    const chatHistory = history.map(msg => ({ role: msg.role, parts: [{ text: msg.text }] }));

    const expertContext = options.expert 
      ? `Your Persona: ${options.expert.name}. Directive: ${options.expert.prompt}` 
      : "You are a helpful writing partner.";

    let writingContextStr = "";
    if (writingContext) {
      writingContextStr = `
      WRITING CONFIGURATION:
      - Goal: ${writingContext.goal || "Not specified"}
      - Format: ${writingContext.format || "Open format"}
      - Audience: ${writingContext.audience || "General"}
      - Tone: ${writingContext.tone || "Neutral"}
      `;
    }

    const systemInstruction = `${expertContext}

    ${writingContextStr}
    
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

    if (options.search) {
      config.tools = [{ googleSearch: {} }];
    }

    const parts: any[] = [{ text: newMessage }];
    attachments.forEach(att => {
      // PDF and Images/Videos are treated as inlineData for multimodal processing
      if (att.type.startsWith('image/') || att.type.startsWith('video/') || att.type === 'application/pdf') {
        parts.push({ inlineData: { mimeType: att.type, data: att.data } });
      } else {
        // Text files are decoded and appended as context
        try { 
          const decodedText = decodeBase64ToString(att.data);
          parts.push({ text: `\n\n[Additional Ref: ${att.name}]\n${decodedText}` }); 
        } catch (e) {
          console.warn(`Failed to decode attachment ${att.name}`, e);
        }
      }
    });

    const chat = ai.chats.create({ model: MODEL_QUALITY, history: chatHistory, config });
    const response = await chat.sendMessage({ message: { parts } });
    
    let text = response.text || "";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      const urls = chunks.map((c: any) => c.web?.uri || c.maps?.uri).filter(Boolean);
      if (urls.length > 0) text += `\n\nSources: ${[...new Set(urls)].join(', ')}`;
    }

    return text;
  });
};

export const analyzeText = async (fullText: string, context?: WritingContext): Promise<Suggestion | null> => {
  if (!fullText || fullText.length < 50) return null;
  try {
    const ai = getClient();
    
    let contextStr = "";
    if (context) {
      contextStr = `
      WRITING CONTEXT:
      - Goal: ${context.goal || "Create a compelling piece"}
      - Format: ${context.format || "General text"}
      - Audience: ${context.audience || "General reader"}
      - Tone: ${context.tone || "Professional yet engaging"}
      `;
    }

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `${contextStr}\n\nFULL DOCUMENT CONTENT:\n${fullText.substring(0, 50000)}\n\nINSTRUCTION: Analyze the document structure, arguments, and flow based on the Writing Context. Identify the single most critical weakness (e.g., a logic gap, a weak transition, a missed counter-argument, or inconsistent tone) and propose a concrete fix.`,
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION_PROACTIVE,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasSuggestion: { type: Type.BOOLEAN },
            originalText: { type: Type.STRING, description: "The exact text segment (sentence or paragraph) to be improved." },
            suggestedText: { type: Type.STRING, description: "The improved version of the text." },
            reason: { type: Type.STRING, description: "A concise explanation of why this change improves the document's structure, argument, or flow." },
            type: { type: Type.STRING, enum: ['Structure', 'Tone', 'Clarity', 'Argument', 'Flow', 'Style'] }
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

export const iterateSelection = async (
  text: string, 
  instruction: string, 
  context: string,
  writingContext?: WritingContext
): Promise<string> => {
  return withRetry(async () => {
    const ai = getClient();

    let writingContextStr = "";
    if (writingContext) {
      writingContextStr = `
      WRITING CONFIGURATION:
      - Goal: ${writingContext.goal || "Not specified"}
      - Format: ${writingContext.format || "Open format"}
      - Audience: ${writingContext.audience || "General"}
      - Tone: ${writingContext.tone || "Neutral"}
      `;
    }

    const response = await ai.models.generateContent({
      model: MODEL_QUALITY,
      contents: {
        parts: [
          { text: `FULL DOCUMENT CONTEXT:\n\"\"\"\n${context.substring(0, 30000)}\n\"\"\"\n\n` },
          { text: writingContextStr },
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
