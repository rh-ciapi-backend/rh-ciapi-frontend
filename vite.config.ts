import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: false,
        includeAssets: [
          'icons/apple-touch-icon.png',
          'icons/ciapi-192.png',
          'icons/ciapi-512.png',
          'icons/ciapi-maskable-512.png',
        ],
        manifest: {
          id: '/',
          name: 'CIAPI',
          short_name: 'CIAPI',
          description: 'Centro Integrado de Atenção à Pessoa Idosa',
          lang: 'pt-BR',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'any',
          theme_color: '#0b1220',
          background_color: '#0b1220',
          categories: ['business', 'productivity', 'medical'],
          icons: [
            {
              src: '/icons/ciapi-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/ciapi-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/ciapi-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: false,
          globPatterns: [
            '**/*.{js,css,html,ico,png,svg,webp,woff,woff2}',
          ],
          runtimeCaching: [],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(
        env.GEMINI_API_KEY,
      ),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
