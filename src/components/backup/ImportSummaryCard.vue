<script setup lang="ts">
import BusyButton from '@/components/feedback/BusyButton.vue';
import type { BackupImportSummary } from '@/backup/backupImportPlan';
import { formatCount } from '@/presentation/italianFormat';

const props = withDefaults(defineProps<{ summary: BackupImportSummary; busy?: boolean }>(), {
    busy: false
});

const emit = defineEmits<{ merge: []; replace: [] }>();

const totalLabel = formatCount(props.summary.totalInFile, 'allenamento nel file', 'allenamenti nel file');
const newLabel = formatCount(props.summary.newCount, 'nuovo', 'nuovi');
const presentLabel = formatCount(props.summary.alreadyPresentCount, 'già presente', 'già presenti');
</script>

<template>
  <div class="card import-sum">
    <b>File valido</b> <span class="chip chip--accent">versione 1</span>
    <ul>
      <li>{{ totalLabel }}</li>
      <li>{{ newLabel }}, {{ presentLabel }}</li>
      <li>{{ summary.newerThanLocalCount }} con <span class="num">updatedAt</span> più recente del locale</li>
    </ul>
    <div class="row-actions">
      <BusyButton
        class="btn btn--primary btn--sm"
        :busy="busy"
        @click="emit('merge')"
      >
        Unisci
      </BusyButton>
      <button
        type="button"
        class="btn btn--danger btn--sm"
        :disabled="busy"
        @click="emit('replace')"
      >
        Sostituisci tutto
      </button>
    </div>
  </div>
</template>

<style scoped>
.import-sum {
    padding: 13px 14px;
}

.import-sum ul {
    margin: 9px 0 0;
    padding-left: 18px;
    font-size: 13px;
    color: var(--text-dim);
}

.import-sum li + li {
    margin-top: 3px;
}
</style>
