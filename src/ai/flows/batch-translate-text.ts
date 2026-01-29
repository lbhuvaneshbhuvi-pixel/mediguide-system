'use server';
/**
 * @fileOverview A Genkit flow for translating a batch of texts between English and Tamil.
 *
 * - batchTranslateText - A function that translates an array of texts to the specified target language.
 * - BatchTranslateTextInput - The input type for the batchTranslateText function.
 * - BatchTranslateTextOutput - The return type for the batchTranslateText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BatchTranslateTextInputSchema = z.object({
  texts: z.array(z.string()).describe('The texts to be translated.'),
  targetLanguage: z.enum(['en', 'ta']).describe('The target language for translation (en for English, ta for Tamil).'),
});
export type BatchTranslateTextInput = z.infer<typeof BatchTranslateTextInputSchema>;

const BatchTranslateTextOutputSchema = z.object({
  translatedTexts: z.array(z.string()).describe('The translated texts, in the same order as the input.'),
});
export type BatchTranslateTextOutput = z.infer<typeof BatchTranslateTextOutputSchema>;

const batchTranslateTextPrompt = ai.definePrompt({
  name: 'batchTranslateTextPrompt',
  input: {schema: BatchTranslateTextInputSchema},
  output: {schema: BatchTranslateTextOutputSchema},
  prompt: `Translate the following array of texts to {{targetLanguage}}.
Return the translated texts in a JSON array, maintaining the original order.

Texts: {{{json texts}}}

Provide only the JSON array of translated texts as the output.`,
});

export async function batchTranslateText(input: BatchTranslateTextInput): Promise<BatchTranslateTextOutput> {
    if (input.texts.every(t => !t || t.trim() === '')) {
        return { translatedTexts: input.texts };
    }
      try {
        const { output } = await batchTranslateTextPrompt(input);
        if (!output) {
          throw new Error('Batch translation failed.');
        }
        return { translatedTexts: output };
      } catch (err: any) {
        // Quota errors are handled in the frontend with a toast; do not use alert here (server-side)
        // if (err.code === 429 || err.status === 429 || (err.message && err.message.includes('Too Many Requests'))) {
        //   // Optionally log or handle quota error here
        // }
        throw err; // rethrow so your app can handle it elsewhere if needed
      }
}
