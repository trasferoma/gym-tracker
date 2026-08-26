import { readonly, ref, type Ref } from 'vue';
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

import { sharedLoadingIndicator } from '@/composables/useLoadingIndicator';

export type PrimaryRouteName = 'home' | 'history' | 'statistics' | 'data';
export type RouteName = PrimaryRouteName | 'new' | 'workout';

export const PRIMARY_ROUTE_NAMES: readonly PrimaryRouteName[] = ['home', 'history', 'statistics', 'data'];

const routes: RouteRecordRaw[] = [
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
    { path: '/allenamenti', name: 'history', component: () => import('@/views/WorkoutHistoryView.vue') },
    { path: '/nuovo', name: 'new', component: () => import('@/views/NewWorkoutView.vue') },
    { path: '/allenamenti/:id', name: 'workout', component: () => import('@/views/WorkoutDetailView.vue'), props: true },
    { path: '/statistiche', name: 'statistics', component: () => import('@/views/StatisticsView.vue') },
    { path: '/dati', name: 'data', component: () => import('@/views/DataView.vue') }
];

export const router = createRouter({
    history: createWebHistory(),
    routes
});

const backTarget: Ref<PrimaryRouteName> = ref('home');

export const backTargetRoute = readonly(backTarget);

export function rememberBackTarget(routeName: PrimaryRouteName): void {
    backTarget.value = routeName;
}

export function isPrimaryRouteName(name: unknown): name is PrimaryRouteName {
    return typeof name === 'string' && (PRIMARY_ROUTE_NAMES as readonly string[]).includes(name);
}

router.beforeEach((to, from) => {
    const entersSecondaryRoute = to.name === 'new' || to.name === 'workout';
    if (entersSecondaryRoute && isPrimaryRouteName(from.name)) {
        rememberBackTarget(from.name);
    }
});

let endNavigationTracking: (() => void) | undefined;

router.beforeEach(() => {
    endNavigationTracking?.();
    endNavigationTracking = sharedLoadingIndicator.beginImmediate();
});

router.afterEach(() => {
    endNavigationTracking?.();
    endNavigationTracking = undefined;
});

router.onError(() => {
    endNavigationTracking?.();
    endNavigationTracking = undefined;
});
