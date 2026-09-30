/**
 * Reads the prop contract straight out of each component's source and writes it to
 * `src/lib/generated/props.json`, which the documentation pages render as tables.
 *
 * Generating rather than hand-writing is the whole point: a prop table maintained by hand is
 * wrong within a release, and wrong documentation is worse than none. Anything this script
 * cannot find is absent from the docs, which shows up as a visibly empty table rather than as
 * a quiet lie.
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { PACKAGES } from './packages.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const outFile = path.resolve(here, '../src/lib/generated/props.json');

/** Pulls the instance `<script>` out of a component, with its offset kept for nothing but sanity. */
function instanceScript(source) {
  const match = source.match(/<script\b(?![^>]*\bmodule\b)[^>]*>([\s\S]*?)<\/script>/);
  return match ? match[1] : '';
}

const docOf = (node) => {
  const [doc] = ts.getJSDocCommentsAndTags(node);
  const comment = doc?.comment;
  if (!comment) return undefined;
  const text = typeof comment === 'string' ? comment : comment.map((part) => part.text).join('');
  // Collapse the wrapping that keeps source comments inside the line limit.
  return text.replace(/\s*\n\s*/g, ' ').trim();
};

/** Members of a `Props` interface or type alias, following local interfaces it composes. */
function collectMembers(node, locals, out, bases, optional) {
  if (ts.isInterfaceDeclaration(node)) {
    for (const clause of node.heritageClauses ?? []) {
      for (const type of clause.types) resolveBase(type, locals, out, bases, optional);
    }
    out.push(...node.members);
    return;
  }
  if (ts.isTypeAliasDeclaration(node)) {
    return collectFromType(node.type, locals, out, bases, optional);
  }
  if (ts.isTypeLiteralNode(node)) out.push(...node.members);
}

function collectFromType(type, locals, out, bases, optional) {
  if (ts.isTypeLiteralNode(type)) {
    out.push(...type.members);
    return;
  }
  if (ts.isIntersectionTypeNode(type)) {
    for (const member of type.types) collectFromType(member, locals, out, bases, optional);
    return;
  }
  if (ts.isParenthesizedTypeNode(type)) {
    return collectFromType(type.type, locals, out, bases, optional);
  }
  /*
   * A union of prop shapes — Button's `href` discrimination. Every branch is documented once,
   * but nothing inside one can be *required*: whichever branch a caller picks, the other
   * branch's props are absent. Marking them required would tell readers to pass both `href`
   * and the button-only attributes, which is exactly what the union forbids.
   */
  if (ts.isUnionTypeNode(type)) {
    const branchMembers = [];
    for (const member of type.types)
      collectFromType(member, locals, branchMembers, bases, optional);
    for (const member of branchMembers) {
      if (ts.isPropertySignature(member) && member.name) {
        optional.add(member.name.getText(member.getSourceFile()).replace(/^['"]|['"]$/g, ''));
      }
    }
    out.push(...branchMembers);
    return;
  }
  resolveBase(type, locals, out, bases, optional);
}

/** A named type: inline it when it is declared in the same file, otherwise note it as a base. */
function resolveBase(type, locals, out, bases, optional) {
  const expression = type.expression ?? type.typeName;
  const name = expression?.getText?.(expression.getSourceFile?.());
  const text = type.getText(type.getSourceFile());
  if (name && locals.has(name)) {
    collectMembers(locals.get(name), locals, out, bases, optional);
    return;
  }
  if (text) bases.push(text);
}

/** `let { a = 1, ref = $bindable(null), ...rest } = $props()` → defaults and bindable flags. */
function destructuredDefaults(sourceFile) {
  const defaults = new Map();
  const bindable = new Set();

  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      node.initializer.expression.getText(sourceFile) === '$props' &&
      ts.isObjectBindingPattern(node.name)
    ) {
      for (const element of node.name.elements) {
        const key = (element.propertyName ?? element.name).getText(sourceFile);
        const init = element.initializer?.getText(sourceFile);
        if (!init) continue;
        const asBindable = init.match(/^\$bindable\((.*)\)$/s);
        if (asBindable) {
          bindable.add(key);
          const inner = asBindable[1].trim();
          if (inner) defaults.set(key, inner);
        } else {
          defaults.set(key, init);
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return { defaults, bindable };
}

function extract(name, source) {
  const script = instanceScript(source);
  const sourceFile = ts.createSourceFile(`${name}.ts`, script, ts.ScriptTarget.ESNext, true);

  const locals = new Map();
  for (const statement of sourceFile.statements) {
    if (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) {
      locals.set(statement.name.text, statement);
    }
  }

  const declaration = locals.get('Props');
  if (!declaration) return { bases: [], props: [] };

  const members = [];
  const bases = [];
  /** Props that live in one branch of a union, and so can never be required. */
  const optional = new Set();
  collectMembers(declaration, locals, members, bases, optional);

  const { defaults, bindable } = destructuredDefaults(sourceFile);
  const seen = new Set();
  const props = [];

  for (const member of members) {
    if (!ts.isPropertySignature(member) || !member.name) continue;
    const propName = member.name.getText(sourceFile).replace(/^['"]|['"]$/g, '');
    if (seen.has(propName)) continue;
    seen.add(propName);

    props.push({
      name: propName,
      type: member.type ? member.type.getText(sourceFile).replace(/\s*\n\s*/g, ' ') : 'unknown',
      required: !member.questionToken && !optional.has(propName),
      bindable: bindable.has(propName),
      default: defaults.get(propName),
      doc: docOf(member),
    });
  }

  props.sort((a, b) => {
    // Required props first — they are what a reader needs before anything else.
    if (a.required !== b.required) return a.required ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return { bases: [...new Set(bases)], props };
}

const result = {};
let count = 0;

for (const pkg of PACKAGES) {
  const dir = fileURLToPath(pkg.components);
  const files = (await readdir(dir)).filter((file) => file.endsWith('.svelte')).sort();
  for (const file of files) {
    const name = path.basename(file, '.svelte');
    // Component names share one catalog namespace (one URL, one demo file each).
    if (result[name])
      throw new Error(`${name} is defined by both ${result[name].package} and ${pkg.id}`);
    result[name] = {
      package: pkg.id,
      ...extract(name, await readFile(path.join(dir, file), 'utf8')),
    };
    count += 1;
  }
}

const sorted = Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));

await mkdir(path.dirname(outFile), { recursive: true });
await writeFile(outFile, `${JSON.stringify(sorted, null, 2)}\n`);

const total = Object.values(result).reduce((sum, entry) => sum + entry.props.length, 0);
console.log(
  `props: ${count} components, ${total} props → ${path.relative(process.cwd(), outFile)}`
);
