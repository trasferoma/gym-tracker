<script setup lang="ts">
import { computed } from 'vue';

import AppIcon from '@/components/icon/AppIcon.vue';

const props = withDefaults(defineProps<{ tone?: 'info' | 'warn' }>(), { tone: 'info' });

const icon = computed(() => (props.tone === 'warn' ? 'warn' : 'info'));
</script>

<template>
  <div
    class="banner"
    :class="`banner--${tone}`"
    role="status"
  >
    <AppIcon :name="icon" />
    <span><slot /></span>
  </div>
</template>

<style scoped>
.banner {
    display: flex;
    gap: 10px;
    padding: 11px 13px;
    border-radius: var(--r-md);
    font-size: 13px;
    line-height: 1.4;
}

.banner svg {
    width: 17px;
    height: 17px;
    flex: 0 0 auto;
    margin-top: 1px;
}

.banner--warn {
    background: var(--warn-soft);
    color: var(--warn);
}

.banner--info {
    background: var(--surface-2);
    color: var(--text-dim);
}
</style>
