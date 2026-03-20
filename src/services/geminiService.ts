import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const geminiService = {
  async generateRoomDesign(imageUri: string, style: string) {
    const model = ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: `Analyze this room photo and suggest a complete interior design transformation in ${style} style. 
            Provide:
            1. Wall color and texture suggestions.
            2. Flooring recommendations.
            3. Furniture pieces to add (with descriptions).
            4. Lighting suggestions.
            5. Decorative elements.
            Return the response in a structured JSON format.` },
            { inlineData: { mimeType: "image/jpeg", data: imageUri.split(',')[1] } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            wallSuggestions: { type: Type.STRING },
            flooringSuggestions: { type: Type.STRING },
            furnitureList: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  item: { type: Type.STRING },
                  description: { type: Type.STRING },
                  placement: { type: Type.STRING }
                }
              }
            },
            lightingSuggestions: { type: Type.STRING },
            colorPalette: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const response = await model;
    return JSON.parse(response.text || "{}");
  },

  async chatWithDesigner(message: string, history: any[] = []) {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: "You are a professional interior designer. Help users with room layouts, furniture choices, color palettes, and style advice. Be inspiring, practical, and knowledgeable about styles like Scandinavian, Industrial, Modern, and Japanese Zen."
      }
    });

    const response = await chat.sendMessage({ message });
    return response.text;
  },

  async generateRoomImage(imageUri: string, style: string) {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: imageUri.split(',')[1],
              mimeType: 'image/jpeg',
            },
          },
          {
            text: `Transform this room into a ${style} style interior. Maintain the same room structure but change the furniture, wall colors, flooring, and lighting to match the ${style} aesthetic. Return the edited image.`,
          },
        ],
      },
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  }
};
