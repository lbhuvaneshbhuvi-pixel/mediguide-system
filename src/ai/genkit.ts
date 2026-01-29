import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

import 'dotenv/config'; // Ensure .env is loaded

const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  throw new Error('GEMINI_API_KEY is not set in the environment.');
}

export const ai = genkit({
  plugins: [googleAI({ apiKey: geminiApiKey })],
  model: 'googleai/gemini-2.5-flash',
});