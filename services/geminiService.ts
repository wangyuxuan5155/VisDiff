
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisReport } from "../types";

const API_KEY = process.env.API_KEY || "";

export const analyzeFidelity = async (
  designBase64: string,
  implementationBase64: string
): Promise<AnalysisReport> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            text: `你是一位世界级的资深前端 QA 和 UI/UX 工程师。
            请对比“设计稿”（图1）与“实际开发页面截图”（图2）。
            你的任务是识别出所有视觉上的不一致（还原度问题），包括：
            1. 颜色 (Hex 色值、背景色、边框色)
            2. 文字排版 (字体粗细、字号大小、行高、字体族)
            3. 间距 (外边距 Margin、内边距 Padding、元素间距 Gap)
            4. 对齐与布局 (栅格、弹性布局、居中情况)
            
            请使用中文提供详细报告，格式为 JSON。
            location 坐标请使用相对于设计稿的归一化坐标 (0-100)。
            还原度评分 (score) 范围为 0 到 100。
            summary 请简要总结还原度情况。
            discrepancies 中的 description、expected、actual 必须全部使用中文。`
          },
          {
            inlineData: {
              mimeType: "image/png",
              data: designBase64.split(",")[1],
            }
          },
          {
            inlineData: {
              mimeType: "image/png",
              data: implementationBase64.split(",")[1],
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          score: { type: Type.NUMBER },
          colorPalette: {
            type: Type.OBJECT,
            properties: {
              design: { type: Type.ARRAY, items: { type: Type.STRING } },
              implementation: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["design", "implementation"]
          },
          discrepancies: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                severity: { type: Type.STRING },
                description: { type: Type.STRING },
                expected: { type: Type.STRING },
                actual: { type: Type.STRING },
                location: {
                  type: Type.OBJECT,
                  properties: {
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    width: { type: Type.NUMBER },
                    height: { type: Type.NUMBER },
                  }
                }
              },
              required: ["category", "severity", "description", "expected", "actual"]
            }
          }
        },
        required: ["summary", "score", "discrepancies", "colorPalette"]
      }
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("AI 返回内容为空");
    return JSON.parse(text) as AnalysisReport;
  } catch (error) {
    console.error("解析 AI 响应失败:", error);
    throw new Error("无法分析图片，请重试。");
  }
};
