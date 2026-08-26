<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from 'vue';

import AppIcon from '@/components/icon/AppIcon.vue';
import BusyButton from '@/components/feedback/BusyButton.vue';
import ImportSummaryCard from '@/components/backup/ImportSummaryCard.vue';
import ConfirmDialog from '@/components/feedback/ConfirmDialog.vue';
import InfoBanner from '@/components/feedback/InfoBanner.vue';
import ToastMessage from '@/components/feedback/ToastMessage.vue';
import AppTopBar from '@/components/shell/AppTopBar.vue';
import { useAsyncAction } from '@/composables/useAsyncAction';
import { useBackup } from '@/composables/useBackup';
import { sharedLoadingIndicator } from '@/composables/useLoadingIndicator';
import { useStorageStatus } from '@/composables/useStorageStatus';
import { todayLocalDate } from '@/domain/localDate';
import type { PersistenceRequestOutcome } from '@/persistence/storagePersistence';
import { describeAllDataLoss, formatWorkoutDayShort } from '@/presentation/italianFormat';

type DataViewDialog =
    | { readonly kind: 'replace-import' }
    | { readonly kind: 'reset-warning' }
    | { readonly kind: 'reset-final' };

const PERSISTENCE_OUTCOME_MESSAGES: Record<PersistenceRequestOutcome, string> = {
    granted: 'Storage persistente concesso.',
    denied: 'Il browser ha rifiutato la richiesta: installa l\'app sul dispositivo per ottenere lo storage persistente.',
    unavailable: 'Il browser non supporta lo storage persistente.'
};

const backup = useBackup();
const storage = useStorageStatus();

const fileInputRef = useTemplateRef('fileInput');
const activeDialog = ref<DataViewDialog>();
const toastMessage = ref<string>();

onMounted(() => {
    void sharedLoadingIndicator.track(() => backup.loadLastBackupDate());
    void sharedLoadingIndicator.track(() => storage.refresh());
});

const lastBackupLabel = computed(() => (
    backup.lastBackupDate.value ? formatWorkoutDayShort(backup.lastBackupDate.value) : 'Mai'
));
const exportFileNameHint = computed(() => {
    const today = todayLocalDate();
    return `gym-tracker-backup-${today}.json`;
});

const isReplaceDialogOpen = computed(() => activeDialog.value?.kind === 'replace-import');
const isResetWarningOpen = computed(() => activeDialog.value?.kind === 'reset-warning');
const isResetFinalOpen = computed(() => activeDialog.value?.kind === 'reset-final');
const noWorkoutsToReset = computed(() => storage.totals.value.workouts === 0);
const resetWarningBody = computed(() => describeAllDataLoss(
    storage.totals.value.workouts,
    storage.totals.value.exercises,
    storage.totals.value.sets
));

function chooseFile(): void {
    fileInputRef.value?.click();
}

async function handleFileChosen(): Promise<void> {
    const input = fileInputRef.value;
    const file = input?.files?.[0];
    if (!input || !file) {
        return;
    }
    input.value = '';
    const fileContent = await file.text();
    await backup.prepareImport(fileContent);
}

const persistenceAction = useAsyncAction(async () => {
    const outcome = await storage.requestPersistence();
    toastMessage.value = PERSISTENCE_OUTCOME_MESSAGES[outcome];
});

const exportAction = useAsyncAction(async () => {
    await backup.exportBackup();
    toastMessage.value = 'Backup esportato';
});

const mergeAction = useAsyncAction(async () => {
    await backup.confirmMerge();
    toastMessage.value = 'Backup importato';
    await storage.refresh();
});

function askReplace(): void {
    activeDialog.value = { kind: 'replace-import' };
}

function cancelReplace(): void {
    activeDialog.value = undefined;
}

const replaceAction = useAsyncAction(async () => {
    try {
        await backup.confirmReplace();
        toastMessage.value = 'Dati sostituiti';
        await storage.refresh();
    } finally {
        activeDialog.value = undefined;
    }
});

function startReset(): void {
    activeDialog.value = { kind: 'reset-warning' };
}

function cancelResetDialog(): void {
    activeDialog.value = undefined;
}

function proceedToFinalReset(): void {
    activeDialog.value = { kind: 'reset-final' };
}

const resetAction = useAsyncAction(async () => {
    try {
        await backup.resetAllData();
        await storage.refresh();
        toastMessage.value = 'Dati azzerati';
    } finally {
        activeDialog.value = undefined;
    }
});
</script>

