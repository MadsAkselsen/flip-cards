export type Card = {
  target: string;
  en: string;
  explanation?: string;
};

export type RawCard = {
  en?: unknown;
  target?: unknown;
  explanation?: unknown;
  [key: string]: unknown;
};

export type Deck = {
  name: string;
  explanation?: string;
  cards: RawCard[];
};

export type DeckInfo = {
  id: string;
  languageId: string;
  languageName: string;
  targetLabel: string;
  name: string;
  explanation?: string;
  cards: Card[];
};

export type LanguageInfo = {
  id: string;
  name: string;
  targetLabel: string;
  decks: DeckInfo[];
};
