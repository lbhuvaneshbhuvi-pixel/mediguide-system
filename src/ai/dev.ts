import { config } from 'dotenv';
config();

import '@/ai/flows/voice-assisted-symptom-input.ts';
import '@/ai/flows/symptom-to-medicine-recommendation.ts';
import '@/ai/flows/bilingual-medicine-info.ts';
import '@/ai/flows/translate-text.ts';
import '@/ai/flows/batch-translate-text';
