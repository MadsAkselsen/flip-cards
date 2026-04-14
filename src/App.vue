<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useDecks } from "@/composables/useDecks";
import FlipCard from "@/components/FlipCard.vue";
import type { DeckInfo } from "@/types/deck";

const { decks } = useDecks();

const selectedDeckId = ref<string>(decks[0]?.id ?? "");
const selectedDeck = computed<DeckInfo | undefined>(() =>
  decks.find(d => d.id === selectedDeckId.value)
);

const index = ref(0);
const isFlipped = ref(false);
const shuffleMode = ref(true);
const showSwahiliFirst = ref(true);
const showDeckExplanation = ref(false);
const showCardExplanation = ref(false);

const order = ref<number[]>([]);

function buildOrder() {
  const count = selectedDeck.value?.cards.length ?? 0;
  const arr: number[] = Array.from({ length: count }, (_, i) => i);

  if (shuffleMode.value) {
    // Fisher-Yates shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
  }

  order.value = arr;
  index.value = 0;
  isFlipped.value = false;
  showCardExplanation.value = false;
}

const currentCard = computed(() => {
  const deck = selectedDeck.value;
  if (!deck || deck.cards.length === 0) return null;
  const realIndex = order.value[index.value] ?? 0;
  return deck.cards[realIndex] ?? null;
});

const progressText = computed(() => {
  const total = selectedDeck.value?.cards.length ?? 0;
  if (total === 0) return "0 / 0";
  return `${index.value + 1} / ${total}`;
});

const hasDeckExplanation = computed(() => Boolean(selectedDeck.value?.explanation));
const hasCardExplanation = computed(() => Boolean(currentCard.value?.explanation));
const visibleExplanation = computed(() => {
  if (showDeckExplanation.value && selectedDeck.value?.explanation) {
    return {
      title: "Deck notes",
      text: selectedDeck.value.explanation,
    };
  }

  if (showCardExplanation.value && currentCard.value?.explanation) {
    return {
      title: "Card note",
      text: currentCard.value.explanation,
    };
  }

  return null;
});

function toggleDeckExplanation() {
  showDeckExplanation.value = !showDeckExplanation.value;
  if (showDeckExplanation.value) {
    showCardExplanation.value = false;
  }
}

function toggleCardExplanation() {
  showCardExplanation.value = !showCardExplanation.value;
  if (showCardExplanation.value) {
    showDeckExplanation.value = false;
  }
}

function next() {
  const total = selectedDeck.value?.cards.length ?? 0;
  if (total === 0) return;
  isFlipped.value = false;
  showCardExplanation.value = false;
  index.value = (index.value + 1) % total;
}

function prev() {
  const total = selectedDeck.value?.cards.length ?? 0;
  if (total === 0) return;
  isFlipped.value = false;
  showCardExplanation.value = false;
  index.value = (index.value - 1 + total) % total;
}

function flip() {
  if (!currentCard.value) return;
  isFlipped.value = !isFlipped.value;
}

function reshuffle() {
  buildOrder();
}

watch(selectedDeckId, () => {
  showDeckExplanation.value = false;
  buildOrder();
});

watch(shuffleMode, () => {
  buildOrder();
});

// Keyboard shortcuts
function onKeydown(e: KeyboardEvent) {
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    flip();
  } else if (e.key === "ArrowRight") {
    next();
  } else if (e.key === "ArrowLeft") {
    prev();
  } else if (e.key.toLowerCase() === "r") {
    reshuffle();
  }
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => window.removeEventListener("keydown", onKeydown));

// init order
buildOrder();
</script>

