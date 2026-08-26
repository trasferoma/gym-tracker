<script setup lang="ts">
import AppIcon from '@/components/icon/AppIcon.vue';
import { usePwaUpdate } from '@/composables/usePwaUpdate';

const pwaUpdate = usePwaUpdate();
</script>

<template>
  <div
    v-if="pwaUpdate.updateAvailable.value"
    class="update-bar"
  >
    <span>Nuova versione disponibile</span>
    <button
      type="button"
      class="btn btn--primary btn--sm"
      @click="pwaUpdate.applyUpdate"
    >
      Aggiorna
    </button>
    <button
      type="button"
      class="icon-btn"
      aria-label="Ignora"
      @click="pwaUpdate.dismiss"
    >
      <AppIcon name="x" />
    </button>
  </div>
</template>

<style scoped>
.update-bar {
    position: absolute;
    left: 10px;
    right: 10px;
    bottom: calc(env(safe-area-inset-bottom) + 70px);
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 10px 10px 14px;
    border-radius: var(--r-md);
    background: var(--surface-3);
    border: 1px solid var(--border-strong);
    box-shadow: 0 12px 30px -14px rgba(0, 0, 0, .7);
    font-size: 13px;
    z-index: 4;
    animation: rise .28s ease both;
}

@keyframes rise {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
}

.update-bar span {
    flex: 1 1 auto;
}
</style>
