
import { GoogleGenAI } from "@google/genai";
import { PetStats, Message } from "./types.ts";

export const getPetResponse = async (
  userMessage: string,
  stats: PetStats,
  history: Message[]
): Promise<string> => {
  // Use a new instance to ensure the most up-to-date environment context
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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

    Dog Personality Guidelines:
    1. Keep responses short (under 2 sentences).
    2. Use dog-like sounds (e.g., "Woof!", "Arf!", "Bork!", "*wags tail*").
    3. If stats are low, sound tired or hungry.
    4. You love treats, naps, and your owner.
    5. Refer to yourself as a "good boy" or "good pup".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...chatHistory.map(m => ({ role: m.role as "user" | "model", parts: m.parts })),
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "Woof! (I'm a bit sleepy...)";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Wroof... (My connection feels a bit fuzzy!)";
  }
};
