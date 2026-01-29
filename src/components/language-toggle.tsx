"use client";

import type { FC } from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

type Language = 'en' | 'ta';

interface LanguageToggleProps {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const LanguageToggle: FC<LanguageToggleProps> = ({ language, setLanguage }) => {
  return (
    <div className="flex items-center space-x-1 rounded-md bg-secondary p-1">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'px-3',
          language === 'en' && 'bg-background text-primary shadow-sm hover:bg-background'
        )}
        onClick={() => setLanguage('en')}
      >
        EN
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'px-3',
          language === 'ta' && 'bg-background text-primary shadow-sm hover:bg-background'
        )}
        onClick={() => setLanguage('ta')}
      >
        TA
      </Button>
    </div>
  );
};
