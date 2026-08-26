<script setup lang="ts">
import { computed } from 'vue';

import AppIcon from '@/components/icon/AppIcon.vue';
import type { StatisticsStep } from '@/composables/useStatisticsPath';

type SelectableStep = Exclude<StatisticsStep, 'sessions'>;

const props = defineProps<{
    positionLabel?: string | undefined;
    groupLabel?: string | undefined;
    exerciseLabel?: string | undefined;
    schemeLabel?: string | undefined;
}>();

const emit = defineEmits<{ select: [step: SelectableStep] }>();

interface CrumbItem {
    readonly slot: 'root' | 'position' | 'group' | 'exercise' | 'scheme';
    readonly label: string;
    readonly target: SelectableStep;
    readonly clickable: boolean;
}

const items = computed<readonly CrumbItem[]>(() => buildCrumbItems(props));

function buildCrumbItems(labels: {
    readonly positionLabel?: string | undefined;
    readonly groupLabel?: string | undefined;
    readonly exerciseLabel?: string | undefined;
    readonly schemeLabel?: string | undefined;
}): readonly CrumbItem[] {
    const crumbs: CrumbItem[] = [{ slot: 'root', label: 'Posizione', target: 'position', clickable: true }];
    if (labels.positionLabel === undefined) {
        return crumbs;
    }
    crumbs.push({
        slot: 'position', label: labels.positionLabel, target: 'group', clickable: labels.groupLabel !== undefined
    });
    if (labels.groupLabel === undefined) {
        return crumbs;
    }
    crumbs.push({
        slot: 'group', label: labels.groupLabel, target: 'exercise', clickable: labels.exerciseLabel !== undefined
    });
    if (labels.exerciseLabel === undefined) {
        return crumbs;
    }
    crumbs.push({
        slot: 'exercise', label: labels.exerciseLabel, target: 'scheme', clickable: labels.schemeLabel !== undefined
    });
    if (labels.schemeLabel === undefined) {
        return crumbs;
    }
    crumbs.push({ slot: 'scheme', label: labels.schemeLabel, target: 'scheme', clickable: false });
    return crumbs;
}
</script>

<template>
  <div class="crumb">
    <template
      v-for="(item, index) in items"
      :key="item.slot"
    >
      <AppIcon
        v-if="index > 0"
        name="next"
      />
      <button
        v-if="item.clickable"
        type="button"
        @click="emit('select', item.target)"
      >
        {{ item.label }}
      </button>
      <b v-else>{{ item.label }}</b>
    </template>
  </div>
</template>

<style scoped>
.crumb {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
    margin: 2px 0 14px;
    font-size: 12px;
    color: var(--text-dim);
}

.crumb button {
    font: inherit;
    font-size: 12px;
    padding: 3px 8px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--text-dim);
}

.crumb button:hover {
    color: var(--accent);
    border-color: var(--accent-line);
}

.crumb b {
    color: var(--text);
    font-weight: 650;
    padding: 3px 2px;
}

.crumb svg {
    width: 12px;
    height: 12px;
    color: var(--text-faint);
}
</style>
