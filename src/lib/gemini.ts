import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set");
}

const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

// TODO: implement at 10am once theme is known
export async function generateText(_prompt: string): Promise<string> {
  throw new Error("Not implemented yet");
}
