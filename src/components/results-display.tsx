"use client";

import type { FC } from "react";
import type { SymptomToMedicineRecommendationOutput } from "@/ai/flows/symptom-to-medicine-recommendation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Pill,
  AlertTriangle,
  BookText,
  FlaskConical,
  Building,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ResultsDisplayProps {
  isLoading: boolean;
  results: SymptomToMedicineRecommendationOutput | null;
  translations: { [key: string]: string };
}

const InfoRow: FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0 text-primary">{icon}</div>
    <div>
      <p className="font-semibold">{label}</p>
      <p className="text-muted-foreground">{value}</p>
    </div>
  </div>
);

export const ResultsDisplay: FC<ResultsDisplayProps> = ({
  isLoading,
  results,
  translations: t,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-5 w-3/4" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  const {
    disease,
    recommendedMedicine,
    alternatives,
  } = results;

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <Card>
        <CardHeader>
          <CardTitle>{t.predictedDisease}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium">{disease}</p>
        </CardContent>
      </Card>

      <Card className="border-2 border-primary shadow-lg">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>{recommendedMedicine.name}</CardTitle>
            <Badge variant="default" className="text-sm">
              {t.recommendedMedicine}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <InfoRow icon={<Pill />} label={t.dosage} value={recommendedMedicine.dosage} />
          <InfoRow icon={<AlertTriangle />} label={t.sideEffects} value={recommendedMedicine.sideEffects} />
          <InfoRow icon={<BookText />} label={t.precautions} value={recommendedMedicine.precautions} />
          <InfoRow icon={<Building />} label="Manufacturer" value={recommendedMedicine.manufacturer} />
        </CardContent>
      </Card>

      {alternatives && alternatives.length > 0 && (
        <div>
          <h3 className="mb-4 font-headline text-2xl font-bold">{t.alternatives}</h3>
          <div className="grid gap-6 md:grid-cols-2">
            {alternatives.map((alt, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FlaskConical className="h-5 w-5 text-muted-foreground" />
                    {alt.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <InfoRow icon={<Pill />} label={t.dosage} value={alt.dosage} />
                  <InfoRow icon={<AlertTriangle />} label={t.sideEffects} value={alt.sideEffects} />
                  <InfoRow icon={<BookText />} label={t.precautions} value={alt.precautions} />
                  <InfoRow icon={<Building />} label="Manufacturer" value={alt.manufacturer} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
