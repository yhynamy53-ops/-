
import { GoogleGenAI, Content, Modality } from "@google/genai";
import { Message } from '../types';

const getSystemInstruction = (modelType: string): string => {
  switch (modelType) {
    case 'assistant-helpful':
      return 'أنت مساعد ودود ومفيد. كن مفصلاً ومباشراً في ردودك.';
    case 'assistant-socratic':
      return 'أنت مساعد سقراطي. هدفك هو مساعدة المستخدم على التفكير بنفسه عن طريق طرح أسئلة استقصائية بدلاً من إعطاء إجابات مباشرة.';
    case 'assistant-short':
      return 'أنت مساعد يقدم إجابات قصيرة وموجزة ومباشرة جداً.';
    case 'assistant-default':
    default:
      return 'أنت مساعد ذكاء اصطناعي مفيد ومتعاون. أجب باللغة العربية.';
  }
};

export async function generateImage(prompt: string): Promise<{imageUrl?: string, error?: string}> {
  if (!process.env.API_KEY) {
    return { error: "خطأ: مفتاح API غير موجود. يرجى التأكد من تهيئته." };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });
    
    // Using optional chaining and checking for the first candidate
    const candidate = response.candidates?.[0];
    if (candidate && candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
            return { imageUrl };
          }
        }
    }
    
    return { error: "لم يتمكن النموذج من إنشاء صورة. حاول مرة أخرى." };
  } catch (error) {
    console.error("Error generating image:", error);
    return { error: "عذراً، حدث خطأ أثناء إنشاء الصورة. يرجى المحاولة مرة أخرى." };
  }
}

export async function* generateResponseStream(
  history: Message[],
  modelType: string
): AsyncGenerator<string> {
  if (!process.env.API_KEY) {
    yield "خطأ: مفتاح API غير موجود. يرجى التأكد من تهيئته.";
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = getSystemInstruction(modelType);

    const contents: Content[] = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    if (contents.length === 0) return;

    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        yield text;
      }
    }
  } catch (error) {
    console.error("Error generating response:", error);
    yield "عذراً، حدث خطأ أثناء الاتصال بالنموذج. يرجى المحاولة مرة أخرى.";
  }
}
