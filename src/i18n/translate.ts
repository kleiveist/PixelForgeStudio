import { messages } from "./messages";

export type Locale = "de" | "en";
export type MessageKey = keyof typeof messages;
export const LOCALE_TAGS = { de: "de-DE", en: "en-GB" } as const;

const normalize = (value: string): string => value.replace(/\s+/g, " ").trim();
const hasMessage = (key: string): key is MessageKey =>
  Object.hasOwn(messages, key);
const escapePattern = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Adapter for existing structured diagnostics and display-only catalog summaries.
// Never call this adapter on profile names, tags, editable values, or prompt prose.
const patterns = Object.entries(messages)
  .filter(([source, target]) => /\{\d+\}/.test(source) && source !== target)
  .map(([source, target]) => {
    const slots: string[] = [];
    const parts = source.split(/(\{\d+\})/g);
    const pattern = parts
      .map((part) => {
        if (/^\{\d+\}$/.test(part)) {
          slots.push(part);
          return "(.*?)";
        }
        return escapePattern(part);
      })
      .join("");
    return {
      source,
      target,
      slots,
      regex: new RegExp(`^${pattern}$`, "u"),
      weight: source.replace(/\{\d+\}/g, "").length
    };
  })
  .sort((a, b) => b.weight - a.weight);

export function translate(
  locale: Locale,
  key: MessageKey,
  ...values: readonly (string | number)[]
): string {
  const source: string = hasMessage(key)
    ? locale === "en"
      ? messages[key]
      : key
    : key;
  if (!hasMessage(key) && import.meta.env.DEV) {
    console.warn(`Missing translation: ${key}`);
  }
  return source.replace(/\{(\d+)\}/g, (token, index: string) =>
    String(values[Number(index)] ?? token)
  );
}

export function translateText(locale: Locale, value: string): string {
  if (locale === "de" || !value) return value;
  const key = normalize(value);
  if (hasMessage(key)) return messages[key];
  for (const pattern of patterns) {
    const match = pattern.regex.exec(key);
    if (!match) continue;
    return pattern.target.replace(/\{\d+\}/g, (slot) => {
      const index = pattern.slots.indexOf(slot);
      const captured = index < 0 ? slot : (match[index + 1] ?? slot);
      // Only technical catalog summaries contain translatable values.
      // Quoted names and free-text facts (role, species, etc.) remain verbatim.
      const catalogSummary =
        /^(?:Klasse|Bewegung|Material|Zustand|Grundform|Proportion|Symmetrie|Hauptmaterial|Zweitmaterial|Interaktion|Schatten|Tiletyp|Mapping-Einsatz|Kanten|Ecken|Übergang|Seam-Regel|Kachelbare Achsen|Wiederholung|Variantenarten|Atlaslayout|Pflanzentyp|Klima|Saison|Alter|Stammstärke|Stammform|Kronenform|Kronendichte|Wurzeln|Moos|Pilze|Schnee|Ranken|Bodenanschluss|Einsatz|Struktur|Oberfläche|Feuchtigkeit|Vereisung|Ausrichtung|Gebäudetyp|Größe|Dachform|Dachmaterial|Fassade|Belegung|Mapping|Kollision|Gebäudelicht|Itemklasse|Zweck|Darstellung|Lesbarkeit|Bedeutung|Artworktyp|Komposition|Format|Fokus|Licht|Detailgrad):/.test(
          pattern.source
        );
      return catalogSummary && hasMessage(captured)
        ? messages[captured]
        : captured;
    });
  }
  if (key.includes(" · "))
    return key
      .split(" · ")
      .map((part) => translateText(locale, part))
      .join(" · ");
  if (key.includes(", ") && !/[„“”]/.test(key))
    return key
      .split(", ")
      .map((part) => translateText(locale, part))
      .join(", ");
  return value;
}

export function formatDate(locale: Locale, timestamp: string): string {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return timestamp;
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
