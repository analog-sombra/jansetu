import { NextResponse } from "next/server";
import { franc } from "franc-min";
import { requireAdmin } from "@/lib/auth";

type SupportedLanguage = "en" | "hi" | "pa";

const APP_TO_FRANC: Record<SupportedLanguage, string> = {
  en: "eng",
  hi: "hin",
  pa: "pan",
};

// MyMemory language codes
const APP_TO_MYMEMORY: Record<SupportedLanguage, string> = {
  en: "en-GB",
  hi: "hi-IN",
  pa: "pa-IN",
};

function normalizeDetectedLanguage(code: string): SupportedLanguage | "unknown" {
  if (code === "eng") return "en";
  if (code === "hin") return "hi";
  if (code === "pan") return "pa";
  return "unknown";
}

// MyMemory recommends ≤450 chars per request to stay in free tier.
function chunkText(input: string, maxLen = 450): string[] {
  if (input.length <= maxLen) return [input];
  const chunks: string[] = [];
  let remaining = input;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    // Split at sentence/newline boundary closest to the limit.
    let splitAt = maxLen;
    const boundarySearch = remaining.slice(0, maxLen).search(/[\n.!?][^.!?\n]*$/);
    if (boundarySearch > 0) {
      splitAt = boundarySearch + 1;
    }
    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }
  return chunks;
}

async function translateChunk(text: string, from: string, to: string): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`MyMemory HTTP ${response.status}`);
  const data = (await response.json()) as {
    responseStatus: number;
    responseData: { translatedText: string };
  };
  if (data.responseStatus !== 200) throw new Error(`MyMemory status ${data.responseStatus}`);
  return data.responseData.translatedText;
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const text = String(body?.text ?? "").trim();
  const targetLanguage = body?.targetLanguage as SupportedLanguage | undefined;

  if (!text) {
    return NextResponse.json({ ok: true, translatedText: "", translated: false });
  }

  if (!targetLanguage || !(targetLanguage in APP_TO_MYMEMORY)) {
    return NextResponse.json({ error: "Invalid target language" }, { status: 400 });
  }

  // Use a 200-char sample for detection so franc works reliably regardless of text length.
  const sampleForDetection = text.slice(0, 200);
  const detectedFrancCode = franc(sampleForDetection, { minLength: 3 });
  const detectedLanguage = normalizeDetectedLanguage(detectedFrancCode);

  // Skip translation only when source and target are the same known language.
  const targetFrancCode = APP_TO_FRANC[targetLanguage];
  if (detectedFrancCode !== "und" && detectedFrancCode === targetFrancCode) {
    return NextResponse.json({
      ok: true,
      translatedText: text,
      translated: false,
      detectedLanguage,
    });
  }

  const fromCode = APP_TO_MYMEMORY[detectedLanguage !== "unknown" ? detectedLanguage : "en"];
  const toCode = APP_TO_MYMEMORY[targetLanguage];

  try {
    const chunks = chunkText(text);
    // Sequential calls to respect MyMemory free-tier rate limits.
    const translated: string[] = [];
    for (const chunk of chunks) {
      const result = await translateChunk(chunk, fromCode, toCode);
      translated.push(result);
    }
    return NextResponse.json({
      ok: true,
      translatedText: translated.join(" "),
      translated: true,
      detectedLanguage,
    });
  } catch (err) {
    console.error("[translate] MyMemory error:", err);
    // Fallback to original text so UI never breaks.
    return NextResponse.json({
      ok: true,
      translatedText: text,
      translated: false,
      detectedLanguage,
      error: "Translation service unavailable",
    });
  }
}
