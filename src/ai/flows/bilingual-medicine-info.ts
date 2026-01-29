'use server';
/**
 * @fileOverview A Genkit flow for retrieving medicine information in both English and Tamil.
 *
 * - getBilingualMedicineInfo - A function that retrieves medicine information in the specified language.
 * - BilingualMedicineInfoInput - The input type for the getBilingualMedicineInfo function.
 * - BilingualMedicineInfoOutput - The return type for the getBilingualMedicineInfo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BilingualMedicineInfoInputSchema = z.object({
  medicineName: z.string().describe('The name of the medicine to retrieve information for.'),
  language: z.enum(['en', 'ta']).describe('The language to retrieve the information in (en for English, ta for Tamil).'),
  includeAlternatives: z.boolean().default(false).describe('Whether to include alternative medicines in the response.'),
});
export type BilingualMedicineInfoInput = z.infer<typeof BilingualMedicineInfoInputSchema>;

const BilingualMedicineInfoOutputSchema = z.object({
  medicineName: z.string().describe('The name of the medicine.'),
  dosage: z.string().describe('The recommended dosage of the medicine in the specified language.'),
  sideEffects: z.string().describe('The possible side effects of the medicine in the specified language.'),
  precautions: z.string().describe('The precautions to take when using the medicine in the specified language.'),
  alternatives: z.array(z.string()).optional().describe('A list of alternative medicines in the specified language, if requested.'),
});
export type BilingualMedicineInfoOutput = z.infer<typeof BilingualMedicineInfoOutputSchema>;

const getMedicineInfo = ai.defineTool({
  name: 'getMedicineInfo',
  description: 'Retrieves medicine information from the database in the specified language.',
  inputSchema: z.object({
    medicineName: z.string().describe('The name of the medicine.'),
    language: z.enum(['en', 'ta']).describe('The language to retrieve the information in (en for English, ta for Tamil).'),
  }),
  outputSchema: z.object({
    medicineName: z.string().describe('The name of the medicine.'),
    dosage: z.string().describe('The recommended dosage of the medicine in the specified language.'),
    sideEffects: z.string().describe('The possible side effects of the medicine in the specified language.'),
    precautions: z.string().describe('The precautions to take when using the medicine in the specified language.'),
  }),
  async resolve(input) {
    // TODO: Implement database retrieval logic here based on medicineName and language.
    // This is a placeholder implementation.
    return {
      medicineName: input.medicineName,
      dosage: `Dosage information for ${input.medicineName} in ${input.language}`,
      sideEffects: `Side effects information for ${input.medicineName} in ${input.language}`,
      precautions: `Precautions for ${input.medicineName} in ${input.language}`,
    };
  },
});


const getAlternativeMedicines = ai.defineTool({
  name: 'getAlternativeMedicines',
  description: 'Retrieves a list of alternative medicines in the specified language.',
  inputSchema: z.object({
    medicineName: z.string().describe('The name of the medicine to find alternatives for.'),
    language: z.enum(['en', 'ta']).describe('The language to retrieve the alternatives in (en for English, ta for Tamil).'),
  }),
  outputSchema: z.array(z.string()).describe('A list of alternative medicines.'),
  async resolve(input) {
    // TODO: Implement database retrieval logic for alternative medicines.
    // This is a placeholder implementation.
    return [`Alternative 1 for ${input.medicineName} in ${input.language}`, `Alternative 2 for ${input.medicineName} in ${input.language}`];
  },
});

const prompt = ai.definePrompt({
  name: 'bilingualMedicineInfoPrompt',
  input: {schema: BilingualMedicineInfoInputSchema},
  output: {schema: BilingualMedicineInfoOutputSchema},
  tools: [getMedicineInfo, getAlternativeMedicines],
  system: `You are a helpful medical assistant that provides information about medicines in either English or Tamil. Use the getMedicineInfo tool to get the core medicine information (dosage, side effects, precautions) in the language requested by the user.  If the user sets includeAlternatives to true, use the getAlternativeMedicines tool to also get a list of alternative medicines.  If includeAlternatives is false, omit alternatives from the output.`, 
  prompt: `Please retrieve information for {{medicineName}} in {{language}}.`
});

export async function getBilingualMedicineInfo(input: BilingualMedicineInfoInput): Promise<BilingualMedicineInfoOutput> {
  return bilingualMedicineInfoFlow(input);
}

const bilingualMedicineInfoFlow = ai.defineFlow(
  {
    name: 'bilingualMedicineInfoFlow',
    inputSchema: BilingualMedicineInfoInputSchema,
    outputSchema: BilingualMedicineInfoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
