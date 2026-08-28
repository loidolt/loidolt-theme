import { readFile, readdir } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const components = new URL('../../packages/svelte/src/lib/components/', root);
const demos = new URL('src/lib/demos/', root);

const componentNames = new Set(
  (await readdir(components))
    .filter((file) => file.endsWith('.svelte'))
    .map((file) => file.slice(0, -7))
);
const demoNames = new Set(
  (await readdir(demos)).filter((file) => file.endsWith('.svelte')).map((file) => file.slice(0, -7))
);

const index = await readFile(new URL('../../packages/svelte/src/lib/index.ts', root), 'utf8');
const exportNames = new Set(
  [...index.matchAll(/export \{ default as (\w+) \} from '\.\/components\//g)].map(
    (match) => match[1]
  )
);

const registry = await readFile(new URL('src/lib/registry.ts', root), 'utf8');
const registryNames = [...registry.matchAll(/^\s+name: '(\w+)',/gm)].map((match) => match[1]);
const registrySlugs = [...registry.matchAll(/^\s+slug: '([^']+)',/gm)].map((match) => match[1]);
const props = new Set(
  Object.keys(JSON.parse(await readFile(new URL('src/lib/generated/props.json', root), 'utf8')))
);

function difference(left, right) {
  return [...left].filter((name) => !right.has(name)).sort();
}

function assertSame(label, actual) {
  const missing = difference(componentNames, actual);
  const extra = difference(actual, componentNames);
  if (missing.length || extra.length) {
    throw new Error(
      `${label} differs from component sources; missing: ${missing.join(', ') || 'none'}; extra: ${extra.join(', ') || 'none'}`
    );
  }
}

assertSame('barrel exports', exportNames);
assertSame('catalog demos', demoNames);
assertSame('generated prop docs', props);
assertSame('catalog registry', new Set(registryNames));

for (const [label, values] of [
  ['registry names', registryNames],
  ['registry slugs', registrySlugs],
]) {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
  if (duplicates.length)
    throw new Error(`${label} contain duplicates: ${[...new Set(duplicates)].join(', ')}`);
}

console.log(
  `catalog integrity: ${componentNames.size} components agree across sources, exports, demos, registry, and prop docs`
);
