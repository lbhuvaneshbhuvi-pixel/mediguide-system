
"use client";

import { useState } from "react";
import { translations } from "@/lib/translations";
import { Button } from "./ui/button";

type Language = "en" | "ta";

interface LearnAtoZProps {
  language: Language;
}

export const LearnAtoZ = ({ language }: LearnAtoZProps) => {
  const t = translations[language].learnAtoZ;
  const medicineData = t.data;
  const letters = Object.keys(medicineData);
  const [index, setIndex] = useState(0);

  const handleNext = () => {
    setIndex((prevIndex) => (prevIndex + 1) % letters.length);
  };

  const currentLetter = letters[index];
  const currentMedicine = medicineData[currentLetter];

  return (
    <div className="flex flex-col items-center justify-center p-4 text-center bg-card rounded-lg">
      <div className="text-5xl font-bold text-primary">{currentLetter}</div>
      <div className="text-3xl font-semibold my-2">{currentMedicine.word}</div>
      <p className="text-muted-foreground">{currentMedicine.desc}</p>
      <Button onClick={handleNext} className="mt-4">
        {t.nextButton}
      </Button>
    </div>
  );
};
