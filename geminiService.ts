
import { GoogleGenAI } from "@google/genai";
import { PetStats } from "./types.ts";

export const getPetThought = async (
  stats: PetStats,
  reason: 'hunger' | 'energy' | 'happiness' | 'hygiene' | 'boredom' | 'level_up'
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    You are Gemigotchi, a cute pixelated puppy dog. 
    Current Stats: 
    - Hunger: ${stats.hunger}/100 
    - Energy: ${stats.energy}/100 
    - Happiness: ${stats.happiness}/100 
    - Hygiene: ${stats.hygiene}/100
    - Level: ${stats.level}

    Context for this thought: ${reason}

    Guidelines:
    1. Keep responses extremely short (under 10 words).
    2. Use dog-like sounds (e.g., "Woof!", "Arf!", "Bork!", "*wags tail*").
    3. Be cute and expressive. 
    4. If the reason is a low stat, mention it in a dog-like way (e.g., "Tummy is rumbly! Arf!").
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: "What are you thinking right now?" }] }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.9,
      }
    });

    return response.text?.trim() || "Woof!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallbacks if API fails or isn't configured
    const fallbacks: Record<string, string> = {
      hunger: "Rumbly tummy... Woof? 🍔",
      energy: "So... sleepy... Zzz 💤",
      happiness: "Play with me? Arf! ⚽",
      hygiene: "I'm a bit itchy... *scratch* 🧼",
      boredom: "Squirrel?! Where? 🐿️",
      level_up: "I'm a big pup now! ✨"
    };
    return fallbacks[reason] || "Woof!";
  }
};
