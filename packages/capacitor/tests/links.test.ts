import { darkSemantic, semantic } from '@loidolt/theme-tokens';
import { describe, expect, it, vi } from 'vitest';
import { openExternalLinks } from '../src/lib/index.js';
import { platform } from './fakes.js';

function fakeBrowser() {
  return { open: vi.fn(async (_options: Record<string, unknown>) => {}) };
}

function link(href: string, attributes: Record<string, string> = {}) {
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.textContent = href;
  for (const [name, value] of Object.entries(attributes)) anchor.setAttribute(name, value);
  document.body.append(anchor);
  return anchor;
}

/** Clicks and reports whether the web view would have navigated. */
function click(anchor: Element, init: MouseEventInit = {}) {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, ...init });
  anchor.dispatchEvent(event);
  return !event.defaultPrevented;
}

describe('openExternalLinks', () => {
  it('does nothing in a browser', () => {
    const Browser = fakeBrowser();
    const stop = openExternalLinks({ Browser });
    expect(click(link('https://example.com/'))).toBe(true);
    expect(Browser.open).not.toHaveBeenCalled();
    stop();
  });

  it('opens other origins in the in-app browser, in the theme colour', () => {
    platform.current = 'ios';
    const Browser = fakeBrowser();
    const stop = openExternalLinks({ Browser });
    expect(click(link('https://example.com/docs'))).toBe(false);
    expect(Browser.open).toHaveBeenCalledWith({
      url: 'https://example.com/docs',
      toolbarColor: semantic.surface,
      presentationStyle: 'fullscreen',
    });
    document.documentElement.dataset.theme = 'dark';
    click(link('https://example.com/a'));
    expect(Browser.open).toHaveBeenLastCalledWith(
      expect.objectContaining({ toolbarColor: darkSemantic.surface })
    );
    stop();
  });

  it('leaves the app’s own links, other schemes and special clicks alone', () => {
    platform.current = 'android';
    const Browser = fakeBrowser();
    const stop = openExternalLinks({ Browser });
    const external = link('https://example.com/');
    expect(click(link('/projects'))).toBe(true);
    expect(click(link('mailto:hi@example.com'))).toBe(true);
    expect(click(link('https://example.com/file.zip', { download: '' }))).toBe(true);
    expect(click(external, { metaKey: true })).toBe(true);
    expect(click(external, { button: 1 })).toBe(true);
    const handled = (event: Event) => event.preventDefault();
    external.addEventListener('click', handled);
    click(external);
    external.removeEventListener('click', handled);
    document.body.append(document.createElement('p'));
    click(document.querySelector('p')!);
    expect(Browser.open).not.toHaveBeenCalled();
    stop();
  });

  it('takes its own idea of external, toolbar and presentation', () => {
    platform.current = 'ios';
    const Browser = fakeBrowser();
    const stop = openExternalLinks({
      Browser,
      isExternal: (url) => url.pathname.startsWith('/help'),
      toolbarRole: null,
      presentationStyle: 'popover',
    });
    click(link('/help/keyboard'));
    expect(Browser.open).toHaveBeenCalledWith({
      url: `${location.origin}/help/keyboard`,
      toolbarColor: undefined,
      presentationStyle: 'popover',
    });
    stop();
    click(link('/help/again'));
    expect(Browser.open).toHaveBeenCalledOnce();
  });
});
