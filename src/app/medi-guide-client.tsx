
"use client";

import { useState, useMemo, type FC, useCallback, useEffect } from 'react';
import {
  symptomToMedicineRecommendation,
  type SymptomToMedicineRecommendationOutput,
} from '@/ai/flows/symptom-to-medicine-recommendation';
import { batchTranslateText, type BatchTranslateTextOutput } from '@/ai/flows/batch-translate-text';
import { translations } from '@/lib/translations';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase/auth/use-user';
import { Bot, Send, X, Volume2, VolumeX } from 'lucide-react';

import { AppHeader } from '@/components/header';
import { AppFooter } from '@/components/footer';
import VoiceInputButton from '@/components/voice-input-button';
import { ResultsDisplay } from '@/components/results-display';
import { LearnAtoZ } from '@/components/learn-a-z';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Language = 'en' | 'ta';

type CustomSymptomToMedicineRecommendationOutput = SymptomToMedicineRecommendationOutput;

type SearchHistoryEntry = { query: string; result?: string; timestamp?: number };

// Basic number -> Tamil words converter for common cases (0-9999)
const TAMIL_SMALL: Record<number, string> = {
  0: 'பூஜ்யம்', 1: 'ஒன்று', 2: 'இரண்டு', 3: 'மூன்று', 4: 'நான்கு', 5: 'ஐந்து', 6: 'ஆறு', 7: 'ஏழு', 8: 'எட்டு', 9: 'ஒன்பது',
  10: 'பத்து', 11: 'பதினொன்று', 12: 'பன்னிரண்டு', 13: 'பதின்மூன்று', 14: 'பதினான்கு', 15: 'பதினைந்து', 16: 'பதினாறு', 17: 'பதினேழு', 18: 'பதினெட்டு', 19: 'பத்தொன்பது',
  20: 'இருபது', 30: 'முப்பது', 40: 'நாற்பது', 50: 'ஐம்பது', 60: 'அறுபது', 70: 'எழுபது', 80: 'எண்பது', 90: 'தொண்ணூறு',
};

function numberToTamil(n: number): string {
  if (!isFinite(n)) return String(n);
  n = Math.floor(n);
  if (n <= 20) return TAMIL_SMALL[n] || String(n);
  if (n < 100) {
    const tens = Math.floor(n / 10) * 10;
    const unit = n % 10;
    return unit === 0 ? (TAMIL_SMALL[tens] || String(n)) : `${TAMIL_SMALL[tens] || String(tens)} ${TAMIL_SMALL[unit] || String(unit)}`;
  }
  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const rem = n % 100;
    const hundredsWord = hundreds === 1 ? 'நூறு' : `${TAMIL_SMALL[hundreds] || String(hundreds)} நூறு`;
    return rem === 0 ? hundredsWord : `${hundredsWord} ${numberToTamil(rem)}`;
  }
  if (n < 1000000) {
    const thousands = Math.floor(n / 1000);
    const rem = n % 1000;
    const thousandsWord = thousands === 1 ? 'ஆயிரம்' : `${numberToTamil(thousands)} ஆயிரம்`;
    return rem === 0 ? thousandsWord : `${thousandsWord} ${numberToTamil(rem)}`;
  }
  // fallback
  return String(n);
}

function expandNumbersToTamil(text: string): string {
  if (!text) return text;
  // replace decimals first
  return text.replace(/\d+(?:\.\d+)?/g, (match) => {
    if (match.includes('.')) {
      const [intPart, decPart] = match.split('.');
      const intWords = numberToTamil(Number(intPart));
      const decDigits = decPart.split('').map(d => TAMIL_SMALL[Number(d)] || d).join(' ');
      return `${intWords} புள்ளி ${decDigits}`;
    }
    return numberToTamil(Number(match));
  });
}

// localStorage helpers for persistent search history
const SEARCH_HISTORY_KEY = 'medi_search_history_local';
const PENDING_SYNCS_KEY = 'medi_pending_syncs';
const TTS_AUTO_SPEAK_KEY = 'medi_tts_auto_speak';
const TTS_SPEAK_BOTH_KEY = 'medi_tts_speak_both';

function loadLocalSearchHistory(): SearchHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.warn('Failed to load search history from localStorage:', e);
    return [];
  }
}

function saveLocalSearchHistory(history: SearchHistoryEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.warn('Failed to save search history to localStorage:', e);
  }
  
}

function savePendingSync(entry: SearchHistoryEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const pending = localStorage.getItem(PENDING_SYNCS_KEY);
    const pendingList: SearchHistoryEntry[] = pending ? JSON.parse(pending) : [];
    pendingList.push(entry);
    localStorage.setItem(PENDING_SYNCS_KEY, JSON.stringify(pendingList));
  } catch (e) {
    console.warn('Failed to save pending sync:', e);
  }
}

function getPendingSyncs(): SearchHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const pending = localStorage.getItem(PENDING_SYNCS_KEY);
    return pending ? JSON.parse(pending) : [];
  } catch (e) {
    console.warn('Failed to get pending syncs:', e);
    return [];
  }
}

function clearPendingSyncs(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PENDING_SYNCS_KEY);
  } catch (e) {
    console.warn('Failed to clear pending syncs:', e);
  }
}

// Safe stringify that tolerates circular structures
function safeStringify(obj: unknown) {
  try {
    const seen = new WeakSet();
    return JSON.stringify(obj, (_key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return '[Circular]';
        seen.add(value);
      }
      return value;
    }, 2);
  } catch (e) {
    try { return String(obj); } catch (_) { return '[unserializable]'; }
  }
}

