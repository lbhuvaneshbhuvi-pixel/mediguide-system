"use client";

import React, { useEffect, useState } from "react";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { translations } from "@/lib/translations";

type Language = 'en' | 'ta';

async function fetchProfile(uid: string, idToken: string) {
  try {
    const res = await fetch(`/api/users`, { 
      headers: { 
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      } 
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("Error fetching profile:", res.status, err);
      return null;
    }
    return res.json();
  } catch (e) {
    console.error("Error fetching profile:", e);
    return null;
  }
}

async function saveProfileApi(payload: any, token: string) {
  try {
    const body = { 
      id: payload.id,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      theme: payload.theme
    };
    const res = await fetch(`/api/users`, { 
      method: "POST", 
      body: JSON.stringify(body), 
      headers: { 
        "content-type": "application/json", 
        Authorization: `Bearer ${token}`
      } 
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("API error:", res.status, err);
      throw new Error(`API error: ${res.status}`);
    }
    return res.json();
  } catch (e) {
    console.error("Error saving profile:", e);
    throw e;
  }
}



async function saveSearchApi(payload: any, token: string) {
  try {
    const body = { 
      userId: payload.userId,
      query: payload.query,
      result: payload.result || null
    };
    const res = await fetch(`/api/search-history`, { 
      method: 'POST', 
      body: JSON.stringify(body), 
      headers: { 
        'content-type': 'application/json', 
        Authorization: `Bearer ${token}`
      } 
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("API error:", res.status, err);
      throw new Error(`API error: ${res.status}`);
    }
    return res.json();
  } catch (e) {
    console.error("Error saving search:", e);
    throw e;
  }
}

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [language, setLanguage] = useState<Language>('en');

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const auth = useAuth();
  const router = useRouter();
  const [feedbackText, setFeedbackText] = useState("");
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");
  const [loading, setLoading] = useState(false);
  const [symptomQuery, setSymptomQuery] = useState('');
  const [aiResult, setAiResult] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const idToken = await user.getIdToken();
        const profile = await fetchProfile(user.uid, idToken);
        if (profile) {
          setFirstName(profile.firstName || "");
          setLastName(profile.lastName || "");
          setTheme(profile.theme || "system");
        }
      } catch (e) {
        console.error("Error loading dashboard:", e);
        toast({ title: "Error loading data", description: String(e), variant: "destructive" });
      }
    })();
  }, [user, toast]);

  const saveProfile = async () => {
    if (!user) return toast({ title: "Not signed in" });
    try {
      setLoading(true);
      const token = await user.getIdToken();
      await saveProfileApi({ id: user.uid, email: user.email, firstName, lastName, theme }, token);
      toast({ title: "✓ Profile saved successfully", variant: "default" });
    } catch (e) {
      toast({ title: "Error saving profile", description: String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const sendFeedback = async () => {
    // Feedback is handled from the profile dialog. Keep this stub for compatibility.
    toast({ title: 'Use the Profile menu to send feedback', variant: 'default' });
  };

  const saveSearch = async () => {
    if (!user) return toast({ title: "Not signed in" });
    if (!symptomQuery.trim()) return toast({ title: "Please describe your symptoms", variant: "destructive" });
    try {
      setLoading(true);
      const token = await user.getIdToken();
      await saveSearchApi({ userId: user.uid, query: symptomQuery, result: aiResult || null }, token);
      setSymptomQuery('');
      setAiResult('');
      toast({ title: "✓ Search saved", variant: "default" });
    } catch (e) {
      toast({ title: "Error saving search", description: String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    // History management available in profile dialog
    toast({ title: 'Manage history from your Profile menu', variant: 'default' });
  };

  const applyTheme = async (t: "system" | "light" | "dark") => {
    setTheme(t);
    if (t === "system") {
      document.documentElement.classList.remove("dark");
    } else if (t === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    // persist to profile if signed in
    if (user) {
      try {
        const token = await user.getIdToken();
          await saveProfileApi({ id: user.uid, email: user.email, firstName, lastName, theme: t }, token);
      } catch (e) {
        console.error("Error saving theme:", e);
      }
    }
  };

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
        toast({ title: "✓ Logged out successfully", variant: "default" });
        router.push("/auth");
      }
    } catch (e) {
      toast({ title: "Error logging out", description: String(e), variant: "destructive" });
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    const t = translations[language];
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{t.dashboard.accessDenied}</h2>
          <p className="text-gray-600">{t.dashboard.pleaseSignIn}</p>
        </div>
      </div>
    );
  }

  const t = translations[language];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{t.dashboard.title}</h1>
            <p className="text-gray-600 dark:text-gray-300">{t.dashboard.description}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.dashboard.welcome}, {user?.email}</p>
            <Button
              onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
              variant="outline"
              className="mt-2"
            >
              {language === 'en' ? 'Tamil (தமிழ்)' : 'English'}
            </Button>
          </div>
        </div>

        {/* Features Status Section */}
        <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
          <CardHeader className="border-b">
            <CardTitle className="text-2xl">{t.dashboard.featureStatus}</CardTitle>
            <CardDescription>{t.dashboard.featureStatusDescription}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                <span className="text-2xl">✅</span>
                <span className="font-semibold text-gray-700 dark:text-gray-200">{t.dashboard.profileEditing}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                <span className="text-2xl">✅</span>
                <span className="font-semibold text-gray-700 dark:text-gray-200">{t.dashboard.themeSwitching}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                <span className="text-2xl">✅</span>
                <span className="font-semibold text-gray-700 dark:text-gray-200">{t.dashboard.feedbackSubmission}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                <span className="text-2xl">✅</span>
                <span className="font-semibold text-gray-700 dark:text-gray-200">{t.dashboard.symptomSearch}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                <span className="text-2xl">✅</span>
                <span className="font-semibold text-gray-700 dark:text-gray-200">{t.dashboard.searchHistory}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                <span className="text-2xl">✅</span>
                <span className="font-semibold text-gray-700 dark:text-gray-200">{t.dashboard.responsiveDesign}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg md:col-span-2">
                <span className="text-2xl">✅</span>
                <span className="font-semibold text-gray-700 dark:text-gray-200">{t.dashboard.darkLightSupport}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile actions moved to header profile dialog (removed from dashboard) */}

        {/* Theme Section */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-purple-50 dark:bg-purple-950 border-b">
            <CardTitle className="text-2xl">{t.dashboard.theme}</CardTitle>
            <CardDescription>{t.dashboard.themeDescription}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => applyTheme('system')} 
                variant={theme === 'system' ? 'default' : 'outline'}
                className="px-6 py-2 rounded-lg font-semibold"
                disabled={loading}
              >
                {t.dashboard.system}
              </Button>
              <Button 
                onClick={() => applyTheme('light')} 
                variant={theme === 'light' ? 'default' : 'outline'}
                className="px-6 py-2 rounded-lg font-semibold"
                disabled={loading}
              >
                {t.dashboard.light}
              </Button>
              <Button 
                onClick={() => applyTheme('dark')} 
                variant={theme === 'dark' ? 'default' : 'outline'}
                className="px-6 py-2 rounded-lg font-semibold"
                disabled={loading}
              >
                {t.dashboard.dark}
              </Button>
            </div>
          </CardContent>
        </Card>


        {/* Save Symptom Search Section */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-orange-50 dark:bg-orange-950 border-b">
            <CardTitle className="text-2xl">{t.dashboard.savingSearch}</CardTitle>
            <CardDescription>{t.dashboard.saveSearchDescription}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t.dashboard.describeSSymptoms}</label>
                <Input 
                  placeholder={t.dashboard.symptomsPlaceholder}
                  value={symptomQuery} 
                  onChange={e => setSymptomQuery(e.target.value)}
                  disabled={loading}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.dashboard.aiRecommendation}</label>
                <Input 
                  placeholder={t.dashboard.recommendationPlaceholder}
                  value={aiResult} 
                  onChange={e => setAiResult(e.target.value)}
                  disabled={loading}
                  className="w-full"
                />
              </div>
              <Button 
                onClick={saveSearch}
                disabled={loading}
                className="w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-6 rounded-lg"
              >
                {loading ? t.dashboard.saving : t.dashboard.saveSearch}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feedback & history permanently relocated to profile dialog (removed from dashboard) */}

          {/* Logout Section */}
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button 
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg"
            >
              {t.dashboard.logout}
            </Button>
          </div>
      </div>
    </div>
  );
}
