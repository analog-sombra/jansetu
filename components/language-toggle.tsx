"use client";

import { Select } from "antd";
import { useLanguage } from "@/components/language-provider";

type Language = "en" | "hi" | "pa";

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिंदी" },
  { value: "pa", label: "ਪੰਜਾਬੀ" },
];

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <Select
      size="small"
      value={language}
      onChange={(val: Language) => setLanguage(val)}
      options={LANGUAGE_OPTIONS}
      style={{ width: 110 }}
      styles={{
        popup: { root: { minWidth: 110 } },
      }}
      variant="outlined"
      className="lang-select"
    />
  );
}
