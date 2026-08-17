<script setup lang="ts">
import { computed } from "vue";
import type { Card } from "@/types/deck";

const props = defineProps<{
  card: Card;
  isFlipped: boolean;
  showTargetFirst: boolean;
}>();

const frontText = computed(() => (props.showTargetFirst ? props.card.target : props.card.en));
const backText = computed(() => (props.showTargetFirst ? props.card.en : props.card.target));
</script>

<template>
  <div class="card" :class="{ flipped: isFlipped }">
    <div class="inner">
      <div class="face front">
        <div class="label">Front</div>
        <div class="text">{{ frontText }}</div>
      </div>

      <div class="face back">
        <div class="label">Back</div>
        <div class="text">{{ backText }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  width: min(520px, 92vw);
  height: 280px;
  perspective: 1200px;
  user-select: none;
}

.inner {
  width: 100%;
  height: 100%;
  transition: transform 180ms ease;
  transform-style: preserve-3d;
  position: relative;
}

.card.flipped .inner {
  transform: rotateY(180deg);
}

.face {
  position: absolute;
  inset: 0;
  border-radius: 8px;
  background: white;
  border: 1px solid #e7e7e7;
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  padding: 18px 18px 14px;
  backface-visibility: hidden;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 10px;
}

.back {
  transform: rotateY(180deg);
}

.label {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #666;
}

.text {
  display: grid;
  place-items: center;
  font-size: 28px;
  text-align: center;
  line-height: 1.2;
  padding: 12px;
}
</style>
