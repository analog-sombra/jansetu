"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import en from "@/messages/en.json";
import hi from "@/messages/hi.json";
import pa from "@/messages/pa.json";

type Language = "en" | "hi" | "pa";
const LANGUAGE_STORAGE_KEY = "jansetu_language";

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") {
      return "en";
    }

    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === "en" || saved === "hi" || saved === "pa") {
      return saved;
    }

    return "en";
  });

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const value = useMemo(() => {
    const dictionaryByLanguage: Record<Language, Record<string, string>> = {
      en,
      hi,
      pa,
    };
    const dictionary = dictionaryByLanguage[language];
    return {
      language,
      setLanguage,
      t: (key: string) => dictionary[key] ?? key,
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
