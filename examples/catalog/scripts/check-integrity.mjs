import { readFile, readdir } from 'node:fs/promises';
import { PACKAGES } from './packages.mjs';

const root = new URL('../', import.meta.url);
const demos = new URL('src/lib/demos/', root);

const demoNames = new Set(
  (await readdir(demos)).filter((file) => file.endsWith('.svelte')).map((file) => file.slice(0, -7))
);

const registry = await readFile(new URL('src/lib/registry.ts', root), 'utf8');
/** Every entry opens with `slug`, `name` and — outside theme-svelte — `package`, in that order. */
const registryEntries = [
  ...registry.matchAll(/^\s+slug: '([^']+)',\n\s+name: '(\w+)',(?:\n\s+package: '(\w+)',)?/gm),
].map(([, slug, name, pkg]) => ({ slug, name, package: pkg ?? 'svelte' }));
const registryNames = registryEntries.map((entry) => entry.name);
const registrySlugs = registryEntries.map((entry) => entry.slug);
if (registryEntries.length !== [...registry.matchAll(/^\s+slug: '/gm)].length) {
  throw new Error('registry: every entry must start with `slug`, then `name`, then `package`');
}

const props = JSON.parse(await readFile(new URL('src/lib/generated/props.json', root), 'utf8'));

function difference(left, right) {
  return [...left].filter((name) => !right.has(name)).sort();
}

function assertSame(label, expected, actual) {
  const missing = difference(expected, actual);
  const extra = difference(actual, expected);
  if (missing.length || extra.length) {
    throw new Error(
      `${label} differs from component sources; missing: ${missing.join(', ') || 'none'}; extra: ${extra.join(', ') || 'none'}`
    );
  }
}

const allComponents = new Set();
const summary = [];

for (const pkg of PACKAGES) {
  const componentNames = new Set(
    (await readdir(pkg.components))
      .filter((file) => file.endsWith('.svelte'))
      .map((file) => file.slice(0, -7))
  );
  for (const name of componentNames) {
    if (allComponents.has(name)) throw new Error(`${name} is a component in two packages`);
    allComponents.add(name);
  }

  const index = await readFile(pkg.barrel, 'utf8');
  const exportNames = new Set(
    [...index.matchAll(/export \{ default as (\w+) \} from '\.\/components\//g)].map(
      (match) => match[1]
    )
  );
  const inPackage = (entryPackage) => entryPackage === pkg.id;

  assertSame(`${pkg.name} barrel exports`, componentNames, exportNames);
  assertSame(
    `${pkg.name} registry entries`,
    componentNames,
    new Set(registryEntries.filter((entry) => inPackage(entry.package)).map((entry) => entry.name))
  );
  assertSame(
    `${pkg.name} prop docs`,
    componentNames,
    new Set(
      Object.entries(props)
        .filter(([, docs]) => inPackage(docs.package))
        .map(([name]) => name)
    )
  );

  // The README's component list is the first thing a reader scans, and it silently fell behind
  // when a whole release of components landed without it.
  const readme = await readFile(pkg.readme, 'utf8');
  const componentsSection = readme.split(/^## Components$/m)[1]?.split(/^#{2,3} /m)[0] ?? '';
  const readmeNames = new Set([...componentsSection.matchAll(/`([A-Z]\w+)`/g)].map((m) => m[1]));
  const unlisted = difference(componentNames, readmeNames);
  if (unlisted.length) {
    throw new Error(`${pkg.name} README "## Components" does not list: ${unlisted.join(', ')}`);
  }
  summary.push(`${pkg.id} ${componentNames.size}`);
}

assertSame('catalog demos', allComponents, demoNames);
assertSame('catalog registry', allComponents, new Set(registryNames));

for (const [label, values] of [
  ['registry names', registryNames],
  ['registry slugs', registrySlugs],
]) {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
  if (duplicates.length)
    throw new Error(`${label} contain duplicates: ${[...new Set(duplicates)].join(', ')}`);
}

console.log(
  `catalog integrity: ${allComponents.size} components (${summary.join(', ')}) agree across sources, exports, demos, registry, prop docs and READMEs`
);
