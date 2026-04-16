#!/usr/bin/env node

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const decksDir = path.join(rootDir, "src", "decks");
const outputPath = path.resolve(rootDir, process.argv[2] ?? "my-current-vocabulary.json");

function cleanOptionalText(value) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function deckIdFromFilename(filename) {
  return filename.replace(/\.json$/i, "");
}

function normalizeCard(card) {
  if (!card || typeof card.sw !== "string" || typeof card.en !== "string") {
    return undefined;
  }

  const normalized = {
    en: card.en.trim(),
    sw: card.sw.trim(),
  };
  const explanation = cleanOptionalText(card.explanation);

  if (explanation) {
    normalized.explanation = explanation;
  }

  return normalized.en.length > 0 && normalized.sw.length > 0 ? normalized : undefined;
}

async function readDeck(filename) {
  const filePath = path.join(decksDir, filename);
  const rawDeck = JSON.parse(await readFile(filePath, "utf8"));
  const fallbackName = deckIdFromFilename(filename);
  const cards = Array.isArray(rawDeck.cards) ? rawDeck.cards.map(normalizeCard).filter(Boolean) : [];

  return {
    filename,
    name: rawDeck.name?.trim() || fallbackName,
    explanation: cleanOptionalText(rawDeck.explanation),
    cards,
  };
}

const filenames = (await readdir(decksDir))
  .filter(filename => filename.endsWith(".json"))
  .filter(filename => path.resolve(decksDir, filename) !== outputPath)
  .sort((a, b) => a.localeCompare(b));

const decks = await Promise.all(filenames.map(readDeck));
const validDecks = decks.filter(deck => deck.cards.length > 0);

const mergedDeck = {
  name: "All decks",
  explanation: `Merged from ${validDecks.length} decks: ${validDecks.map(deck => deck.name).join(", ")}.`,
  cards: validDecks.flatMap(deck => deck.cards),
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(mergedDeck, null, 2)}\n`);

console.log(`Merged ${mergedDeck.cards.length} cards from ${validDecks.length} decks into ${path.relative(rootDir, outputPath)}.`);
