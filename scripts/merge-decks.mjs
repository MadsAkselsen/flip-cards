#!/usr/bin/env node

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const decksDir = path.join(rootDir, "src", "decks");
const outputPath = path.resolve(rootDir, process.argv[2] ?? "my-current-vocabulary.json");

const configuredLanguages = {
  swahili: ["sw", "swahili"],
  french: ["fr", "french"],
  spanish: ["es", "spanish"],
};

function cleanOptionalText(value) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function deckIdFromFilename(filename) {
  return filename.replace(/\.json$/i, "");
}

function languageNameFromId(languageId) {
  return languageId
    .split(/[-_]/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeCard(card, languageId) {
  if (!card || typeof card.en !== "string") {
    return undefined;
  }

  const target = [...(configuredLanguages[languageId] ?? [languageId]), "target"]
    .map(key => card[key])
    .find(value => typeof value === "string");

  if (typeof target !== "string") {
    return undefined;
  }

  const normalized = {
    en: card.en.trim(),
    target: target.trim(),
  };
  const explanation = cleanOptionalText(card.explanation);

  if (explanation) {
    normalized.explanation = explanation;
  }

  return normalized.en.length > 0 && normalized.target.length > 0 ? normalized : undefined;
}

async function readDeck(filePath) {
  const rawDeck = JSON.parse(await readFile(filePath, "utf8"));
  const relativePath = path.relative(decksDir, filePath);
  const [languageId = "unknown"] = relativePath.split(path.sep);
  const filename = path.basename(filePath);
  const fallbackName = deckIdFromFilename(filename);
  const cards = Array.isArray(rawDeck.cards)
    ? rawDeck.cards.map(card => normalizeCard(card, languageId)).filter(Boolean)
    : [];

  return {
    filename: relativePath,
    languageId,
    languageName: languageNameFromId(languageId),
    name: rawDeck.name?.trim() || fallbackName,
    explanation: cleanOptionalText(rawDeck.explanation),
    cards,
  };
}

async function findDeckFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async entry => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return findDeckFiles(entryPath);
    }

    if (entry.isFile() && entry.name.endsWith(".json") && path.resolve(entryPath) !== outputPath) {
      return [entryPath];
    }

    return [];
  }));

  return files.flat().sort((a, b) => a.localeCompare(b));
}

const filenames = await findDeckFiles(decksDir);
const decks = await Promise.all(filenames.map(readDeck));
const validDecks = decks.filter(deck => deck.cards.length > 0);

const mergedDeck = {
  name: "All language decks",
  explanation: `Merged from ${validDecks.length} decks: ${validDecks.map(deck => `${deck.languageName}: ${deck.name}`).join(", ")}.`,
  cards: validDecks.flatMap(deck => deck.cards),
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(mergedDeck, null, 2)}\n`);

console.log(`Merged ${mergedDeck.cards.length} cards from ${validDecks.length} decks into ${path.relative(rootDir, outputPath)}.`);
