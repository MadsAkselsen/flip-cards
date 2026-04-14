export type Card = {
  sw: string;
  en: string;
  explanation?: string;
};

export type Deck = {
  name: string;
  explanation?: string;
  cards: Card[];
};

export type DeckInfo = {
  id: string;      // filename without extension
  name: string;    // deck.name
  explanation?: string;
  cards: Card[];
};
