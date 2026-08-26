<script setup lang="ts">
import AppTabBar from '@/components/shell/AppTabBar.vue';
import UpdateBar from '@/components/shell/UpdateBar.vue';
import { sharedLoadingIndicator } from '@/composables/useLoadingIndicator';
</script>

<template>
  <div id="app">
    <main
      id="view"
      :aria-busy="sharedLoadingIndicator.visible.value"
    >
      <RouterView />
    </main>
    <UpdateBar />
    <AppTabBar />
  </div>
</template>

<style scoped>
#app {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100dvh;
    background: var(--bg);
    overflow: hidden;
}

#view {
    flex: 1 1 auto;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior-y: contain;
    padding: 0 var(--gutter) 28px;
    outline: none;
}

@media (min-width: 760px) and (min-height: 700px) {
    #app {
        width: 392px;
        height: 812px;
        border-radius: 40px;
        border: 1px solid var(--border-strong);
        box-shadow: 0 40px 80px -40px rgba(0, 0, 0, .7);
    }
}
</style>
