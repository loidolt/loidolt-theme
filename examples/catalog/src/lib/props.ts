import data from './generated/props.json';

/** One documented prop, as `scripts/extract-props.mjs` writes it. */
export interface PropDoc {
  name: string;
  /** Type text exactly as the component declares it. */
  type: string;
  required: boolean;
  /** Declared with `$bindable()`, so `bind:` works on it. */
  bindable: boolean;
  /** Default from the `$props()` destructuring, when there is one. */
  default?: string;
  /** The prop's JSDoc comment, unwrapped to one line. */
  doc?: string;
}

export interface ComponentDocs {
  /** Types the props extend or intersect — the attributes forwarded to the root element. */
  bases: string[];
  props: PropDoc[];
}

/*
 * The JSON is generated, so TypeScript widens each entry into a union of every shape it happens
 * to see. Asserting the intended shape once here keeps that noise out of every call site.
 */
export const propDocs = data as unknown as Record<string, ComponentDocs>;
