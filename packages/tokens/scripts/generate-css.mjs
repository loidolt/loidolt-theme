import { mkdir, writeFile } from 'node:fs/promises';
import { builtInPresets, generateCss, generateDarkCss, presetStylesheets } from '../dist/index.js';

const dist = new URL('../dist/', import.meta.url);
const presets = new URL('presets/', dist);
await mkdir(presets, { recursive: true });
await Promise.all([
  writeFile(new URL('tokens.css', dist), generateCss()),
  writeFile(new URL('dark.css', dist), generateDarkCss('attribute')),
  writeFile(new URL('dark-auto.css', dist), generateDarkCss('auto')),
  ...builtInPresets.flatMap((preset) =>
    Object.entries(presetStylesheets(preset)).map(([file, css]) =>
      writeFile(new URL(file, presets), css)
    )
  ),
]);
