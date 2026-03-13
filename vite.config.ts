import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { load } from 'js-yaml'

function yamlPlugin(): Plugin {
  return {
    name: 'yaml-import',
    transform(code, id) {
      if (id.endsWith('.yaml') || id.endsWith('.yml')) {
        const data = load(code)
        return { code: `export default ${JSON.stringify(data)}`, map: null }
      }
    },
  }
}

export default defineConfig({
  plugins: [
    yamlPlugin(),
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['simsa.svg'],
      manifest: {
        name: 'Simsa',
        short_name: 'Simsa',
        description: 'Application de notation pour passages de grades de taekwondo',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,md}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
