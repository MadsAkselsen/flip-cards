import type { Card, Deck, DeckInfo, LanguageInfo, RawCard } from "@/types/deck";

// Vite: import all json files in language-specific deck folders at build time.
const rawDeckModules = import.meta.glob<Deck>("@/decks/*/*.json", { eager: true });

const configuredLanguages = [
  { id: "swahili", name: "Swahili", targetLabel: "Swahili", cardKeys: ["sw", "swahili"] },
  { id: "french", name: "French", targetLabel: "French", cardKeys: ["fr", "french"] },
  { id: "spanish", name: "Spanish", targetLabel: "Spanish", cardKeys: ["es", "spanish"] },
] as const;

type LanguageConfig = {
  id: string;
  name: string;
  targetLabel: string;
  cardKeys: readonly string[];
};

const configuredLanguageById = new Map<string, LanguageConfig>(
  configuredLanguages.map(language => [language.id, language]),
);

function filenameToId(path: string) {
  const file = path.split("/").pop() ?? path;
  return file.replace(".json", "");
}

function languageIdFromPath(path: string) {
  const parts = path.split("/");
  const decksIndex = parts.lastIndexOf("decks");
  return parts[decksIndex + 1] ?? "unknown";
}

function slugToName(slug: string) {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function cleanOptionalText(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function languageConfig(languageId: string) {
  const configured = configuredLanguageById.get(languageId);
  if (configured) return configured;

  return {
    id: languageId,
    name: slugToName(languageId),
    targetLabel: slugToName(languageId),
    cardKeys: [languageId, "target"],
  };
}

function normalizeCard(card: RawCard, languageId: string): Card | undefined {
  if (!card || typeof card.en !== "string") return undefined;

  const config = languageConfig(languageId);
  const targetValue = [...config.cardKeys, "target"]
    .map(key => card[key])
    .find(value => typeof value === "string");

  if (typeof targetValue !== "string") return undefined;

  const normalized = {
    target: targetValue.trim(),
    en: card.en.trim(),
    explanation: cleanOptionalText(card.explanation),
  };

  return normalized.target.length > 0 && normalized.en.length > 0 ? normalized : undefined;
}

export function useDecks() {
  const decks: DeckInfo[] = Object.entries(rawDeckModules)
    .map(([path, deck]) => {
      const languageId = languageIdFromPath(path);
      const config = languageConfig(languageId);
      const filenameId = filenameToId(path);

      return {
        id: `${languageId}/${filenameId}`,
        languageId,
        languageName: config.name,
        targetLabel: config.targetLabel,
        name: deck.name?.trim() || filenameId,
        explanation: cleanOptionalText(deck.explanation),
        cards: Array.isArray(deck.cards)
          ? deck.cards.map(card => normalizeCard(card, languageId)).filter(card => card !== undefined)
          : [],
      };
    })
    .filter(d => d.cards.length > 0)
    .sort(
      (a, b) =>
        a.languageName.localeCompare(b.languageName) ||
        a.name.localeCompare(b.name),
    );

  const discoveredLanguageIds = new Set([
    ...configuredLanguages.map(language => language.id),
    ...decks.map(deck => deck.languageId),
  ]);

  const languages: LanguageInfo[] = Array.from(discoveredLanguageIds)
    .map(languageId => {
      const config = languageConfig(languageId);
      return {
        id: languageId,
        name: config.name,
        targetLabel: config.targetLabel,
        decks: decks.filter(deck => deck.languageId === languageId),
      };
    })
    .sort((a, b) => {
      const configuredA = configuredLanguages.findIndex(language => language.id === a.id);
      const configuredB = configuredLanguages.findIndex(language => language.id === b.id);

      if (configuredA !== -1 || configuredB !== -1) {
        return (configuredA === -1 ? Number.MAX_SAFE_INTEGER : configuredA) -
          (configuredB === -1 ? Number.MAX_SAFE_INTEGER : configuredB);
      }

      return a.name.localeCompare(b.name);
    });

  return { decks, languages };
}
