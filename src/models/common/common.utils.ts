export const htmlToText = (html?: string): string => {
  if (typeof html !== "string") return "";

  // If no HTML tags exist, just return trimmed text
  if (!/<[^>]+>/.test(html)) {
    return html.trim();
  }

  // Strip HTML tags
  return html.replace(/<[^>]*>/g, "").trim();
};
