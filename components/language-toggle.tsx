"use client";

import { Button } from "antd";
import { useLanguage } from "@/components/language-provider";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const nextLanguageByCurrent = {
    en: "hi",
    hi: "pa",
    pa: "en",
  } as const;

  const buttonLabelByNextLanguage = {
    en: "English",
    hi: "हिंदी",
    pa: "ਪੰਜਾਬੀ",
  } as const;

  const nextLanguage = nextLanguageByCurrent[language];

  return (
    <Button
      size="small"
      onClick={() => setLanguage(nextLanguage)}
      style={{
        borderColor: "rgba(255,255,255,0.4)",
        color: "#fff",
        background: "transparent",
        fontWeight: 600,
        fontSize: 12,
      }}
    >
      {buttonLabelByNextLanguage[nextLanguage]}
    </Button>
  );
}
