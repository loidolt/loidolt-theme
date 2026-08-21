import { mkdir, writeFile } from 'node:fs/promises';
import { generateCss, generateDarkCss } from '../dist/index.js';

const dist = new URL('../dist/', import.meta.url);
await mkdir(dist, { recursive: true });
await Promise.all([
  writeFile(new URL('tokens.css', dist), generateCss()),
  writeFile(new URL('dark.css', dist), generateDarkCss('attribute')),
  writeFile(new URL('dark-auto.css', dist), generateDarkCss('auto')),
]);