<template>
  <AppTopBar title="Dati e backup" />

  <div class="sec">
    <h2>Stato locale</h2>
  </div>
  <div class="card">
    <div class="kv-row">
      <b>Storage persistente</b>
      <span
        v-if="storage.storageStatus.value?.persisted"
        class="badge badge--done"
      ><i />Concesso</span>
      <BusyButton
        v-else-if="storage.storageStatus.value?.canRequestPersistence"
        class="btn btn--outline btn--sm"
        :busy="persistenceAction.pending.value"
        @click="persistenceAction.run"
      >
        Richiedi
      </BusyButton>
      <span
        v-else-if="storage.storageStatus.value"
        class="faint"
      >Non disponibile</span>
    </div>
    <div class="kv-row">
      <b>Ultimo backup</b>
      <span>{{ lastBackupLabel }}</span>
    </div>
    <div class="kv-row">
      <b>Allenamenti</b>
      <span class="num">{{ storage.totals.value.workouts }}</span>
    </div>
    <div class="kv-row">
      <b>Esercizi · serie</b>
      <span class="num">{{ storage.totals.value.exercises }} · {{ storage.totals.value.sets }}</span>
    </div>
  </div>

  <div class="sec">
    <h2>Esportazione</h2>
  </div>
  <BusyButton
    class="btn btn--primary btn--block"
    icon="down_tray"
    :busy="exportAction.pending.value"
    @click="exportAction.run"
  >
    Esporta backup JSON
  </BusyButton>
  <p class="faint hint">
    {{ exportFileNameHint }} · formato versione 1
  </p>

  <div class="sec">
    <h2>Importazione</h2>
  </div>
  <input
    ref="fileInput"
    type="file"
    accept="application/json"
    class="file-input"
    aria-hidden="true"
    tabindex="-1"
    @change="handleFileChosen"
  >
  <button
    type="button"
    class="btn btn--outline btn--block"
    @click="chooseFile"
  >
    <AppIcon name="up_tray" />Scegli un file di backup
  </button>

  <InfoBanner
    v-if="backup.importReadiness.value.state === 'invalid'"
    tone="warn"
    class="import-feedback"
  >
    {{ backup.importReadiness.value.reason }}
  </InfoBanner>
  <ImportSummaryCard
    v-else-if="backup.importReadiness.value.state === 'ready'"
    :summary="backup.importReadiness.value.summary"
    :busy="mergeAction.pending.value"
    class="import-feedback"
    @merge="mergeAction.run"
    @replace="askReplace"
  />
  <p
    v-else
    class="faint hint"
  >
    Il file viene validato per intero prima di toccare il database. Un file non valido lascia i dati intatti.
  </p>

  <div class="sec sec--danger">
    <h2>Zona pericolosa</h2>
  </div>
  <div class="danger-zone">
    <p>Azzera tutti gli allenamenti e la data dell'ultimo backup, riportando l'app allo stato di primo avvio.</p>
    <button
      type="button"
      class="btn btn--danger btn--block"
      :disabled="noWorkoutsToReset"
      @click="startReset"
    >
      <AppIcon name="trash" />Azzera tutti i dati
    </button>
    <p
      v-if="noWorkoutsToReset"
      class="faint hint"
    >
      Non ci sono allenamenti da azzerare.
    </p>
  </div>

  <ConfirmDialog
    :open="isReplaceDialogOpen"
    title="Sostituire tutti i dati?"
    body="I dati locali verranno rimpiazzati da quelli del file, in una sola operazione."
    confirm-label="Sostituisci"
    :busy="replaceAction.pending.value"
    @cancel="cancelReplace"
    @confirm="replaceAction.run"
  />
  <ConfirmDialog
    :open="isResetWarningOpen"
    title="Azzerare tutti i dati?"
    :body="resetWarningBody"
    confirm-label="Continua"
    @cancel="cancelResetDialog"
    @confirm="proceedToFinalReset"
  />
  <ConfirmDialog
    :open="isResetFinalOpen"
    title="Confermare l'azzeramento?"
    body="Operazione irreversibile: non esiste alcun modo per recuperare i dati dopo la conferma."
    confirm-label="Azzera tutto"
    :busy="resetAction.pending.value"
    @cancel="cancelResetDialog"
    @confirm="resetAction.run"
  />
  <ToastMessage
    :message="toastMessage"
    @dismissed="toastMessage = undefined"
  />
</template>

<style scoped>
.kv-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 14px;
}

.kv-row + .kv-row {
    border-top: 1px solid var(--border);
}

.kv-row b {
    font-weight: 600;
    font-size: 14px;
}

.kv-row span {
    margin-left: auto;
    font-size: 13.5px;
    color: var(--text-dim);
    font-variant-numeric: tabular-nums;
}

.kv-row .badge {
    margin-left: auto;
}

.hint {
    font-size: 12.5px;
    margin: 9px 2px 0;
}

.import-feedback {
    margin-top: 12px;
}

.file-input {
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

.sec--danger {
    margin-top: 36px;
}

.sec--danger h2 {
    color: var(--danger);
}

.danger-zone {
    padding: 14px;
    border: 1px solid var(--danger);
    border-radius: var(--r-lg);
    background: var(--danger-soft);
}

.danger-zone p {
    margin: 0 0 12px;
    font-size: 13px;
    color: var(--text-dim);
}

.danger-zone .hint {
    margin: 9px 0 0;
}
</style>
