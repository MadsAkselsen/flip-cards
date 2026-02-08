import type { Deck, DeckInfo } from "@/types/deck";

// Vite: import all json files in src/decks at build time
const rawDeckModules = import.meta.glob<Deck>("@/decks/*.json", { eager: true });

function filenameToId(path: string) {
  // path example: /src/decks/basics.json (or similar)
  const file = path.split("/").pop() ?? path;
  return file.replace(".json", "");
}

export function useDecks() {
  const decks: DeckInfo[] = Object.entries(rawDeckModules)
    .map(([path, deck]) => ({
      id: filenameToId(path),
      name: deck.name?.trim() || filenameToId(path),
      cards: Array.isArray(deck.cards) ? deck.cards : [],
    }))
    .map(d => ({
      ...d,
      cards: d.cards
        .filter(c => c && typeof c.sw === "string" && typeof c.en === "string")
        .map(c => ({ sw: c.sw.trim(), en: c.en.trim() }))
        .filter(c => c.sw.length > 0 && c.en.length > 0),
    }))
    .filter(d => d.cards.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  return { decks };
}
