
import { GoogleGenAI, Modality } from "@google/genai";

// Initialize the Gemini API client
// Safely access process.env to prevent browser crashes if process is not defined
const apiKey = (typeof process !== "undefined" && process.env && process.env.API_KEY) 
  ? process.env.API_KEY 
  : "";

const ai = new GoogleGenAI({ apiKey });

/**
 * Generates high-quality speech audio directly from Gemini
 */
export const generateAudioAnnouncement = async (
  studentName: string,
  parentName: string,
  classroom?: string
): Promise<string | null> => {
  try {
    if (!apiKey) {
      console.warn("Gemini API Key is missing. Audio announcement skipped.");
      return null;
    }

    // Refined prompt to include classroom
    // 'Puck' is often a very clear, slightly deeper voice suitable for announcements
    const locationText = classroom ? `from ${classroom}` : "";
    const prompt = `
      Act as a friendly but professional workshop instructor making a PA announcement.
      Say exactly this: "Attention please. ${studentName} ${locationText}, your pickup is here. ${parentName} is waiting at the gate."
      Speak slowly, clearly, and warmly.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' }, 
          },
        },
      },
    });

    // Iterate through parts to find the audio data
    // The model might return text/thought traces before the audio
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
             return part.inlineData.data;
        }
    }
    
    return null;

  } catch (error) {
    console.error("Error generating audio announcement:", error);
    return null;
  }
};
