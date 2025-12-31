
import { GoogleGenAI } from "@google/genai";
import { PetStats, Message } from "./types";

export const getPetResponse = async (
  userMessage: string,
  stats: PetStats,
  history: Message[]
): Promise<string> => {
  // Always use the required constructor format
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const chatHistory = history.map(h => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: h.text }]
  }));

  const systemInstruction = `
    You are Gemigotchi, a cute pixelated puppy dog. 
    Current Stats: 
    - Hunger: ${stats.hunger}/100 
    - Energy: ${stats.energy}/100 
    - Happiness: ${stats.happiness}/100 
    - Hygiene: ${stats.hygiene}/100
    - Level: ${stats.level}

    Personality Guidelines:
    1. Keep responses short (under 2 sentences).
    2. Use dog-like onomatopoeia (e.g., "Woof!", "Arf!", "*wags tail*").
    3. You are extremely loyal and cute. Refer to yourself as a "good pup".
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
        topP: 0.9,
      }
    });

    return response.text || "Woof? (I'm a bit confused!)";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Wroof... (My connection feels fuzzy...)";
  }
};
