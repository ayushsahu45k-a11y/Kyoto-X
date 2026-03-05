import { GoogleGenAI, Chat } from "@google/genai";
import { APP_DATASET } from "../constants";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

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

// ✅ EXPORT THIS
export const initializeChat = () => {
  if (!API_KEY) {
    console.error("Gemini API key is missing.");
    return null;
  }

  try {
    const genAI = new GoogleGenAI({
      apiKey: API_KEY,
    });

    chatSession = genAI.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    return chatSession;
  } catch (error) {
    console.error("Failed to initialize chat:", error);
    return null;
  }
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  try {
    if (!chatSession) {
      chatSession = initializeChat();
    }

    if (!chatSession) {
      return "Error: Chat session could not be initialized. Please check your API key.";
    }

    const response = await chatSession.sendMessage({
      message: message,
    });

    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini error:", error);
    return "Communication error with AI. Please try again.";
  }
};
