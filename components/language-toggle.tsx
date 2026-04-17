"use client";

import { Button } from "antd";
import { useLanguage } from "@/components/language-provider";

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <Button
      size="small"
      onClick={() => setLanguage(language === "en" ? "hi" : "en")}
      style={{
        borderColor: "rgba(255,255,255,0.4)",
        color: "#fff",
        background: "transparent",
        fontWeight: 600,
        fontSize: 12,
      }}
    >
      {t("switchLang")}
    </Button>
  );
}
