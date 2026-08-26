<script setup lang="ts">
import { computed } from 'vue';

import AppIcon, { type IconName } from '@/components/icon/AppIcon.vue';

const props = defineProps<{
    title: string;
    description: string;
    icon?: IconName;
}>();

const icon = computed(() => props.icon ?? 'empty');
</script>

<template>
  <div class="empty">
    <AppIcon :name="icon" />
    <strong>{{ title }}</strong>
    <p>{{ description }}</p>
  </div>
</template>

<style scoped>
.empty {
    text-align: center;
    padding: 30px 22px;
    border: 1px dashed var(--border-strong);
    border-radius: var(--r-lg);
    color: var(--text-dim);
}

.empty svg {
    width: 30px;
    height: 30px;
    color: var(--text-faint);
    margin-bottom: 8px;
}

.empty strong {
    display: block;
    color: var(--text);
    font-size: 15px;
    margin-bottom: 4px;
}

.empty p {
    margin: 0;
    font-size: 13px;
}
</style>
