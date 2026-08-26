<script setup lang="ts">
import { ref, watch } from 'vue';

import { sharedLoadingIndicator } from '@/composables/useLoadingIndicator';

const visible = sharedLoadingIndicator.visible;
const announcement = ref('');

watch(visible, (isVisible) => {
    announcement.value = isVisible ? 'Caricamento in corso' : 'Caricamento completato';
});
</script>

<template>
  <div
    v-if="visible"
    class="loading-bar"
    aria-hidden="true"
  />
  <span
    class="sr-only"
    aria-live="polite"
  >{{ announcement }}</span>
</template>

<style scoped>
.loading-bar {
    position: absolute;
    left: 0;
    right: 0;
    bottom: -1px;
    height: 2px;
    overflow: hidden;
    background: var(--accent-soft);
}

.loading-bar::after {
    content: '';
    position: absolute;
    inset: 0;
    width: 40%;
    background: var(--accent);
    animation: loading-sweep 1.1s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
    .loading-bar::after {
        animation: none;
        width: 100%;
    }
}

@keyframes loading-sweep {
    0% {
        transform: translateX(-100%);
    }

    100% {
        transform: translateX(250%);
    }
}

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}
</style>
