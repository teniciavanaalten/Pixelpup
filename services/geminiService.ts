
import { GoogleGenAI } from "@google/genai";
import { PetStats, Message } from "../types";

export const getPetResponse = async (
  userMessage: string,
  stats: PetStats,
  history: Message[]
): Promise<string> => {
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

    Dog Personality Guidelines:
    1. Keep responses short (under 2 sentences).
    2. Use dog-like onomatopoeia (e.g., "Woof!", "Arf!", "Bork!", "Awooo~", "*wags tail*").
    3. If hunger is low, whine and ask for treats. If energy is low, yawn.
    4. You are extremely loyal but easily distracted by imaginary squirrels.
    5. Refer to yourself as a "good boy" or "good pup".
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: 'user', parts: [{ text: `System context: ${systemInstruction}` }] },
        ...chatHistory.map(m => ({ role: m.role, parts: m.parts })),
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
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
