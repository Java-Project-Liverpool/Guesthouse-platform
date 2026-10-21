import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The React plugin provides JSX support and Fast Refresh during development.
export default defineConfig({
  plugins: [react()],
})
