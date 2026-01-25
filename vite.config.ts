import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env': env
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '~features': path.resolve(__dirname, 'features'),
        '~hooks': path.resolve(__dirname, 'hooks'),
        '~utils': path.resolve(__dirname, 'utils'),
        '~components': path.resolve(__dirname, 'components'),
        '~types': path.resolve(__dirname, 'types'),
      }
    }
  };
});
