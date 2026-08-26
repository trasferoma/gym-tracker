import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

const THEME_COLOR = '#0f1211';

export default defineConfig({
    plugins: [
        vue(),
        VitePWA({
            registerType: 'prompt',
            includeAssets: ['favicon.png', 'apple-touch-icon.png'],
            manifest: {
                name: 'Gym Tracker',
                short_name: 'Gym Tracker',
                description: 'Registro degli allenamenti in palestra, offline e senza backend.',
                lang: 'it',
                display: 'standalone',
                theme_color: THEME_COLOR,
                background_color: THEME_COLOR,
                icons: [
                    { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
                    { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
                    { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}']
            }
        })
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    dexie: ['dexie']
                }
            }
        }
    },
    test: {
        environment: 'node',
        include: ['src/**/*.spec.ts'],
        setupFiles: ['./vitest.setup.ts']
    }
});
