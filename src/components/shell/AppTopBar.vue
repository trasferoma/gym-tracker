<script setup lang="ts">
import { RouterLink } from 'vue-router';

import AppIcon from '@/components/icon/AppIcon.vue';
import LoadingBar from '@/components/shell/LoadingBar.vue';
import { backTargetRoute } from '@/router';

withDefaults(defineProps<{
    title?: string;
    subtitle?: string;
    showBack?: boolean;
}>(), {
    title: '',
    subtitle: '',
    showBack: false
});
</script>

<template>
  <header class="topbar">
    <div class="bar">
      <RouterLink
        v-if="showBack"
        :to="{ name: backTargetRoute }"
        class="icon-btn"
        aria-label="Indietro"
      >
        <AppIcon name="back" />
      </RouterLink>
      <h1 v-if="title">
        {{ title }}
        <small v-if="subtitle">{{ subtitle }}</small>
      </h1>
      <slot name="actions" />
    </div>
    <LoadingBar />
  </header>
</template>

<style scoped>
.topbar {
    position: sticky;
    top: 0;
    z-index: 2;
    flex: 0 0 auto;
    padding: calc(env(safe-area-inset-top) + 12px) var(--gutter) 10px;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
}

.bar {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 34px;
}

.bar h1 {
    margin: 0;
    font-size: 22px;
    line-height: 1.15;
    letter-spacing: -.02em;
    font-weight: 700;
    flex: 1 1 auto;
    min-width: 0;
}

.bar h1 small {
    display: block;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0;
    color: var(--text-dim);
    text-transform: capitalize;
}

.icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    flex: 0 0 auto;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: var(--text-dim);
    text-decoration: none;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
}

.icon-btn svg {
    width: 18px;
    height: 18px;
}

.icon-btn:hover {
    background: var(--surface-2);
    color: var(--text);
}
</style>
