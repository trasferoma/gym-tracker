<script setup lang="ts">
import AppIcon from '@/components/icon/AppIcon.vue';

withDefaults(defineProps<{
    keyLabel: string;
    title: string;
    subtitle: string;
    schemeVariant?: boolean;
}>(), { schemeVariant: false });

const emit = defineEmits<{ click: [] }>();
</script>

<template>
  <button
    type="button"
    class="drill"
    :class="{ 'drill--scheme': schemeVariant }"
    @click="emit('click')"
  >
    <span class="drill-k">{{ keyLabel }}</span>
    <span class="drill-b">
      <b>{{ title }}</b>
      <small>{{ subtitle }}</small>
    </span>
    <AppIcon name="next" />
  </button>
</template>

<style scoped>
.drill {
    display: flex;
    align-items: center;
    gap: 11px;
    width: 100%;
    text-align: left;
    padding: 13px;
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    background: var(--surface);
    color: inherit;
    font: inherit;
}

.drill:hover {
    border-color: var(--accent-line);
}

.drill-k {
    flex: 0 0 auto;
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    background: var(--surface-2);
    font-size: 12px;
    font-weight: 800;
    color: var(--text-dim);
    font-variant-numeric: tabular-nums;
}

.drill--scheme .drill-k {
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 11.5px;
}

.drill-b {
    flex: 1 1 auto;
    min-width: 0;
}

.drill-b b {
    display: block;
    font-size: 14.5px;
    font-weight: 650;
}

.drill-b small {
    font-size: 12px;
    color: var(--text-dim);
}

.drill > svg {
    width: 16px;
    height: 16px;
    color: var(--text-faint);
    flex: 0 0 auto;
}
</style>
