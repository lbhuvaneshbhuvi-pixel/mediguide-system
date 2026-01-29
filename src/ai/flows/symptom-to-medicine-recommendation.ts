// Symptom-to-medicine-recommendation.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for recommending the most suitable medicine based on user-provided symptoms.
 *
 * - symptomToMedicineRecommendation - A function that takes user symptoms as input and returns a medicine recommendation.
 * - SymptomToMedicineRecommendationInput - The input type for the symptomToMedicineRecommendation function.
 * - SymptomToMedicineRecommendationOutput - The return type for the symptomToMedicineRecommendation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SymptomToMedicineRecommendationInputSchema = z.object({
  symptoms: z
    .string()
    .describe('The symptoms described by the user, in English or Tamil.'),
  language: z.enum(['en', 'ta']).describe('The language of the symptoms.'),
  includeAlternatives: z
    .boolean()
    .describe(
      'Whether to include alternative medicines in the recommendation. If true, the model will include alternative options in the response.'
    ),
});
export type SymptomToMedicineRecommendationInput = z.infer<
  typeof SymptomToMedicineRecommendationInputSchema
>;

const MedicineDetailsSchema = z.object({
  name: z.string().describe('The name of the medicine.'),
  dosage: z.string().describe('The recommended dosage of the medicine.'),
  sideEffects: z.string().describe('The possible side effects of the medicine.'),
  precautions: z.string().describe('The precautions to take while using the medicine.'),
  manufacturer: z.string().describe('The manufacturing company of the medicine.'),
});

const SymptomToMedicineRecommendationOutputSchema = z.object({
  disease: z.string().describe('The predicted disease or condition.'),
  recommendedMedicine: MedicineDetailsSchema.describe(
    'The most suitable medicine recommendation.'
  ),
  alternatives: z
    .array(MedicineDetailsSchema)
    .optional()
    .describe('Alternative medicine recommendations, if requested.'),
  language: z
    .enum(['en', 'ta'])
    .describe('The language of the recommendation (same as input).'),
});
export type SymptomToMedicineRecommendationOutput = z.infer<
  typeof SymptomToMedicineRecommendationOutputSchema
>;

export async function symptomToMedicineRecommendation(
  input: SymptomToMedicineRecommendationInput
): Promise<SymptomToMedicineRecommendationOutput> {
  return symptomToMedicineRecommendationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'symptomToMedicineRecommendationPrompt',
  input: {schema: SymptomToMedicineRecommendationInputSchema},
  output: {schema: SymptomToMedicineRecommendationOutputSchema},
  prompt: `You are an AI-powered medical assistant that helps users understand their treatment options.

  Based on the user's symptoms, you will predict the most likely disease or condition and recommend the most suitable medicine.
  You will also provide the dosage, side effects, and precautions for the recommended medicine.
  The user may also request alternative medicines.

  Symptoms: {{{symptoms}}}
  Language: {{{language}}}
  Include Alternatives: {{{includeAlternatives}}}

  Output in the same language as the symptoms.

  Here's the structure for the output:
  {
    "disease": "predicted disease",
    "recommendedMedicine": {
      "name": "medicine name",
      "dosage": "dosage details",
      "sideEffects": "side effects details",
      "precautions": "precautions details",
      "manufacturer": "manufacturer details"
    },
    "alternatives": [
      {
        "name": "alternative medicine name",
        "dosage": "dosage details",
        "sideEffects": "side effects details",
        "precautions": "precautions details",
        "manufacturer": "manufacturer details"
      }
    ]
  }`,
});

const symptomToMedicineRecommendationFlow = ai.defineFlow(
  {
    name: 'symptomToMedicineRecommendationFlow',
    inputSchema: SymptomToMedicineRecommendationInputSchema,
    outputSchema: SymptomToMedicineRecommendationOutputSchema,
  },
  async input => {
    // Retry wrapper with exponential backoff for transient API errors (model overloaded / 503)
    async function callWithRetries<T>(fn: () => Promise<T>, retries = 8, delayMs = 3000): Promise<T> {
      let attempt = 0;
      let lastErr: any;
      while (attempt < retries) {
        try {
          return await fn();
        } catch (err: any) {
          lastErr = err;
          const msg = (err && err.message) ? err.message : String(err);
          // If it's a retryable error (503 / overloaded / rate limit), wait and retry.
          const isRetryable = /503|overload|overloaded|rate limit|Too Many Requests/i.test(msg) || (err && err.status === 503);
          attempt += 1;
          if (!isRetryable || attempt >= retries) break;
          const wait = delayMs * Math.pow(2, attempt - 1);
          // Add jitter to prevent thundering herd
          const jitter = Math.floor(Math.random() * 2000);
          console.log(`Retrying API call (attempt ${attempt}/${retries}) after ${wait + jitter}ms due to: ${msg}`);
          await new Promise(r => setTimeout(r, wait + jitter));
        }
      }
      // If we reach here, throw the last error with extra context
      const e: any = new Error('AI model request failed after retries: ' + (lastErr && lastErr.message ? lastErr.message : String(lastErr)));
      e.cause = lastErr;
      throw e;
    }

    // Fallback mock data when API is unavailable
    function getFallbackData(): SymptomToMedicineRecommendationOutput {
      return {
        disease: 'Common condition (API unavailable)',
        recommendedMedicine: {
          name: 'Consult a healthcare professional',
          dosage: 'N/A',
          sideEffects: 'Please use actual medical consultation',
          precautions: 'Do not self-medicate',
          manufacturer: 'N/A',
        },
        alternatives: [],
        language: input.language,
      };
    }

    try {
      const {output} = await callWithRetries(() => prompt(input), 8, 3000);
      return output!;
    } catch (err: any) {
      if (err.code === 429 || err.status === 429 || (err.message && err.message.includes('Too Many Requests'))) {
        alert("Free AI quota exceeded. Please try again later or upgrade your plan.");
      }
      console.error('AI API failed completely, using fallback data:', err.message);
      // Return fallback data instead of throwing error
      return getFallbackData();
    }
  }
);
