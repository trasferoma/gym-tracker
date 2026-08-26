<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

import AppIcon, { type IconName } from '@/components/icon/AppIcon.vue';
import { backTargetRoute, isPrimaryRouteName, type PrimaryRouteName } from '@/router';

interface Tab {
    readonly name: PrimaryRouteName;
    readonly icon: IconName;
    readonly label: string;
}

const TABS: readonly Tab[] = [
    { name: 'home', icon: 'home', label: 'Home' },
    { name: 'history', icon: 'dumbbell', label: 'Allenamenti' },
    { name: 'statistics', icon: 'chart', label: 'Statistiche' },
    { name: 'data', icon: 'archive', label: 'Dati' }
];

const route = useRoute();

const activeName = computed<PrimaryRouteName>(() => (
    isPrimaryRouteName(route.name) ? route.name : backTargetRoute.value
));
</script>

<template>
  <nav
    class="tabbar"
    aria-label="Navigazione principale"
  >
    <RouterLink
      v-for="tab in TABS"
      :key="tab.name"
      v-slot="{ navigate }"
      :to="{ name: tab.name }"
      custom
    >
      <button
        type="button"
        class="tab"
        :aria-current="tab.name === activeName ? 'page' : undefined"
        @click="navigate"
      >
        <AppIcon :name="tab.icon" />
        <span>{{ tab.label }}</span>
      </button>
    </RouterLink>
  </nav>
</template>

<style scoped>
.tabbar {
    flex: 0 0 auto;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 2px;
    padding: 6px 6px calc(env(safe-area-inset-bottom) + 6px);
    background: var(--surface);
    border-top: 1px solid var(--border);
}

.tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 7px 2px 5px;
    border: 0;
    border-radius: var(--r-md);
    background: none;
    color: var(--text-faint);
    font: inherit;
    font-size: 10.5px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
}

.tab svg {
    width: 22px;
    height: 22px;
}

.tab[aria-current="page"] {
    color: var(--accent);
}
</style>
