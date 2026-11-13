// Bundles the game into www/game.js and copies www/ into the Android assets folder.
// `node scripts/build.mjs --serve` serves www/ on http://localhost:8080 for testing in a browser.
import * as esbuild from 'esbuild';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const serve = process.argv.includes('--serve');

const options = {
  entryPoints: [join(root, 'src/main.js')],
  bundle: true,
  format: 'iife',
  target: ['chrome80'],
  minify: !serve,
  sourcemap: serve,
  outfile: join(root, 'www/game.js'),
  logLevel: 'info',
};

if (serve) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  const { port } = await ctx.serve({ servedir: join(root, 'www'), port: 8080 });
  console.log(`http://localhost:${port}`);
} else {
  await esbuild.build(options);
  const assets = join(root, 'android/app/src/main/assets/www');
  rmSync(assets, { recursive: true, force: true });
  mkdirSync(assets, { recursive: true });
  cpSync(join(root, 'www'), assets, { recursive: true, filter: (src) => !src.endsWith('.map') });
  console.log(`Copié dans ${assets}`);
}
