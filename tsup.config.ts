import { defineConfig } from 'tsup';

export default defineConfig({
  format: ['cjs'],
  entry: ['src/index.ts'],
  target: 'node14',
  splitting: true,
  sourcemap: false,
  clean: true,
  dts: true,
});
