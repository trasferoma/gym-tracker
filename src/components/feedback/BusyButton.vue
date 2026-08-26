<script setup lang="ts">
import { computed } from 'vue';

import AppIcon, { type IconName } from '@/components/icon/AppIcon.vue';

const props = defineProps<{
    icon?: IconName;
    busy?: boolean | undefined;
    disabled?: boolean | undefined;
}>();

const isBusy = computed(() => props.busy === true);
const isDisabled = computed(() => isBusy.value || props.disabled === true);
</script>

<template>
  <button
    type="button"
    class="busy-button"
    :disabled="isDisabled"
    :aria-busy="isBusy"
  >
    <span
      v-if="isBusy"
      class="busy-spinner"
      aria-hidden="true"
    />
    <AppIcon
      v-else-if="icon"
      :name="icon"
    />
    <slot />
  </button>
</template>

<style scoped>
.busy-button[disabled] {
    opacity: 1;
    cursor: wait;
}

.busy-button:not([aria-busy="true"])[disabled] {
    opacity: .42;
    cursor: not-allowed;
}

.busy-spinner {
    width: 18px;
    height: 18px;
    flex: 0 0 auto;
    border-radius: 50%;
    border: 2px solid currentColor;
    border-top-color: transparent;
    opacity: .8;
    animation: busy-spin .6s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
    .busy-spinner {
        animation: none;
        opacity: .5;
    }
}

@keyframes busy-spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
