"use client";

import { ConfigProvider } from "antd";
import type { ReactNode } from "react";

const govTheme = {
  token: {
    colorPrimary: "#1a3c6e",
    colorSuccess: "#2e7d32",
    colorWarning: "#e07b00",
    colorError: "#c62828",
    colorInfo: "#0277bd",
    borderRadius: 4,
    borderRadiusLG: 6,
    fontFamily: "var(--font-sora), 'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: 14,
    colorBgContainer: "#ffffff",
    colorBgLayout: "#f0f2f5",
    colorLink: "#1a3c6e",
    colorLinkHover: "#1f4d8a",
  },
  components: {
    Button: { borderRadius: 4, fontWeight: 600 } as Record<string, unknown>,
    Input: { borderRadius: 4 } as Record<string, unknown>,
    Select: { borderRadius: 4 } as Record<string, unknown>,
    Card: { borderRadius: 6 } as Record<string, unknown>,
    Table: { borderRadius: 6 } as Record<string, unknown>,
  },
};

export function AntdProvider({ children }: { children: ReactNode }) {
  return <ConfigProvider theme={govTheme}>{children}</ConfigProvider>;
}
