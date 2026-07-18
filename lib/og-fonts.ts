// Font loader for rank-card rendering (next/og's ImageResponse / Satori).
// Satori needs actual font bytes — it can't use next/font or system fonts —
// so we fetch a single family that covers both Devanagari and Latin glyphs
// (Noto Sans Devanagari also ships basic Latin), meaning one font family
// renders English and Hindi student/institution names correctly on the
// same card. Cached per warm server instance to avoid re-fetching per card.

export interface CardFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal";
}

let cachedFonts: CardFont[] | null = null;

async function fetchGoogleFont(family: string, weight: 400 | 700): Promise<ArrayBuffer> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
  const cssRes = await fetch(cssUrl, {
    // An old UA avoids woff2 (Satori doesn't need woff2's brotli decoder this way) —
    // Google serves woff/ttf instead, both of which Satori loads directly.
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; rv:2.0.1) Gecko/20100101 Firefox/4.0.1" },
  });
  if (!cssRes.ok) throw new Error(`Google Fonts CSS fetch failed for ${family} ${weight}: ${cssRes.status}`);
  const css = await cssRes.text();
  const match = css.match(/src:\s*url\(([^)]+)\)/);
  if (!match) throw new Error(`Could not find a font file URL for ${family} ${weight}`);

  const fontRes = await fetch(match[1]);
  if (!fontRes.ok) throw new Error(`Font file fetch failed for ${family} ${weight}: ${fontRes.status}`);
  return fontRes.arrayBuffer();
}

export async function getCardFonts(): Promise<CardFont[]> {
  if (cachedFonts) return cachedFonts;

  const [regular, bold] = await Promise.all([
    fetchGoogleFont("Noto Sans Devanagari", 400),
    fetchGoogleFont("Noto Sans Devanagari", 700),
  ]);

  cachedFonts = [
    { name: "Noto Sans Devanagari", data: regular, weight: 400, style: "normal" },
    { name: "Noto Sans Devanagari", data: bold, weight: 700, style: "normal" },
  ];
  return cachedFonts;
}

export const CARD_FONT_FAMILY = "Noto Sans Devanagari";
