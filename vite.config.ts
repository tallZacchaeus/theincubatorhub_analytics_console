import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Standalone marketing console SPA (React). Talks to the shared Laravel API over
// the Sanctum stateful-cookie flow (ported in a later phase). Runtime API host
// comes from VITE_API_BASE_URL. Dev server runs on 5174 to match the prior setup.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: { port: 5174 },
  build: {
    rollupOptions: {
      output: {
        /*
         * Pull the large, slow-moving dependencies into their own chunks, so a
         * deploy that changes application code doesn't invalidate them and
         * returning admins re-download kilobytes rather than hundreds.
         *
         * Only two manual chunks, and Recharts is deliberately NOT one of them.
         *
         * Naming Recharts here made things worse, which is worth recording so
         * nobody "optimises" it back. Recharts is ~404 kB and is imported by
         * three report pages only. Forcing it into its own chunk also pulled in
         * one small utility that eagerly-loaded code shares, which made the
         * whole chunk a static import of the entry — so the login screen
         * preloaded 404 kB of charting it would never render. Measured:
         * first-load gzip went from 191 kB back up to 302 kB.
         *
         * Left alone, Rollup keeps the shared utility in the common chunk and
         * the charting bulk in a lazy one, which is exactly what we want. The
         * lesson generalises: manually chunking a heavy package is only safe
         * when nothing on the eager path shares any of its dependencies.
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          // Framework core — changes only on a React/Router upgrade.
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) {
            return 'vendor-react';
          }

          // Animation + the guided tour: presentational, and not needed to
          // render or read any page.
          if (/[\\/]node_modules[\\/](gsap|@gsap[\\/]react|driver\.js)[\\/]/.test(id)) {
            return 'vendor-motion';
          }

          return undefined;
        },
      },
    },
  },
});
