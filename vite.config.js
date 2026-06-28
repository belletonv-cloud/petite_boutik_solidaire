import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    conditions: ['onnxruntime-web-use-extern-wasm'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Explicitly resolve the extern-WASM entry for the nested dependency.
      // This keeps the package buildable while still relying on the extern
      // variant selected through resolve.conditions.
      'onnxruntime-web': fileURLToPath(new URL(
        './node_modules/@bunnio/rembg-web/node_modules/onnxruntime-web/dist/ort.min.mjs',
        import.meta.url
      ))
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@bunnio/rembg-web') || id.includes('onnxruntime-web')) {
            return 'vendor-admin'
          }
        }
      }
    }
  }
})
