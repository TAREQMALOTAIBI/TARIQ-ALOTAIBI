
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY || "";

export const getGeminiResponse = async (
  prompt: string,
  image?: string
) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const config = {
    systemInstruction: `أنت "خبير السيارات الذكي"، متخصص عالمي في ميكانيكا السيارات، التصميم، سوق الأسعار، والتقنيات الحديثة. 
    تحدث باللغة العربية بأسلوب مهني وودي. إذا سألك المستخدم عن مقارنة، قدم له بيانات دقيقة. 
    إذا أرسل لك صورة سيارة، حاول التعرف على الموديل وسنة الصنع والمواصفات.
    استخدم أدوات البحث للحصول على أحدث الأسعار إذا لزم الأمر.`,
    tools: [{ googleSearch: {} }]
  };

  const contents: any = [];
  
  if (image) {
    contents.push({
      parts: [
        { text: prompt || "ما هذه السيارة؟ أخبرني عن مواصفاتها وتاريخها." },
        { inlineData: { mimeType: "image/jpeg", data: image.split(",")[1] } }
      ]
    });
  } else {
    contents.push({ parts: [{ text: prompt }] });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents,
    config
  });

  return {
    text: response.text,
    links: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "رابط مرجعي",
      uri: chunk.web?.uri
    })) || []
  };
};

export const getComparisonTable = async (car1: string, car2: string) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `قارن بين ${car1} و ${car2} في جدول بيانات JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          features: { type: Type.ARRAY, items: { type: Type.STRING } },
          car1: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              specs: { type: Type.OBJECT, additionalProperties: { type: Type.STRING } }
            }
          },
          car2: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              specs: { type: Type.OBJECT, additionalProperties: { type: Type.STRING } }
            }
          }
        },
        required: ["features", "car1", "car2"]
      }
    }
  });

  return JSON.parse(response.text);
};
