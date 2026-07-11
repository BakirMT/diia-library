import { build } from 'vite';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  await build({
    root: __dirname,
    build: {
      lib: {
        entry: path.resolve(__dirname, 'test-entry.js'),
        name: 'Test',
        formats: ['es']
      },
      write: true,
      rollupOptions: {
        external: []
      }
    }
  });
}
run();
