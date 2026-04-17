export function sanitizeText(input: string) {
  return input.replace(/<[^>]*>/g, "").trim();
}

export function toDate(value?: string) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}
