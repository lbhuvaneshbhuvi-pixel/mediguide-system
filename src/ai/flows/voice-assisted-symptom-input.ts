'use server';
/**
 * @fileOverview This file defines a Genkit flow for handling voice-assisted symptom input and providing medicine recommendations.
 *
 * The flow takes user input (either text or voice) in English or Tamil, predicts possible diseases/conditions,
 * and recommends ONE most suitable medicine. It no longer handles Text-to-Speech.
 *
 * - voiceAssistedSymptomInput - A function that handles the voice-assisted symptom input process.
 * - VoiceAssistedSymptomInputType - The input type for the voiceAssistedSymptomInput function.
 * - VoiceAssistedSymptomOutputType - The return type for the voiceAssistedSymptomInput function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VoiceAssistedSymptomInputSchema = z.object({
  symptoms: z.string().describe('The symptoms described by the user.'),
  language: z.enum(['en', 'ta']).describe('The language of the symptoms (en: English, ta: Tamil).'),
});
export type VoiceAssistedSymptomInputType = z.infer<typeof VoiceAssistedSymptomInputSchema>;

const VoiceAssistedSymptomOutputSchema = z.object({
  predictedDisease: z.string().describe('The predicted disease/condition based on the symptoms.'),
  recommendedMedicine: z.string().describe('The single most suitable medicine recommended.'),
  medicineDosage: z.string().describe('Dosage instructions for the recommended medicine.'),
  medicineSideEffects: z.string().describe('Possible side effects of the recommended medicine.'),
  medicinePrecautions: z.string().describe('Precautions to take while using the recommended medicine.'),
});
export type VoiceAssistedSymptomOutputType = z.infer<typeof VoiceAssistedSymptomOutputSchema>;


export async function voiceAssistedSymptomInput(input: VoiceAssistedSymptomInputType): Promise<VoiceAssistedSymptomOutputType> {
  return voiceAssistedSymptomInputFlow(input);
}

const symptomAnalysisPrompt = ai.definePrompt({
  name: 'symptomAnalysisPrompt',
  input: {schema: VoiceAssistedSymptomInputSchema},
  output: {schema: VoiceAssistedSymptomOutputSchema},
  prompt: `You are a medical assistant providing information and recommendations based on user-provided symptoms.

  Analyze the following symptoms provided by the user:
  Symptoms: {{{symptoms}}}
  Language: {{{language}}}

  Based on these symptoms, predict the most likely disease or condition.  Then, recommend ONE most suitable medicine, along with its dosage, side effects, and precautions.
  
  Please provide the response in the same language as the input.`,
});

const voiceAssistedSymptomInputFlow = ai.defineFlow(
  {
    name: 'voiceAssistedSymptomInputFlow',
    inputSchema: VoiceAssistedSymptomInputSchema,
    outputSchema: VoiceAssistedSymptomOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: symptomAnalysisPrompt,
      input,
    });
    
    if (!output) {
      throw new Error('Symptom analysis failed.');
    }
    
    return output;
  }
);