<template>
  <div class="page">
    <header class="header">
      <h1>Swahili Flip Cards</h1>
      <p class="sub">Space/Enter: flip • ←/→: prev/next • R: reshuffle</p>
    </header>

    <section class="toolbar">
      <div class="field">
        <label>Category</label>
        <select v-model="selectedDeckId">
          <option v-for="d in decks" :key="d.id" :value="d.id">
            {{ d.name }} ({{ d.cards.length }})
          </option>
        </select>
      </div>

      <div class="toggles">
        <label class="toggle">
          <input type="checkbox" v-model="shuffleMode" />
          Shuffle
        </label>

        <label class="toggle">
          <input type="checkbox" v-model="showSwahiliFirst" />
          Swahili on front
        </label>
      </div>

      <div class="navActions">
        <button class="navButton" @click="prev" :disabled="!currentCard">Prev</button>
        <button class="navButton" @click="next" :disabled="!currentCard">Next</button>
      </div>

      <div class="actions">
        <button @click="flip" :disabled="!currentCard">Flip</button>
        <button @click="reshuffle" :disabled="!currentCard">Reshuffle</button>
      </div>

      <div class="infoActions">
        <button
          class="infoButton"
          type="button"
          @click="toggleDeckExplanation"
          :disabled="!hasDeckExplanation"
          :aria-expanded="showDeckExplanation"
        >
          <span class="infoIcon" aria-hidden="true">i</span>
          <span class="infoLabel">Deck notes</span>
        </button>

        <button
          class="infoButton"
          type="button"
          @click="toggleCardExplanation"
          :disabled="!hasCardExplanation"
          :aria-expanded="showCardExplanation"
        >
          <span class="infoIcon" aria-hidden="true">?</span>
          <span class="infoLabel">Card note</span>
        </button>
      </div>

      <div class="progress">{{ progressText }}</div>
    </section>

    <section v-if="visibleExplanation" class="explanationPanel">
      <div class="panelLabel">{{ visibleExplanation.title }}</div>
      <div class="explanationText">{{ visibleExplanation.text }}</div>
    </section>

    <main class="main">
      <div v-if="!currentCard" class="empty">
        No cards found. Add JSON files in <code>src/decks</code>.
      </div>

      <div v-else class="cardWrap" @click="flip">
        <FlipCard
          :card="currentCard"
          :isFlipped="isFlipped"
          :showSwahiliFirst="showSwahiliFirst"
        />
        <div class="hint">Click the card to flip</div>
      </div>
    </main>

    <footer class="footer">
      <div class="footerInner">
        <div>
          Decks live in <code>src/decks/*.json</code>. Add <code>explanation</code> to a deck or card for hidden notes.
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: #fafafa;
  color: #111;
  padding: 20px;
  display: grid;
  grid-template-rows: auto auto auto 1fr auto;
  gap: 18px;
}

.header h1 {
  margin: 0;
  font-size: 28px;
}
.sub {
  margin: 6px 0 0;
  color: #666;
  font-size: 14px;
}

.toolbar {
  background: white;
  border: 1px solid #e7e7e7;
  border-radius: 8px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.05);
  padding: 14px;
  display: grid;
  gap: 12px;
}

.field label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}
select {
  width: min(520px, 100%);
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #ddd;
  background: white;
}

.toggles {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #333;
  font-size: 14px;
}

.navActions,
.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.navActions {
  width: 100%;
}
.navButton {
  flex: 1 1 0;
  min-width: 140px;
  min-height: 48px;
  font-size: 16px;
}
button {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.infoActions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  width: 100%;
}
.infoButton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1 1 180px;
  min-height: 44px;
}
.infoButton[aria-expanded="true"] {
  border-color: #9aa9b5;
  background: #f4f8fa;
}
.infoIcon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid #777;
  display: inline-grid;
  place-items: center;
  font-size: 12px;
  line-height: 1;
  font-weight: 700;
}

.progress {
  color: #666;
  font-size: 14px;
}

.explanationPanel {
  width: min(760px, 100%);
  justify-self: start;
  background: white;
  border: 1px solid #e7e7e7;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.04);
}
.panelLabel {
  color: #666;
  font-size: 12px;
  margin-bottom: 8px;
  text-transform: uppercase;
}
.explanationText {
  color: #222;
  font-size: 15px;
  line-height: 1.55;
  white-space: pre-wrap;
}

.main {
  display: grid;
  place-items: center;
  grid-template-columns: minmax(0, 1fr);
  gap: 18px;
}
.cardWrap {
  display: grid;
  gap: 10px;
  place-items: center;
}
.hint {
  color: #777;
  font-size: 13px;
}
.empty {
  color: #666;
  background: white;
  border: 1px dashed #ddd;
  border-radius: 8px;
  padding: 18px;
}

.footer {
  color: #666;
  font-size: 13px;
}
code {
  background: #f1f1f1;
  padding: 2px 6px;
  border-radius: 6px;
}

@media (max-width: 760px) {
  .page {
    padding: 14px;
    padding-bottom: calc(88px + env(safe-area-inset-bottom));
  }

  .navActions {
    position: fixed;
    z-index: 10;
    left: 0;
    right: 0;
    bottom: 0;
    gap: 8px;
    padding: 10px 14px calc(10px + env(safe-area-inset-bottom));
    background: rgba(250, 250, 250, 0.96);
    border-top: 1px solid #e7e7e7;
    box-shadow: 0 -6px 18px rgba(0,0,0,0.06);
  }

  .navButton {
    min-width: 0;
    min-height: 54px;
  }

  .infoButton {
    flex: 1 1 0;
    min-width: 0;
    min-height: 42px;
    justify-content: center;
    padding: 10px;
  }
}
</style>
