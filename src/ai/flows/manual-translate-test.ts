import 'dotenv/config';
const geminiApiKey = process.env.GEMINI_API_KEY;
console.log('GEMINI_API_KEY:', geminiApiKey);
import { batchTranslateText } from './batch-translate-text.ts';

async function main() {
  const result = await batchTranslateText({
    texts: ["Hello, how are you?"],
    targetLanguage: "ta",
  });
  console.log('Tamil:', result.translatedTexts[0]);

  const result2 = await batchTranslateText({
    texts: [result.translatedTexts[0]],
    targetLanguage: "en",
  });
  console.log('Back to English:', result2.translatedTexts[0]);
}

main().catch(console.error);
