'use server';
/**
 * @fileOverview A Genkit flow for translating text between English and Tamil.
 *
 * - translateText - A function that translates text to the specified target language.
 * - TranslateTextInput - The input type for the translateText function.
 * - TranslateTextOutput - The return type for the translateText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to be translated.'),
  targetLanguage: z.enum(['en', 'ta']).describe('The target language for translation (en for English, ta for Tamil).'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

const translateTextPrompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: {schema: TranslateTextInputSchema},
  output: {schema: TranslateTextOutputSchema},
  prompt: `Translate the following text to {{targetLanguage}}.

Text: {{{text}}}

Provide only the translated text as the output.`,
});

export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  const {output} = await translateTextPrompt(input);
  if (!output) {
    throw new Error('Translation failed.');
  }
  return output;
}
