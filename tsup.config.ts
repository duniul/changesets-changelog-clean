import { defineConfig } from 'tsup';

export default defineConfig({
  format: ['cjs', 'esm'],
  entry: ['src/index.ts'],
  outDir: 'dist',
  target: 'node14',
  splitting: true,
  sourcemap: false,
  clean: true,
  dts: true,
});
