import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import Badge from '../src/lib/components/Badge.svelte';
import Button from '../src/lib/components/Button.svelte';
import Dialog from '../src/lib/components/Dialog.svelte';
import Progress from '../src/lib/components/Progress.svelte';
import Separator from '../src/lib/components/Separator.svelte';
import Switch from '../src/lib/components/Switch.svelte';
import Table from '../src/lib/components/Table.svelte';
import Toast from '../src/lib/components/Toast.svelte';
import SwitchFormHarness from './fixtures/SwitchFormHarness.svelte';
import WorkspaceHarness from './fixtures/WorkspaceHarness.svelte';

const text = (value: string) => createRawSnippet(() => ({ render: () => value }));

/** Sibling package's source, resolved from the package root Vitest runs in. */
const stylesheet = (file: string) => path.join(process.cwd(), '..', 'styles', 'src', file);

const componentStyles = () => {
  const directory = stylesheet('components');
  return readdirSync(directory)
    .filter((file) => file.endsWith('.css'))
    .sort()
    .map((file) => readFileSync(path.join(directory, file), 'utf8'))
    .join('\n');
};

/** Every declaration block whose selector list mentions `selector`. */
const rulesFor = (css: string, selector: string): string[] =>
  // Comments are stripped first: one sitting above a rule otherwise lands in its selector capture.
  [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^}]*)\}/g)]
    .filter(([, selectors]) => selectors.split(',').some((one) => one.trim() === selector))
    .map(([, , body]) => body);

