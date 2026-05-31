import { defineConfig } from 'tsdown';

export default defineConfig({
  format: ['cjs', 'esm'],
  entry: ['src/index.ts'],
  outExtensions: b =>
    b.format === 'cjs'
      ? {
          js: '.cjs',
          dts: '.d.cts',
        }
      : {
          js: '.js',
          dts: '.d.ts',
        },
  outDir: 'dist',
  target: 'node22',
  sourcemap: false,
  clean: true,
  dts: true,
});
