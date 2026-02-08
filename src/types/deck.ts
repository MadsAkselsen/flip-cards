export type Card = {
  sw: string;
  en: string;
};

export type Deck = {
  name: string;
  cards: Card[];
};

export type DeckInfo = {
  id: string;      // filename without extension
  name: string;    // deck.name
  cards: Card[];
};