describe('Button', () => {
  it('supports keyboard activation and loading state', async () => {
    const user = userEvent.setup();
    const onclick = vi.fn();
    const { rerender } = render(Button, { children: text('Generate'), onclick });
    await user.tab();
    await user.keyboard('{Enter}');
    expect(onclick).toHaveBeenCalledOnce();

    await rerender({
      children: text('Generate'),
      onclick,
      loading: true,
      loadingText: 'Generating',
    });
    // Loading must not use native `disabled`: that would drop keyboard focus to <body>
    // mid-interaction. The control stays focusable, announces busy, and guards activation.
    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('aria-busy', 'true');
    await user.click(button);
    expect(onclick).toHaveBeenCalledOnce();
  });

  it('uses native disabled for the explicit disabled state', async () => {
    render(Button, { children: text('Generate'), disabled: true });
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('emits no modifier class for the default variant', () => {
    render(Button, { children: text('Open') });
    expect(screen.getByRole('button')).toHaveClass('ldt-button');
    expect(screen.getByRole('button').className).not.toContain('ldt-button--default');
  });

  it('keeps the loading live region mounted so the message is announced', async () => {
    const { rerender } = render(Button, { children: text('Generate') });
    const region = screen.getByRole('status');
    expect(region.textContent).toBe('');

    await rerender({ children: text('Generate'), loading: true });
    expect(region).toHaveTextContent('Loading');
  });

  it('renders the folded-in text variant', () => {
    render(Button, { children: text('Open'), variant: 'text' });
    expect(screen.getByRole('button')).toHaveClass('ldt-button--text');
  });

  it('removes disabled links from navigation', () => {
    render(Button, { children: text('Open'), href: '/project', disabled: true });
    const link = screen.getByText('Open').closest('a');
    expect(link).not.toHaveAttribute('href');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');
  });
});

describe('Switch', () => {
  it('exposes and updates its checked state', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(Switch, { children: text('Live preview'), onCheckedChange });
    const control = screen.getByRole('switch', { name: 'Live preview' });
    expect(control).toHaveAttribute('aria-checked', 'false');
    await user.click(control);
    expect(control).toHaveAttribute('aria-checked', 'true');
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('still calls a consumer onclick passed through the rest props', async () => {
    const user = userEvent.setup();
    const onclick = vi.fn();
    render(Switch, { children: text('Live preview'), onclick });
    await user.click(screen.getByRole('switch'));
    expect(onclick).toHaveBeenCalledOnce();
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('participates in a form when given a name', () => {
    const { container } = render(Switch, {
      children: text('Live'),
      name: 'preview',
      checked: true,
    });
    const hidden = container.querySelector('input[name="preview"]');
    expect(hidden).toBeInTheDocument();
    expect(hidden).toBeChecked();
  });
  it('restores its initial state when its form resets', async () => {
    const user = userEvent.setup();
    const { container } = render(SwitchFormHarness);
    const control = screen.getByRole('switch', { name: 'Live preview' });
    await user.click(control);
    expect(control).toHaveAttribute('aria-checked', 'false');
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(control).toHaveAttribute('aria-checked', 'true');
    expect(container.querySelector('input[name="preview"]')).toBeChecked();
  });
});

describe('Dialog', () => {
  it('opens, dismisses with Escape, and restores trigger focus', async () => {
    const user = userEvent.setup();
    render(Dialog, {
      title: 'Export package',
      trigger: text('Open export'),
      children: text('Review the project before export.'),
    });

    const trigger = screen.getByRole('button', { name: 'Open export' });
    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Export package' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('forwards rest props and only sizes the dialog when asked', async () => {
    const user = userEvent.setup();
    render(Dialog, {
      title: 'Export package',
      trigger: text('Open export'),
      children: text('Body'),
      id: 'export-dialog',
    });
    await user.click(screen.getByRole('button', { name: 'Open export' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('id', 'export-dialog');
    expect(dialog.className).not.toMatch(/ldt-dialog--/);
    expect(dialog).not.toHaveAttribute('style', expect.stringContaining('--ldt-dialog-width'));
  });
});

describe('Progress', () => {
  it('clamps the reported value like the visual bar', () => {
    render(Progress, { value: 250, max: 100, label: 'Upload' });
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('survives a non-positive max instead of reporting Infinity', () => {
    render(Progress, { value: 5, max: 0, label: 'Upload' });
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAttribute('aria-valuenow', '5');
  });

  it('omits aria-valuenow when indeterminate', () => {
    render(Progress, { label: 'Upload' });
    const bar = screen.getByRole('progressbar');
    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(bar).toHaveClass('ldt-progress--indeterminate');
  });
});

describe('Separator', () => {
  it('exposes a vertical orientation', () => {
    render(Separator, { orientation: 'vertical' });
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
  });
});

describe('Table', () => {
  it('makes the scrollable region reachable by keyboard', () => {
    render(Table, {
      caption: 'Recent projects',
      children: text('<tbody><tr><td>A</td></tr></tbody>'),
    });
    const region = screen.getByRole('region', { name: 'Recent projects' });
    expect(region).toHaveAttribute('tabindex', '0');
  });

  it('lets consumers reach the wrapper as well as the table', () => {
    render(Table, {
      children: text('<tbody><tr><td>A</td></tr></tbody>'),
      class: 'inner',
      wrapperClass: 'outer',
    });
    expect(screen.getByRole('region')).toHaveClass('outer');
    expect(screen.getByRole('table')).toHaveClass('inner');
  });
});

describe('Toast', () => {
  it('places the dismiss control after the content and reports dismissal', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(Toast, { title: 'Export queued', description: 'Preparing files.', onDismiss });

    const toast = screen.getByText('Export queued').closest('.ldt-toast') as HTMLElement;
    const order = [...toast.children].map((child) => child.className);
    expect(order.at(-1)).toContain('ldt-toast__dismiss');

    // The viewport owns the live region; a nested one would double every announcement.
    expect(toast).not.toHaveAttribute('role', 'status');

    await user.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});

describe('Workspace', () => {
  it('uses a single column when no sidebar snippet is supplied', () => {
    render(WorkspaceHarness);
    const workspace = screen.getByTestId('workspace');
    expect(workspace).not.toHaveClass('ldt-workspace--sidebar');
    expect(workspace).not.toHaveClass('ldt-workspace--inspector');
  });

  it('opts into the sidebar and inspector columns only when present', () => {
    render(WorkspaceHarness, { withSidebar: true, withInspector: true });
    const workspace = screen.getByTestId('workspace');
    expect(workspace).toHaveClass('ldt-workspace--sidebar');
    expect(workspace).toHaveClass('ldt-workspace--inspector');
  });
});

describe('Badge', () => {
  it('stays a compact inline chip until a control size is asked for', () => {
    const { container } = render(Badge, { children: text('Draft') });
    expect(container.querySelector('.ldt-badge')?.className).toBe('ldt-badge');
  });

  it('takes a control size alongside its variant', () => {
    const { container } = render(Badge, {
      children: text('Live'),
      variant: 'accent',
      size: 'md',
    });
    const badge = container.querySelector('.ldt-badge');
    expect(badge).toHaveClass('ldt-badge--accent', 'ldt-badge--md');
  });

  it('never looks pressable, at any size and without needing hover', () => {
    // Matching the control height made badges read as buttons; these are the marks that
    // separate them while the boxes stay aligned.
    const css = componentStyles();
    const base = rulesFor(css, '.ldt-badge').join('\n');

    expect(base).toContain('border-radius: var(--loidolt-border-radius-pill)');
    expect(rulesFor(css, '.ldt-button').join('\n')).toContain(
      'border-radius: var(--loidolt-border-radius)'
    );
    // Recessed rather than raised, and never the strong stroke that marks a control.
    expect(base).toContain('background: var(--loidolt-surface-sunken)');
    expect(base).not.toContain('--loidolt-border-strong');
    // The label typographic voice, not the control one.
    expect(base).toContain('letter-spacing: var(--loidolt-font-tracking-wide)');
    // Badge type stays a step under button type: no size step may promote it.
    for (const step of ['.ldt-badge--sm', '.ldt-badge--md', '.ldt-badge--lg']) {
      expect(rulesFor(css, step).join('\n'), step).not.toContain('font-size');
    }
  });

  it('sizes each step to the same track as the matching button', () => {
    // A sized badge exists to sit in a row of controls, so its box has to match theirs.
    const css = componentStyles();
    const heightOf = (selector: string) =>
      /min-height:\s*([^;]+);/.exec(rulesFor(css, selector).join('\n'))?.[1].trim();

    expect(heightOf('.ldt-badge--sm')).toBe(heightOf('.ldt-button--sm'));
    expect(heightOf('.ldt-badge--md')).toBe(heightOf('.ldt-button'));
    expect(heightOf('.ldt-badge--lg')).toBe(heightOf('.ldt-button--lg'));
  });
});

describe('layout robustness', () => {
  // jsdom has no layout engine, so these assert the *rules* that produced the geometry bugs
  // rather than measuring boxes. Each one maps to a defect found by the browser audit.
  // `import.meta.url` is rewritten to a non-`file:` URL under the jsdom environment.
  const styles = () => componentStyles();

  it('caps the app shell grid at the container width', () => {
    // An implicit, content-sized column let a wide topbar stretch the whole page.
    expect(styles()).toMatch(/\.ldt-app-shell\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/);
  });

  it('lets the topbar nav shrink and reflow instead of overflowing', () => {
    const css = styles();
    expect(css).toMatch(/\.ldt-topbar\s*\{[^}]*flex-wrap:\s*wrap/);
    expect(css).toMatch(/\.ldt-topbar__nav\s*\{[^}]*min-width:\s*0/);
  });

  it('keeps every pointer target at the 24px WCAG 2.2 minimum', () => {
    const css = styles();
    for (const selector of ['.ldt-choice', '.ldt-switch', '.ldt-button--text']) {
      const declared = rulesFor(css, selector).join('\n');
      expect(declared, selector).toMatch(/min-height:\s*1\.5rem/);
    }
  });

  it('gives every surface its own ink so scoped token overrides resolve', () => {
    // `color` inherits computed, so a subtree redefining `--loidolt-text` needs a re-declaration.
    const css = styles();
    for (const selector of [
      '.ldt-card',
      '.ldt-panel',
      '.ldt-table',
      '.ldt-app-shell',
      '.ldt-topbar',
    ]) {
      const declared = rulesFor(css, selector).join('\n');
      expect(declared, selector).toContain('background:');
      expect(declared, selector).toContain('color: var(--loidolt-text)');
    }
  });

  it('animates progress with a transform rather than width', () => {
    const body = rulesFor(styles(), '.ldt-progress__bar').join('\n');
    expect(body).toContain('transform: scaleX(var(--ldt-progress-value, 0))');
    expect(body).not.toMatch(/transition:\s*width/);
  });
});

describe('focus indication', () => {
  const a11y = () => readFileSync(stylesheet('accessibility.css'), 'utf8');
  const components = () => componentStyles();

  it('never suppresses the ring from a component rule', () => {
    // `.ldt-input:focus { outline: 0 }` used to beat the shared `:focus-visible` rule.
    expect(components()).not.toMatch(/outline:\s*(0|none)/);
  });

  it('insets the ring where a scroll container would clip it', () => {
    expect(a11y()).toMatch(/\.ldt-topbar__nav[^{]*\{\s*outline-offset:\s*-2px/s);
  });
});

describe('component stylesheet contract', () => {
  /** `[selector, body]` for every rule, comments stripped. */
  const rules = () =>
    [
      ...componentStyles()
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .matchAll(/([^{}]+)\{([^}]*)\}/g),
    ].map(([, selector, body]) => [selector.trim(), body] as const);

  it('keeps corners square, reserving the pill for badges and true circles for glyphs', () => {
    // A circle is only for things that are round by nature — a spinning ring, a map pin. Anything
    // that sits in a row of controls stays square; the pill token is the one rounded exception.
    const circular = new Set(['.ldt-spinner', '.ldt-marker--pin']);
    const allowed = /^(0|var\(--loidolt-border-radius(-pill)?\))$/;
    const offenders = rules().flatMap(([selector, body]) =>
      [...body.matchAll(/border-radius:\s*([^;]+);/g)]
        .map(([, value]) => value.trim())
        .filter((value) => !allowed.test(value) && !circular.has(selector))
        .map((value) => `${selector}: ${value}`)
    );
    expect(offenders).toEqual([]);
  });

  it('draws every colour from a token rather than a literal', () => {
    const literal = /#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|oklch|oklab|lab|lch)\(/i;
    const offenders = rules()
      .filter(([, body]) => literal.test(body))
      .map(([selector]) => selector);
    expect(offenders).toEqual([]);
  });
});
