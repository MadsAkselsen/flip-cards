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

function next() {
  const total = selectedDeck.value?.cards.length ?? 0;
  if (total === 0) return;
  isFlipped.value = false;
  index.value = (index.value + 1) % total;
}

function prev() {
  const total = selectedDeck.value?.cards.length ?? 0;
  if (total === 0) return;
  isFlipped.value = false;
  index.value = (index.value - 1 + total) % total;
}

function flip() {
  if (!currentCard.value) return;
  isFlipped.value = !isFlipped.value;
}

function reshuffle() {
  buildOrder();
}

watch([selectedDeckId, shuffleMode], () => {
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

      <div class="actions">
        <button @click="prev" :disabled="!currentCard">Prev</button>
        <button @click="flip" :disabled="!currentCard">Flip</button>
        <button @click="next" :disabled="!currentCard">Next</button>
        <button @click="reshuffle" :disabled="!currentCard">Reshuffle</button>
      </div>

      <div class="progress">{{ progressText }}</div>
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
          Decks live in <code>src/decks/*.json</code>. Edit them and restart dev server if needed.
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
  grid-template-rows: auto auto 1fr auto;
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
  border-radius: 14px;
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
  border-radius: 10px;
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

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
button {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.progress {
  color: #666;
  font-size: 14px;
}

.main {
  display: grid;
  place-items: center;
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
  border-radius: 14px;
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
</style>