// Robust logger: attempts structured logging but falls back safely if console methods misbehave
function safeLog(level: 'error' | 'warn' | 'log', label: string, details?: unknown) {
  try {
    if (typeof console === 'undefined') return;
    const fn = (console as any)[level] || console.log;
    try {
      // Try logging the details object directly first (most browsers handle this)
      if (typeof details !== 'undefined') fn(label, details);
      else fn(label);
    } catch (_err) {
      // Fallback to a stringified version if the console can't handle the object
      if (typeof details !== 'undefined') fn(label, safeStringify(details));
      else fn(label);
    }
  } catch (_err) {
    // swallow all logging errors to avoid breaking the app
  }
}


const MediGuideClient: FC = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [symptoms, setSymptoms] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [results, setResults] =
    useState<CustomSymptomToMedicineRecommendationOutput | null>(null);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const v = localStorage.getItem(TTS_AUTO_SPEAK_KEY);
      return v === 'true';
    } catch (e) {
      return false;
    }
  });
  const [speakBoth, setSpeakBoth] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const v = localStorage.getItem(TTS_SPEAK_BOTH_KEY);
      return v === 'true';
    } catch (e) {
      return false;
    }
  });

  const { toast } = useToast();
  const { user } = useUser();
  const t = useMemo(() => translations[language], [language]);
  const [showVoices, setShowVoices] = useState(false);
  const [voicesList, setVoicesList] = useState<Array<{ name?: string; lang?: string; default?: boolean }>>([]);
  
    // Dashboard Features State - initialize from localStorage
    const [feedbackText, setFeedbackText] = useState('');
    const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>(() => loadLocalSearchHistory());
    const [showDashboard, setShowDashboard] = useState(false);
    const [dashboardLoading, setDashboardLoading] = useState(false);
    const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [nearbyDoctors, setNearbyDoctors] = useState<any[]>([]);
    const [loadingDoctors, setLoadingDoctors] = useState(false);

  // When user logs in, sync any pending searches to server
  useEffect(() => {
    const syncPendingSearches = async () => {
      if (!user) return;
      const pending = getPendingSyncs();
      if (pending.length === 0) return;

      try {
        const idToken = await user.getIdToken();
        let successCount = 0;
        for (const entry of pending) {
          try {
            const response = await fetch('/api/search-history', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
              },
              body: JSON.stringify({ query: entry.query, result: entry.result }),
            });
            if (response.ok) {
              successCount++;
            }
          } catch (err) {
            console.warn('Failed to sync pending search:', err);
          }
        }
        if (successCount > 0) {
          clearPendingSyncs();
          console.log(`✓ Synced ${successCount} pending searches to server`);
          toast({ title: `Synced ${successCount} searches`, description: 'Your offline searches are now on the server.', variant: 'default' });
        }
      } catch (err) {
        console.warn('Error syncing pending searches:', err);
      }
    };

    syncPendingSearches();
  }, [user, toast]);

  // Persist auto-speak preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(TTS_AUTO_SPEAK_KEY, autoSpeak ? 'true' : 'false');
    } catch (e) {
      // ignore
    }
  }, [autoSpeak]);

  // Persist speak-both preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(TTS_SPEAK_BOTH_KEY, speakBoth ? 'true' : 'false');
    } catch (e) {
      // ignore
    }
  }, [speakBoth]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback((text: string, lang: Language) => {
    stopSpeaking();
  
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      toast({ title: "Speech Not Supported", description: "Your browser does not support text-to-speech.", variant: "destructive" });
      return;
    }
  
    const processSpeech = () => {
      // Expand all numbers to Tamil/English words before creating utterance
      let processedText = text;
      if (lang === 'ta') {
        processedText = expandNumbersToTamil(text);
      }

      const utterance = new SpeechSynthesisUtterance(processedText);

      const voices = window.speechSynthesis.getVoices() || [];

      // For Tamil: prioritize exact 'ta-IN', then any 'ta*', then 'tamil' in name
      let voice: SpeechSynthesisVoice | undefined;
      if (lang === 'ta') {
        voice = voices.find(v => v.lang && v.lang.toLowerCase() === 'ta-in')
          || voices.find(v => v.lang && v.lang.toLowerCase().startsWith('ta'))
          || voices.find(v => v.name && /tamil|ta/i.test(v.name))
          || voices.find(v => v.lang && v.lang.toLowerCase().includes('ta'));
      } else {
        // For English: prefer en-US or en-GB, fallback to any en-*
        voice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('en-us'))
          || voices.find(v => v.lang && v.lang.toLowerCase().startsWith('en-gb'))
          || voices.find(v => v.lang && v.lang.toLowerCase().startsWith('en'))
          || voices[0];
      }

      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang || (lang === 'ta' ? 'ta-IN' : 'en-US');
      } else {
        // No matching voice found — set language tag and log available voices for debugging
        const fallbackLang = lang === 'ta' ? 'ta-IN' : 'en-US';
        utterance.lang = fallbackLang;
        safeLog('warn', `No matching TTS voice found for ${lang}. Falling back to ${fallbackLang}. Available voices:`, voices.map(v => ({ name: v.name, lang: v.lang })));
      }
  
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (ev: any) => {
        // Try to collect as much diagnostic info as possible — some browsers pass empty events
        const voicesNow = (window.speechSynthesis && window.speechSynthesis.getVoices && window.speechSynthesis.getVoices()) || [];
        const errorMessage = ev?.message || (ev?.error && typeof ev.error === 'string' ? ev.error : '') || (ev?.target && (ev.target as any).error) || 'Unknown error';

        // Log diagnostic info for debugging (still tolerant if details are sparse)
        // Use a robust logger to avoid throwing while attempting to print complex event objects
        try {
          if (voicesNow.length === 0) {
            safeLog('warn', `Speech synthesis: no voices available for language '${lang}'`, { message: errorMessage });
          } else {
            safeLog('warn', `Speech synthesis warning for language '${lang}'`, { message: errorMessage, voiceCount: voicesNow.length });
          }
        } catch (_logErr) {
          // swallow logging errors
        }

        // Update voices list state so the UI can show them if requested
        try {
          setVoicesList(voicesNow.map((v: any) => ({ name: v.name, lang: v.lang, default: v.default })));
        } catch {}

        // More helpful toast for users: suggest trying Chrome or enabling system voices
        try {
          if (!voicesNow || voicesNow.length === 0) {
            toast({ title: 'Speech Error', description: 'No speech voices available. Try Chrome or enable system voices, then reload the page.', variant: 'destructive' });
          } else {
            toast({ title: 'Speech Error', description: 'Could not play audio. Check console for voice diagnostics.', variant: 'destructive' });
          }
        } catch (_e) {
          // ignore toast errors
        }

        setIsSpeaking(false);
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        // Some environments may throw synchronously — log and show toast
        safeLog('error', 'SpeechSynthesis.speak() threw an error:', err);
        try {
          toast({ title: 'Speech Error', description: 'Could not start audio playback.', variant: 'destructive' });
        } catch (_e) {}
        setIsSpeaking(false);
      }
    };
  
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = processSpeech;
    } else {
      processSpeech();
    }
  }, [stopSpeaking, toast]);

  // Populate voices list on mount and when voices change
  useEffect(() => {
    const update = () => {
      try {
        const vs = (window.speechSynthesis && window.speechSynthesis.getVoices && window.speechSynthesis.getVoices()) || [];
        setVoicesList(vs.map((v: any) => ({ name: v.name, lang: v.lang, default: v.default })));
      } catch (e) {
        setVoicesList([]);
      }
    };

    update();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.onvoiceschanged = update;
      } catch (e) {}
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try { window.speechSynthesis.onvoiceschanged = null; } catch (e) {}
      }
    };
  }, []);

  // Exposed helpers for voice initialization & refresh. Call these on user action.
  const refreshVoices = () => {
    try {
      const vs = (window.speechSynthesis && window.speechSynthesis.getVoices && window.speechSynthesis.getVoices()) || [];
      setVoicesList(vs.map((v: any) => ({ name: v.name, lang: v.lang, default: v.default })));
      toast({ title: 'Voices refreshed', description: `${vs.length} voices detected`, variant: 'default' });
    } catch (e) {
      toast({ title: 'Could not refresh voices', variant: 'destructive' });
    }
  };

  const initVoices = () => {
    // Some browsers only populate voices after a user gesture. Speak a short harmless phrase to force-init.
    try {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;
      const sample = new SpeechSynthesisUtterance('Initializing voices');
      sample.lang = 'en-US';
      sample.volume = 0.01; // very quiet
      sample.onend = () => {
        refreshVoices();
      };
      window.speechSynthesis.speak(sample);
    } catch (e) {
      toast({ title: 'TTS Init Failed', description: 'Could not initialize speech synthesis.', variant: 'destructive' });
    }
  };

  // Ensure a voice for the requested language exists. If not present, attempt an init and poll briefly.
  const ensureVoiceForLang = async (lang: Language, timeoutMs = 2000): Promise<boolean> => {
    const check = () => {
      try {
        const vs = (window.speechSynthesis && window.speechSynthesis.getVoices && window.speechSynthesis.getVoices()) || [];
        return vs.some((v: any) => {
          if (!v || !v.lang) return false;
          const l = v.lang.toLowerCase();
          if (lang === 'ta') return l.includes('ta');
          if (lang === 'en') return l.includes('en');
          return false;
        });
      } catch (e) {
        return false;
      }
    };

    if (typeof window === 'undefined' || !window.speechSynthesis) return false;
    if (check()) return true;

    // Try to init voices via a user-gesture mini utterance
    try { initVoices(); } catch {}

    const start = Date.now();
    // Poll until timeout
    while (Date.now() - start < timeoutMs) {
      await new Promise(res => setTimeout(res, 200));
      if (check()) return true;
    }
    return check();
  };


  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!symptoms.trim() || isLoading) return;

    setIsLoading(true);
    setResults(null);
    stopSpeaking();

    try {
      // Always request in English first for consistency
      const response = await symptomToMedicineRecommendation({
        symptoms,
        language: 'en',
        includeAlternatives: true,
      });

      if (!response) {
        toast({ title: t.noResults, variant: 'destructive' });
        return;
      }

      // If user selected Tamil, translate the entire response
      let finalResponse = response;
      if (language === 'ta') {
        try {
          const textsToTranslate = [
            response.disease || '',
            response.recommendedMedicine?.name || '',
            response.recommendedMedicine?.dosage || '',
            response.recommendedMedicine?.sideEffects || '',
            response.recommendedMedicine?.precautions || '',
            response.recommendedMedicine?.manufacturer || '',
          ].filter(Boolean);

          const altTexts = response.alternatives?.map(a => `${a.name}|${a.dosage}|${a.sideEffects}|${a.precautions}|${a.manufacturer}`).filter(Boolean) || [];
          
          if (textsToTranslate.length > 0 || altTexts.length > 0) {
            const allTexts = [...textsToTranslate, ...altTexts];
            const translateResponse = await batchTranslateText({
              texts: allTexts,
              targetLanguage: 'ta',
            });
            console.log('Tamil translation response:', translateResponse.translatedTexts);
            if (translateResponse?.translatedTexts?.length > 0 && translateResponse.translatedTexts.some(t => /[\u0B80-\u0BFF]/.test(t))) {
              const translated = translateResponse.translatedTexts;
              let idx = 0;
              // Apply main result translations
              finalResponse = {
                ...response,
                language: 'ta',
                disease: translated[idx] || response.disease,
                recommendedMedicine: {
                  ...response.recommendedMedicine,
                  name: translated[idx + 1] || response.recommendedMedicine.name,
                  dosage: translated[idx + 2] || response.recommendedMedicine.dosage,
                  sideEffects: translated[idx + 3] || response.recommendedMedicine.sideEffects,
                  precautions: translated[idx + 4] || response.recommendedMedicine.precautions,
                  manufacturer: translated[idx + 5] || response.recommendedMedicine.manufacturer,
                },
              };
              idx = textsToTranslate.length;
              // Apply alternative translations
              if (response.alternatives && response.alternatives.length > 0 && idx < translated.length) {
                finalResponse.alternatives = response.alternatives.map((alt, altIdx) => {
                  if (idx < translated.length) {
                    const parts = translated[idx].split('|');
                    idx++;
                    return {
                      ...alt,
                      name: parts[0]?.trim() || alt.name,
                      dosage: parts[1]?.trim() || alt.dosage,
                      sideEffects: parts[2]?.trim() || alt.sideEffects,
                      precautions: parts[3]?.trim() || alt.precautions,
                      manufacturer: parts[4]?.trim() || alt.manufacturer,
                    };
                  }
                  return alt;
                });
              }
            } else {
              toast({ title: t.translationError, description: '', variant: 'destructive' });
            }
          }
        } catch (transErr) {
          console.warn('Failed to translate results to Tamil:', transErr);
          // Keep English response as fallback
        }
      }

      setResults(finalResponse);

      // Auto-speak when results arrive (if enabled)
      if (autoSpeak) {
        const { disease, recommendedMedicine } = finalResponse as any;
        let baseText = `
          ${t.predictedDisease}: ${disease}.
          ${t.recommendedMedicine}: ${recommendedMedicine?.name}.
          ${t.dosage}: ${recommendedMedicine?.dosage}.
          ${t.sideEffects}: ${recommendedMedicine?.sideEffects}.
          ${t.precautions}: ${recommendedMedicine?.precautions}.
        `;

        // Always expand numbers for the current language before speaking
        if (language === 'ta') {
          baseText = expandNumbersToTamil(baseText);
        }

        // Small timeout to let UI update before playing
        setTimeout(async () => {
          try {
            if (speakBoth) {
              // Play the current language first
              speak(baseText, language);

              // Then translate to the other language and play it
              const targetLang: Language = language === 'en' ? 'ta' : 'en';
              try {
                const translateResponse = await batchTranslateText({ texts: [baseText], targetLanguage: targetLang });
                const translated = translateResponse.translatedTexts?.[0];
                if (translated) {
                  const out = targetLang === 'ta' ? expandNumbersToTamil(translated) : translated;
                  // Ensure voices for the target language are available (init if needed)
                  const avail = await ensureVoiceForLang(targetLang);
                  if (!avail && targetLang === 'ta') {
                    toast({ title: 'Tamil voice not available', description: 'Could not find a Tamil voice. Try Init TTS or install Tamil system voices.', variant: 'destructive' });
                  }
                  // small delay to separate the two utterances
                  await new Promise(r => setTimeout(r, 350));
                  speak(out, targetLang);
                }
              } catch (translateErr) {
                console.warn('TTS translation failed:', translateErr);
              }
            } else {
              speak(baseText, language);
            }
          } catch (e) {
            console.warn('Auto-speak error:', e);
          }
        }, 150);
      }

      // Auto-save search to history (best-effort)
      try {
        await saveSearchToDatabase(symptoms, response.disease);
      } catch (saveErr) {
        console.warn('Failed to auto-save search:', saveErr);
      }

      // Auto-save medicine details to /api/medicines
      try {
        const med = finalResponse.recommendedMedicine;
        if (med && med.name) {
          await fetch('/api/medicines', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: med.name,
              dosage: med.dosage,
              sideEffects: med.sideEffects,
              precautions: med.precautions,
              alternatives: finalResponse.alternatives?.map(a => a.name).join(', ') || '',
              description: finalResponse.disease || ''
            })
          });
        }
      } catch (err) {
        console.warn('Failed to save medicine to DB:', err);
      }
    } catch (error) {
      console.error(error);
      toast({ title: t.error, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSearchToDatabase = async (query: string, result: string) => {
    const entry: SearchHistoryEntry = { query, result, timestamp: Date.now() };
    
    // Always save locally first
    setSearchHistory(prev => {
      const updated = [entry, ...prev].slice(0, 50);
      saveLocalSearchHistory(updated);
      return updated;
    });
    
    try {
      if (!user) {
        // Not logged in: save to pending syncs so it syncs when user logs back in
        savePendingSync(entry);
        console.log('Search saved locally (will sync when you log in)');
        toast({ title: 'Saved locally', description: 'This search will sync to your account when you sign in.', variant: 'default' });
        return;
      }
      
      const idToken = await user.getIdToken();
      const response = await fetch('/api/search-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ query, result }),
      });

      if (response.ok) {
        console.log('✓ Search saved to server');
        toast({ title: 'Saved', description: 'Search saved to your history.', variant: 'default' });
      } else if (response.status === 401) {
        const err = await response.text();
        console.warn('Unauthorized saving search:', err);
        // Save to pending for later sync
        savePendingSync(entry);
        toast({ title: 'Saved locally', description: 'Will sync when you sign in again.', variant: 'destructive' });
      } else {
        const err = await response.text();
        console.warn('Failed to save search:', response.status, err);
        savePendingSync(entry);
        toast({ title: 'Saved locally', description: 'Will sync to server when connection is restored.', variant: 'destructive' });
      }
    } catch (err) {
      console.warn('Could not save to search history:', err);
      savePendingSync(entry);
      toast({ title: 'Network Error', description: 'Search saved locally. Will sync when online.', variant: 'destructive' });
    }
  };

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else if (results) {
        const { disease, recommendedMedicine } = results as SymptomToMedicineRecommendationOutput;
        const resLang = results.language || language;
        let textToSpeak = `
          ${t.predictedDisease}: ${disease}.
          ${t.recommendedMedicine}: ${recommendedMedicine.name}.
          ${t.dosage}: ${recommendedMedicine.dosage}.
          ${t.sideEffects}: ${recommendedMedicine.sideEffects}.
          ${t.precautions}: ${recommendedMedicine.precautions}.
        `;

        // Expand numbers for Tamil before speaking
        if (resLang === 'ta' || language === 'ta') {
          textToSpeak = expandNumbersToTamil(textToSpeak);
        }

        if (speakBoth) {
          // speak current language
          speak(textToSpeak, (resLang as Language) || language);
          // translate to other language and speak
          const targetLang: Language = (resLang === 'en' || language === 'en') ? 'ta' : 'en';
          (async () => {
            try {
              const resp = await batchTranslateText({ texts: [textToSpeak], targetLanguage: targetLang });
              const translated = resp.translatedTexts?.[0];
              if (translated) {
                // Expand numbers for Tamil target language
                const out = targetLang === 'ta' ? expandNumbersToTamil(translated) : translated;
                const avail = await ensureVoiceForLang(targetLang);
                if (!avail && targetLang === 'ta') {
                  toast({ title: 'Tamil voice not available', description: 'Could not find a Tamil voice. Try Init TTS or install Tamil system voices.', variant: 'destructive' });
                }
                await new Promise(r => setTimeout(r, 700));
                speak(out, targetLang);
              }
            } catch (err) {
              console.warn('Translate+Speak failed:', err);
            }
          })();
        } else {
          speak(textToSpeak, (resLang as Language) || language);
        }
    }
  };
  
  const handleLanguageChange = async (newLanguage: Language) => {
    if (isTranslating || language === newLanguage) return;
  
    const oldLanguage = language;
    setLanguage(newLanguage);
    stopSpeaking();
    setIsTranslating(true);
  
    try {
      const textsToTranslate: string[] = [];
      const symptomIndex = symptoms.trim() ? textsToTranslate.push(symptoms) - 1 : -1;
  
      let resultIndices: any = {};
  
      if (results) {
        const { recommendedMedicine, alternatives } = results;
        resultIndices.disease = textsToTranslate.push(results.disease) - 1;
  
        resultIndices.recommended = {
          name: textsToTranslate.push(recommendedMedicine.name) - 1,
          dosage: textsToTranslate.push(recommendedMedicine.dosage) - 1,
          sideEffects: textsToTranslate.push(recommendedMedicine.sideEffects) - 1,
          precautions: textsToTranslate.push(recommendedMedicine.precautions) - 1,
          manufacturer: textsToTranslate.push(recommendedMedicine.manufacturer) - 1,
        };
  
        if (alternatives && alternatives.length > 0) {
          resultIndices.alternatives = alternatives.map(alt => ({
            name: textsToTranslate.push(alt.name) - 1,
            dosage: textsToTranslate.push(alt.dosage) - 1,
            sideEffects: textsToTranslate.push(alt.sideEffects) - 1,
            precautions: textsToTranslate.push(alt.precautions) - 1,
            manufacturer: textsToTranslate.push(alt.manufacturer) - 1,
          }));
        }
      }
  
      if (textsToTranslate.length > 0) {
        const response: BatchTranslateTextOutput = await batchTranslateText({
          texts: textsToTranslate,
          targetLanguage: newLanguage,
        });
        const { translatedTexts } = response;
  
        if (symptomIndex !== -1) {
          setSymptoms(translatedTexts[symptomIndex]);
        }
  
        if (results && translatedTexts.length > 0 && resultIndices.disease !== undefined) {
          const newResults = { ...(results as SymptomToMedicineRecommendationOutput) };
          newResults.language = newLanguage;
          newResults.disease = translatedTexts[resultIndices.disease];
          
          if(resultIndices.recommended) {
            newResults.recommendedMedicine = {
              name: translatedTexts[resultIndices.recommended.name],
              dosage: translatedTexts[resultIndices.recommended.dosage],
              sideEffects: translatedTexts[resultIndices.recommended.sideEffects],
              precautions: translatedTexts[resultIndices.recommended.precautions],
              manufacturer: translatedTexts[resultIndices.recommended.manufacturer],
            };
          }
  
          if (results.alternatives && resultIndices.alternatives) {
            newResults.alternatives = results.alternatives.map((alt, i) => ({
              ...alt,
              name: translatedTexts[resultIndices.alternatives[i].name],
              dosage: translatedTexts[resultIndices.alternatives[i].dosage],
              sideEffects: translatedTexts[resultIndices.alternatives[i].sideEffects],
              precautions: translatedTexts[resultIndices.alternatives[i].precautions],
              manufacturer: translatedTexts[resultIndices.alternatives[i].manufacturer],
            }));
          }
  
          setResults(newResults);
        }
      }
    } catch (error) {
      console.error("Batch translation error:", error);
      toast({ title: t.translationErrorAll, description: '', variant: "destructive" });
      setLanguage(oldLanguage); // Revert language on major error
    } finally {
      setIsTranslating(false);
    }
  };


    // Profile now managed via header profile dialog; removed local profile save here.

    const sendFeedback = async () => {
      if (!feedbackText.trim()) {
        toast({ title: "Feedback cannot be empty", variant: "destructive" });
        return;
      }
      setDashboardLoading(true);
      try {
        if (!user) {
          toast({ title: "Please sign in to send feedback", variant: "destructive" });
          setDashboardLoading(false);
          return;
        }
        const idToken = await user.getIdToken();
        const res = await fetch('/api/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({ text: feedbackText }),
        });
        if (res.ok) {
          setFeedbackText('');
          toast({ title: "✓ Feedback sent", variant: "default" });
        } else {
          const err = await res.text();
          console.warn('Feedback save failed:', res.status, err);
          toast({ title: "Could not send feedback", description: err, variant: "destructive" });
        }
      } catch (err) {
        console.error('Feedback error:', err);
        toast({ title: "Feedback Error", description: String(err), variant: "destructive" });
      } finally {
        setDashboardLoading(false);
      }
    };

    // Manual save removed: searches are auto-saved after AI results are returned.

    // Simple keyword -> specialty mapping
    const mapSymptomsToSpecialty = (text: string) => {
      const s = text.toLowerCase();
      if (/fever|cold|cough|infection|viral/.test(s)) return 'General Physician';
      if (/ear|nose|throat|hearing|sinus|tonsillitis/.test(s)) return 'ENT';
      if (/chest|heart|palpit|bp|blood pressure|cardiac|heart pain/.test(s)) return 'Cardiologist';
      if (/child|baby|pediatric|infant|kids/.test(s)) return 'Pediatrician';
      if (/skin|rash|derma|eczema|acne/.test(s)) return 'Dermatologist';
      return 'General Physician';
    };

    const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const toRad = (v: number) => (v * Math.PI) / 180;
      const R = 6371; // km
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

  const findNearbyDoctors = async (symptomsText?: string) => {
    setLoadingDoctors(true);
    try {
      const specialty = mapSymptomsToSpecialty(symptomsText || symptoms || '');
      
      // Get user location if not present
      if (!userCoords && navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
              resolve();
            },
            (err) => {
              console.warn('Geolocation denied or unavailable');
              resolve();
            },
            { timeout: 8000 }
          );
        });
      }

      if (!userCoords) {
        toast({ title: 'Location needed', description: 'Please enable location access to find nearby doctors.', variant: 'destructive' });
        setLoadingDoctors(false);
        return;
      }

      // Fetch from server endpoint which calls Google Places API
      const placeType = specialty.toLowerCase().replace(/\s+/g, '');
      const searchType = specialty === 'General Physician' ? 'doctor' : 'doctor'; // Can expand for other types
      
      const response = await fetch(
        `/api/places?lat=${userCoords.lat}&lng=${userCoords.lng}&type=${searchType}&radius=10000`
      );
      
      if (!response.ok) {
        const err = await response.json();
        toast({ title: 'Search failed', description: err.error || 'Could not find nearby places', variant: 'destructive' });
        setLoadingDoctors(false);
        return;
      }

      const data = await response.json();
      setNearbyDoctors(data.results || []);

      if (!data.results || data.results.length === 0) {
        toast({ title: 'No results', description: 'No nearby doctors/hospitals found for your symptoms.', variant: 'default' });
      }
    } catch (e) {
      console.error('Find doctors failed', e);
      toast({ title: 'Error', description: 'Failed to search nearby doctors.', variant: 'destructive' });
    } finally {
      setLoadingDoctors(false);
    }
  };    const clearHistory = () => {
      setSearchHistory([]);
      toast({ title: "✓ History cleared", variant: "default" });
    };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppHeader language={language} setLanguage={handleLanguageChange} />
      <main className="flex-grow">
        <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
          <section className="text-center mb-12">
            <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">
              {t.title}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {t.subtitle}
            </p>
          </section>

          <section className="mb-12">
            <div className="mx-auto w-full max-w-2xl">
              <form
                onSubmit={handleSubmit}
                className="relative rounded-lg border bg-card shadow-lg"
              >
                <Textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder={isRecording ? t.listening : t.placeholder}
                  className="w-full resize-none border-0 bg-transparent px-4 py-4 pr-32 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                  rows={3}
                  disabled={isLoading || isRecording || isTranslating}
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <VoiceInputButton
                    onTranscript={setSymptoms}
                    language={language}
                    isRecording={isRecording}
                    setIsRecording={setIsRecording}
                    disabled={isLoading || isTranslating}
                  />
                  <Button type="submit" size="icon" disabled={isLoading || !(symptoms && typeof symptoms === 'string' && symptoms.trim()) || isTranslating} aria-label={t.search}>
                    <Send />
                  </Button>
                </div>
              </form>
               {isTranslating && (
                <p className="text-center text-sm text-muted-foreground mt-2">Translating...</p>
              )}
            </div>
          </section>
          
          {results && !isLoading && (
            <div className="my-8 flex justify-center">
              <div className="flex items-center gap-3">
                <Button onClick={handleToggleSpeak} variant={isSpeaking ? "destructive" : "outline"}>
                {isSpeaking ? (
                  <>
                    <VolumeX className="mr-2 h-5 w-5" /> Stop Speaking
                  </>
                ) : (
                  <>
                    <Volume2 className="mr-2 h-5 w-5" /> Listen
                  </>
                )}
              </Button>
              
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Auto-speak</Label>
                  <Switch checked={autoSpeak} onCheckedChange={(v: boolean) => setAutoSpeak(v)} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Speak both (EN + TA)</Label>
                  <Switch checked={speakBoth} onCheckedChange={(v: boolean) => setSpeakBoth(v)} />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => setShowVoices(s => !s)}>
                    Voices
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Nearby doctors/hospitals panel */}
          {results && (
            <div className="container mx-auto max-w-4xl px-4 mt-6">
              <div className="rounded-lg border bg-card p-4">
                <h3 className="font-semibold mb-2">Nearby Doctors & Hospitals</h3>
                <p className="text-sm text-muted-foreground mb-3">Find nearby doctors/hospitals based on your symptoms.</p>
                <div className="flex items-center gap-2 mb-4">
                  <Button onClick={() => findNearbyDoctors()} disabled={loadingDoctors}>
                    {loadingDoctors ? 'Finding...' : 'Find Doctors & Hospitals Near Me'}
                  </Button>
                  <Button variant="outline" onClick={() => findNearbyDoctors(symptoms)} disabled={loadingDoctors}>
                    Use Current Symptoms
                  </Button>
                </div>

                {nearbyDoctors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No nearby matches yet. Click "Find Doctors & Hospitals Near Me" to search.</p>
                ) : (
                  <div className="space-y-3">
                    {nearbyDoctors.map((d: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg border bg-gray-50 dark:bg-gray-800">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold">{d.name}</div>
                            <div className="text-sm text-muted-foreground">{d.address}</div>
                            {d.rating && <div className="text-sm">⭐ {d.rating.toFixed(1)} ({d.user_ratings_total || 0} reviews)</div>}
                            {d.openNow !== null && <div className="text-sm">{d.openNow ? '✅ Open now' : '❌ Closed'}</div>}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">{d.phone}</div>
                            <a className="text-sm text-blue-600 hover:underline" href={`tel:${d.phone}`}>Call</a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {showVoices && (
            <div className="container mx-auto max-w-4xl px-4">
              <div className="rounded-lg border bg-card p-4 mt-2">
                <h3 className="font-semibold mb-2">Available TTS Voices</h3>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-muted-foreground">{voicesList.length === 0 ? 'No voices detected.' : `${voicesList.length} voices detected.`}</div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={refreshVoices}>Refresh</Button>
                      <Button size="sm" variant="ghost" onClick={initVoices}>Init TTS</Button>
                    </div>
                  </div>

                  {voicesList.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No voices detected. Try clicking "Init TTS" (requires a user gesture) or use Chrome / enable system voices, then reload.</p>
                  ) : (
                    <>
                      <ul className="text-sm space-y-1 mb-4">
                        {voicesList.map((v, i) => (
                          <li key={i} className={v.lang && /ta/i.test(v.lang) ? 'font-semibold text-green-600 dark:text-green-400' : ''}>
                            {v.name ?? 'unknown'} — {v.lang ?? 'unknown' }{v.default ? ' (default)' : ''}
                          </li>
                        ))}
                      </ul>
                      
                      {/* Check if Tamil voice is missing */}
                      {!voicesList.some(v => v.lang && /ta/i.test(v.lang)) && (
                        <div className="rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3 mt-3">
                          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">📢 Tamil voice not found</p>
                          <p className="text-xs text-amber-800 dark:text-amber-200 mb-2">To enable Tamil speech synthesis, install Tamil language voices on your system:</p>
                          <div className="text-xs space-y-1 text-amber-800 dark:text-amber-200">
                            <p><strong>Windows 10/11:</strong> Settings → Time & Language → Speech → Find "Tamil" in the Language dropdown and add it.</p>
                            <p><strong>macOS:</strong> System Settings → Accessibility → Spoken Content → Click "System Voice" dropdown and look for Tamil voices.</p>
                            <p><strong>Chrome/Edge:</strong> Try using Chrome or Edge browser (better voice support). If still missing, install voices via OS settings above.</p>
                          </div>
                          <Button 
                            onClick={() => {
                              toast({ title: 'Instructions copied', description: 'Follow the steps above to install Tamil voices on your system.', variant: 'default' });
                            }}
                            size="sm"
                            className="mt-3 bg-amber-600 hover:bg-amber-700"
                          >
                            ℹ️ Got it
                          </Button>
                        </div>
                      )}
                    </>
                  )}
              </div>
            </div>
          )}

          {/* Dashboard Features Section with Icons */}
          <section className="my-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      {/* Profile Editing moved to header profile icon. */}

                      {/* Feedback Submission Card */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="h-auto flex flex-col items-center justify-center p-8 bg-green-50 dark:bg-green-950 hover:bg-green-100 dark:hover:bg-green-900 text-green-900 dark:text-green-100 border-2 border-green-200 dark:border-green-800 cursor-pointer transition-all">
                            <div className="text-5xl mb-2">💬</div>
                            <div className="font-bold text-lg">Feedback</div>
                            <div className="text-sm mt-1">Share your thoughts</div>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>💬 Feedback Submission</DialogTitle>
                            <DialogDescription>Share your thoughts and help us improve</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <textarea 
                              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none dark:bg-gray-800 dark:text-white dark:border-gray-700" 
                              rows={5} 
                              value={feedbackText} 
                              onChange={e => setFeedbackText(e.target.value)}
                              placeholder="Write your feedback here..."
                              disabled={dashboardLoading}
                            />
                            <Button 
                              onClick={sendFeedback}
                              disabled={dashboardLoading}
                              className="w-full bg-green-600 hover:bg-green-700"
                            >
                              {dashboardLoading ? "Sending..." : "📤 Send Feedback"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Search History Card */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="h-auto flex flex-col items-center justify-center p-8 bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-900 dark:text-indigo-100 border-2 border-indigo-200 dark:border-indigo-800 cursor-pointer transition-all">
                            <div className="text-5xl mb-2">📋</div>
                            <div className="font-bold text-lg">Search History</div>
                            <div className="text-sm mt-1">{searchHistory.length} searches saved</div>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-96 overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>📋 Search History</DialogTitle>
                            <DialogDescription>Your past searches and medical queries</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            {searchHistory.length === 0 ? (
                              <div className="text-center py-8">
                                <p className="text-gray-500 dark:text-gray-400 text-lg">No search history yet</p>
                                <p className="text-gray-400 text-sm">Start by searching for a symptom above</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {searchHistory.map((item, i) => (
                                  <div key={i} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div className="font-semibold text-gray-900 dark:text-white mb-1">
                                      🔍 {item.query}
                                    </div>
                                    {item.result && (
                                      <div className="text-sm text-gray-600 dark:text-gray-400">
                                        ✅ {item.result}
                                      </div>
                                    )}
                                    <div className="mt-2 flex items-center gap-2">
                                      <Button
                                        onClick={() => {
                                          const text = `Query: ${item.query}. ${item.result ? `Result: ${item.result}.` : ''}`;
                                          const uiLang = language;
                                          // Expand numbers for Tamil UI language
                                          const base = uiLang === 'ta' ? expandNumbersToTamil(text) : text;
                                          if (speakBoth) {
                                            // speak UI language first
                                            speak(base, uiLang);
                                            const targetLang: Language = uiLang === 'en' ? 'ta' : 'en';
                                            (async () => {
                                              try {
                                                const resp = await batchTranslateText({ texts: [text], targetLanguage: targetLang });
                                                const translated = resp.translatedTexts?.[0];
                                                if (translated) {
                                                  // Expand numbers for Tamil target language
                                                  const out = targetLang === 'ta' ? expandNumbersToTamil(translated) : translated;
                                                  const avail = await ensureVoiceForLang(targetLang);
                                                  if (!avail && targetLang === 'ta') {
                                                    toast({ title: 'Tamil voice not available', description: 'Could not find a Tamil voice. Try Init TTS or install Tamil system voices.', variant: 'destructive' });
                                                  }
                                                  await new Promise(r => setTimeout(r, 250));
                                                  speak(out, targetLang);
                                                }
                                              } catch (err) {
                                                console.warn('Translate failed for history speak:', err);
                                              }
                                            })();
                                          } else {
                                            speak(base, uiLang);
                                          }
                                        }}
                                        variant="outline"
                                        size="sm"
                                      >
                                        <Volume2 className="mr-2 h-4 w-4" /> Speak
                                      </Button>                                      {/* Dedicated Tamil speak button: translates (if needed) and plays Tamil audio */}
                                      <Button
                                        onClick={async () => {
                                          const text = `Query: ${item.query}. ${item.result ? `Result: ${item.result}.` : ''}`;
                                          try {
                                            // If UI is already Tamil, just expand and speak
                                            if (language === 'ta') {
                                              const out = expandNumbersToTamil(text);
                                              speak(out, 'ta');
                                            } else {
                                              // Translate to Tamil then expand numbers and speak
                                              const resp = await batchTranslateText({ texts: [text], targetLanguage: 'ta' });
                                              const translated = resp.translatedTexts?.[0] || text;
                                              // Expand numbers in the translated Tamil text
                                              const out = expandNumbersToTamil(translated);
                                              speak(out, 'ta');
                                            }
                                          } catch (err) {
                                            console.warn('Speak (TA) failed:', err);
                                            toast({ title: 'TTS Error', description: 'Could not speak in Tamil. Check voices or try Init TTS.', variant: 'destructive' });
                                          }
                                        }}
                                        variant="ghost"
                                        size="sm"
                                      >
                                        <span className="mr-2">🗣️</span> Speak (TA)
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {searchHistory.length > 0 && (
                              <Button 
                                onClick={clearHistory}
                                disabled={dashboardLoading}
                                variant="outline"
                                className="w-full text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                              >
                                🗑️ Clear History
                              </Button>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Searches are auto-saved when AI results are produced. */}
                  </section>

          <section className="my-12 text-center">
            <p className="mt-4 text-lg text-muted-foreground">
              {t.interactiveHint}
            </p>
            <div className="mt-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>{t.learnAtoZ.title}</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t.learnAtoZ.title}</DialogTitle>
                  </DialogHeader>
                  <LearnAtoZ language={language} />
                  <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </DialogClose>
                </DialogContent>
              </Dialog>
            </div>
          </section>

          <ResultsDisplay
            isLoading={isLoading}
            results={results}
            translations={t as any}
          />
        </div>
      </main>
      <AppFooter language={language} />
    </div>
  );
};

export default MediGuideClient;
