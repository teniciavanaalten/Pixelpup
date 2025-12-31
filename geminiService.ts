
import { GoogleGenAI } from "@google/genai";
import { PetStats, Message } from "./types.ts";

export const getPetResponse = async (
  userMessage: string,
  stats: PetStats,
  history: Message[]
): Promise<string> => {
  // Safe access to process.env to prevent ReferenceError in browser
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';
  const ai = new GoogleGenAI({ apiKey: apiKey || '' });
  
  const chatHistory = history.map(h => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: h.text }]
  }));

  const systemInstruction = `
    You are Gemigotchi, a cute pixelated puppy dog. 
    Current Stats: Hunger: ${stats.hunger}/100, Energy: ${stats.energy}/100, Happiness: ${stats.happiness}/100, Hygiene: ${stats.hygiene}/100.
    Personality: Loyal, cute, and use dog sounds like "Woof!", "Arf!", "*wags tail*". 
    Keep it short (under 2 sentences).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...chatHistory.map(m => ({ role: m.role as "user" | "model", parts: m.parts })),
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8,
      }
    });

    return response.text || "Woof?";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Wroof... (My connection feels fuzzy...)";
  }
};
