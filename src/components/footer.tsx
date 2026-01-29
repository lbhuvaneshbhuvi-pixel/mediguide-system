
"use client";

import Link from "next/link";
import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { translations } from "@/lib/translations";
import { Facebook, Twitter, Instagram, Linkedin, X, Star } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { LearnAtoZ } from "./learn-a-z";

type Language = "en" | "ta";

interface FooterProps {
  language: Language;
}

const StarRating = ({ rating, setRating }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-6 w-6 cursor-pointer",
            rating >= star
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-400"
          )}
          onClick={() => setRating(star)}
        />
      ))}
    </div>
  );
};


export const AppFooter = ({ language }: FooterProps) => {
  const t = translations[language].footer;
  const commonT = translations[language];
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");

  const handleFeedbackSubmit = () => {
    // In a real application, you would send this data to a server.
    console.log({ rating, feedbackText });
    toast({
      title: t.feedback.submitSuccessTitle,
      description: t.feedback.submitSuccessMessage,
    });
    setRating(0);
    setFeedbackText("");
  };

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 lg:grid-cols-4">
          <div className="space-y-4 md:col-span-2 lg:col-span-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="link"
                  className="p-0 font-headline text-xl font-bold text-foreground hover:text-primary hover:no-underline"
                >
                  {t.aboutTitle}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.aboutTitle}</DialogTitle>
                </DialogHeader>
                <p>{t.aboutText}</p>
                <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </DialogClose>
              </DialogContent>
            </Dialog>
            <p className="text-sm">{t.aboutText}</p>
            <div className="flex space-x-4">
              <Link href="#" aria-label="Facebook">
                <Facebook className="h-6 w-6 text-muted-foreground hover:text-primary" />
              </Link>
              <Link href="#" aria-label="Twitter">
                <Twitter className="h-6 w-6 text-muted-foreground hover:text-primary" />
              </Link>
              <Link href="#" aria-label="Instagram">
                <Instagram className="h-6 w-6 text-muted-foreground hover:text-primary" />
              </Link>
              <Link href="#" aria-label="LinkedIn">
                <Linkedin className="h-6 w-6 text-muted-foreground hover:text-primary" />
              </Link>
            </div>
          </div>

          <div className="text-left md:text-right">
            <h3 className="mb-4 font-headline text-lg font-semibold text-foreground">
              {t.quickLinks.title}
            </h3>
            <div className="flex flex-col items-start space-y-1 md:items-end">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="link" className="p-0 text-secondary-foreground hover:text-primary">
                    {t.quickLinks.contact.label}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t.quickLinks.contact.title}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2">
                    <p>{t.quickLinks.contact.address}</p>
                    <p>{t.quickLinks.contact.phone}</p>
                    <p>{t.quickLinks.contact.email}</p>
                  </div>
                  <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </DialogClose>
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="link" className="p-0 text-secondary-foreground hover:text-primary">
                    {t.quickLinks.feedback}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t.feedback.title}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="feedback-text">{t.feedback.messageLabel}</Label>
                      <Textarea
                        id="feedback-text"
                        placeholder={t.feedback.messagePlaceholder}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t.feedback.ratingLabel}</Label>
                      <StarRating rating={rating} setRating={setRating} />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">{t.feedback.cancelButton}</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button onClick={handleFeedbackSubmit}>{t.feedback.sendButton}</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="md:col-span-3 lg:col-span-4">
            <h3 className="mb-4 font-headline text-lg font-semibold text-foreground">
              {t.faq.title}
            </h3>
            <Accordion type="single" collapsible className="w-full">
              {t.faq.questions.map((item, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p>&copy; {new Date().getFullYear()} {commonT.title}. {t.rightsReserved}</p>
            <div className="flex gap-4">
              <Dialog>
                <DialogTrigger asChild>
                   <Button variant="link" size="sm" className="p-0 text-muted-foreground hover:text-primary">
                    {t.terms.title}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t.terms.title}</DialogTitle>
                  </DialogHeader>
                  <p>{t.terms.content}</p>
                   <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </DialogClose>
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="link" size="sm" className="p-0 text-muted-foreground hover:text-primary">
                    {t.privacy.title}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t.privacy.title}</DialogTitle>
                  </DialogHeader>
                  <p>{t.privacy.content}</p>
                   <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </DialogClose>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
