
"use client";

import { useEffect, useRef, type FC, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { translations } from '@/lib/translations';
import { Button } from './ui/button';
import { Mic, MicOff } from 'lucide-react';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  language: 'en' | 'ta';
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
  disabled?: boolean;
}

const VoiceInputButton: FC<VoiceInputButtonProps> = ({
  onTranscript,
  language,
  isRecording,
  setIsRecording,
  disabled,
}) => {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();
  const t = translations[language];

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      // The onend event will handle setting isRecording to false
    }
  }, []);

  const startRecording = useCallback(() => {
    if (isRecording || typeof window === 'undefined') {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: t.voiceNotSupported, variant: "destructive" });
      return;
    }

    // Stop any existing instance
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'en' ? 'en-US' : 'ta-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onend = () => {
        setIsRecording(false);
        if (recognitionRef.current === recognition) {
            recognitionRef.current = null;
        }
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
        stopRecording(); // Stop after getting a result
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'aborted') {
          toast({ title: "Voice Error", description: `Could not recognize audio: ${event.error}`, variant: 'destructive' });
        }
        setIsRecording(false);
      };
      
      recognitionRef.current = recognition;
      recognition.start();

    } catch (error) {
       console.error("Failed to start speech recognition:", error);
       toast({ title: "Voice Error", description: "Failed to start microphone.", variant: 'destructive' });
       setIsRecording(false);
    }
  }, [language, onTranscript, setIsRecording, toast, t, isRecording, stopRecording]);
  
  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Cleanup effect
  useEffect(() => {
    // This function will be called when the component unmounts.
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort(); // Use abort for immediate stop
      }
    };
  }, []);


  return (
    <Button
      type="button"
      size="icon"
      variant={isRecording ? 'destructive' : 'outline'}
      onClick={handleToggleRecording}
      disabled={disabled}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
    >
      {isRecording ? <MicOff className="animate-pulse" /> : <Mic />}
    </Button>
  );
};

export default VoiceInputButton;
