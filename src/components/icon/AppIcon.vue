<script setup lang="ts">
export type IconName =
    | 'home'
    | 'dumbbell'
    | 'plus'
    | 'chart'
    | 'archive'
    | 'back'
    | 'next'
    | 'chev'
    | 'check'
    | 'trash'
    | 'up'
    | 'down'
    | 'copy'
    | 'note'
    | 'info'
    | 'warn'
    | 'empty'
    | 'down_tray'
    | 'up_tray'
    | 'x';

defineProps<{ name: IconName }>();
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      v-if="name === 'home'"
      d="M4 10.5L12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-5.5H9V20H5a1 1 0 0 1-1-1z"
    />
    <path
      v-else-if="name === 'dumbbell'"
      d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11"
    />
    <path
      v-else-if="name === 'plus'"
      d="M12 5v14M5 12h14"
    />
    <template v-else-if="name === 'chart'">
      <path d="M4 19V5M4 19h16" />
      <path d="M7.5 15l3.5-4 3 2.5L20 7" />
    </template>
    <template v-else-if="name === 'archive'">
      <rect
        x="3.5"
        y="4"
        width="17"
        height="5"
        rx="1.5"
      />
      <path d="M5 9v9.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V9M10 13h4" />
    </template>
    <path
      v-else-if="name === 'back'"
      d="M15 5l-7 7 7 7"
    />
    <path
      v-else-if="name === 'next'"
      d="M9 5l7 7-7 7"
    />
    <path
      v-else-if="name === 'chev'"
      d="M6 9.5l6 6 6-6"
    />
    <path
      v-else-if="name === 'check'"
      d="M4.5 12.5l5 5 10-11"
    />
    <path
      v-else-if="name === 'trash'"
      d="M4 7h16M9 7V4.8A.8.8 0 0 1 9.8 4h4.4a.8.8 0 0 1 .8.8V7M6.5 7l.8 12.3A.8.8 0 0 0 8.1 20h7.8a.8.8 0 0 0 .8-.7L17.5 7"
    />
    <path
      v-else-if="name === 'up'"
      d="M12 19V6M6 12l6-6 6 6"
    />
    <path
      v-else-if="name === 'down'"
      d="M12 5v13M6 12l6 6 6-6"
    />
    <template v-else-if="name === 'copy'">
      <rect
        x="8.5"
        y="8.5"
        width="11"
        height="11"
        rx="2"
      />
      <path d="M15.5 5.5h-9a2 2 0 0 0-2 2v9" />
    </template>
    <path
      v-else-if="name === 'note'"
      d="M5 5h14M5 10h14M5 15h9"
    />
    <template v-else-if="name === 'info'">
      <circle
        cx="12"
        cy="12"
        r="8.2"
      />
      <path d="M12 11v5.5M12 7.9v.2" />
    </template>
    <template v-else-if="name === 'warn'">
      <path d="M12 4.5l8.5 15h-17z" />
      <path d="M12 10v4M12 16.6v.2" />
    </template>
    <template v-else-if="name === 'empty'">
      <rect
        x="3.5"
        y="6"
        width="17"
        height="14"
        rx="2.5"
      />
      <path d="M8 3.5v4M16 3.5v4M3.5 11h17" />
    </template>
    <path
      v-else-if="name === 'down_tray'"
      d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"
    />
    <path
      v-else-if="name === 'up_tray'"
      d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 19.5h14"
    />
    <path
      v-else-if="name === 'x'"
      d="M6 6l12 12M18 6L6 18"
    />
  </svg>
</template>
