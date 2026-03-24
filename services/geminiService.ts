import { GoogleGenAI, Chat } from "@google/genai";
import { APP_DATASET } from "../constants";

const API_KEY =
  import.meta.env.VITE_GEMINI_API_KEY ||
  (typeof process !== "undefined" && process.env?.GEMINI_API_KEY) ||
  (typeof process !== "undefined" && process.env?.VITE_GEMINI_API_KEY);

const SYSTEM_INSTRUCTION = `
You are a highly intelligent AI assistant embedded in "${APP_DATASET.productName}".

PRIMARY DIRECTIVES:
1. Use the dataset below to answer product/system related questions.
2. You can also answer general questions and hold natural conversations.

DATASET:
${JSON.stringify(APP_DATASET, null, 2)}

TONE:
Helpful, confident, conversational.
`;

let chatSession: Chat | null = null;

export const initializeChat = () => {
  if (!API_KEY) {
    console.error("Gemini API key is missing. Set VITE_GEMINI_API_KEY in Vercel environment variables.");
    return null;
  }

  try {
    const genAI = new GoogleGenAI({ apiKey: API_KEY as string });

    chatSession = genAI.chats.create({
      model: "gemini-2.0-flash",
      config: { systemInstruction: SYSTEM_INSTRUCTION },
    });

    return chatSession;
  } catch (error) {
    console.error("Failed to initialize chat:", error);
    return null;
  }
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  try {
    if (!chatSession) chatSession = initializeChat();

    if (!chatSession) {
      return "⚠️ API key not found. Please add VITE_GEMINI_API_KEY to your Vercel environment variables and redeploy.";
    }

    const response = await chatSession.sendMessage({ message });
    return response.text || "I couldn't generate a response.";
  } catch (error: any) {
    console.error("Gemini error:", error);
    if (error?.message?.includes("API_KEY_INVALID") || error?.message?.includes("401")) {
      return "⚠️ Your Gemini API key is invalid or expired. Please update VITE_GEMINI_API_KEY in Vercel.";
    }
    if (error?.message?.includes("429")) {
      return "⚠️ API rate limit reached. Please wait a moment and try again.";
    }
    return "Communication error with AI. Please try again.";
  }
};
