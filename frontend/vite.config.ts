import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Не проксируем сам SPA-маршрут /admin — только API под ним.
      '/admin/owner': 'http://127.0.0.1:8000',
      '/admin/event-types': 'http://127.0.0.1:8000',
      '/admin/meetings': 'http://127.0.0.1:8000',
      '/admin/bookings': 'http://127.0.0.1:8000',
      '/event-types': 'http://127.0.0.1:8000',
      '/bookings': 'http://127.0.0.1:8000',
      '/health': 'http://127.0.0.1:8000',
    },
  },
})
