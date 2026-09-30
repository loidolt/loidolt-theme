import { render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { loadDeck, setDeckLoader } from '../src/lib/deck.js';
import { setMapLibreLoader } from '../src/lib/maplibre.js';
import { createFakeMapLibre, lastMap } from './fakes/maplibre.js';
import ExtrasHarness from './fixtures/ExtrasHarness.svelte';

beforeEach(() => {
  const fake = createFakeMapLibre();
  setMapLibreLoader(() => fake);
});

afterEach(() => setDeckLoader(null));

const manager = async () => {
  await waitFor(() => expect(screen.getAllByRole('switch')).toHaveLength(3));
  return lastMap();
};

const order = () =>
  [...document.querySelectorAll('.ldt-layer-manager__row')].map((row) =>
    row.getAttribute('data-layer')
  );

describe('LayerManager', () => {
  it('lists the layers topmost first, with their current state', async () => {
    render(ExtrasHarness, {});
    await manager();
    expect(order()).toEqual(['names', 'roads', 'parks']);
    expect(screen.getByRole('switch', { name: 'Parks' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Names' })).not.toBeChecked();
    expect(screen.getByRole('slider', { name: 'Parks opacity' })).toHaveAttribute(
      'aria-valuenow',
      '0.4'
    );
    expect(screen.getByRole('button', { name: 'Move Names up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move Parks down' })).toBeDisabled();
  });

  it('offers only the layers it is given, and can hide its opacity sliders', async () => {
    render(ExtrasHarness, { only: ['parks'], showOpacity: false });
    await waitFor(() => expect(screen.getAllByRole('switch')).toHaveLength(1));
    expect(screen.queryByRole('slider')).toBeNull();
  });

  it('shows and hides layers', async () => {
    const onChange = vi.fn();
    render(ExtrasHarness, { onChange });
    const map = await manager();
    await userEvent.click(screen.getByRole('switch', { name: 'Roads' }));
    expect(map.getLayer('roads')!.layout.visibility).toBe('none');
    expect(onChange).toHaveBeenLastCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'roads', visible: false })])
    );
    expect(screen.getByRole('slider', { name: 'Roads opacity' })).toHaveAttribute('data-disabled');
  });

  it('sets opacity on every opacity property of the layer type', async () => {
    render(ExtrasHarness, {});
    const map = await manager();
    // Hidden layers keep their slider disabled; show Names first.
    await userEvent.click(screen.getByRole('switch', { name: 'Names' }));
    const slider = screen.getByRole('slider', { name: 'Names opacity' });
    slider.focus();
    await userEvent.keyboard('{Home}');
    expect(map.getLayer('names')!.paint).toMatchObject({ 'text-opacity': 0, 'icon-opacity': 0 });
  });

  it('reorders with buttons and Alt + arrows, announcing the new place and keeping focus', async () => {
    render(ExtrasHarness, {});
    const map = await manager();
    const drawn = () =>
      map.style.layers.map((layer) => layer.id).filter((id) => !id.startsWith('ldt-base'));

    await userEvent.click(screen.getByRole('button', { name: 'Move Parks up' }));
    expect(order()).toEqual(['names', 'parks', 'roads']);
    expect(drawn()).toEqual(['roads', 'parks', 'names']);
    await waitFor(() =>
      expect(document.querySelector('.ldt-layer-manager [aria-live]')).toHaveTextContent(
        'Parks moved to position 2 of 3.'
      )
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Move Parks up' })).toHaveFocus()
    );

    await userEvent.keyboard('{Alt>}{ArrowUp}{/Alt}');
    expect(order()).toEqual(['parks', 'names', 'roads']);
    expect(drawn()).toEqual(['roads', 'names', 'parks']);
    // At the top, up is disabled, so focus lands on down instead.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Move Parks down' })).toHaveFocus()
    );

    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(order()).toEqual(['names', 'parks', 'roads']);
    await userEvent.keyboard('{ArrowDown}');
    expect(order()).toEqual(['names', 'parks', 'roads']);
  });

  it('collapses from its heading', async () => {
    render(ExtrasHarness, {});
    await manager();
    const toggle = screen.getByRole('button', { name: 'Layers' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('switch')).toBeNull();
  });

  it('passes axe', async () => {
    const { container } = render(ExtrasHarness, {});
    await manager();
    const control = container.ownerDocument.querySelector('.ldt-layer-manager')!;
    expect(within(control as HTMLElement).getAllByRole('switch')).toHaveLength(3);
    expect((await axe(control)).violations).toEqual([]);
  });
});

describe('DeckOverlay', () => {
  class FakeOverlay {
    static last: FakeOverlay | null = null;
    props: Record<string, unknown>;
    finalized = false;
    constructor(props: Record<string, unknown>) {
      this.props = props;
      FakeOverlay.last = this;
    }
    setProps(props: Record<string, unknown>) {
      this.props = { ...this.props, ...props };
    }
    onAdd() {
      return document.createElement('div');
    }
    onRemove() {}
    finalize() {
      this.finalized = true;
    }
  }

  it('adds an overlay and feeds it new layers', async () => {
    setDeckLoader(() => ({ MapboxOverlay: FakeOverlay }));
    const { rerender, unmount } = render(ExtrasHarness, { deckLayers: ['first'] });
    await waitFor(() => expect(FakeOverlay.last).not.toBeNull());
    const map = lastMap();
    expect(FakeOverlay.last!.props).toMatchObject({ interleaved: false, layers: ['first'] });
    expect(map.controls.some(({ control }) => control === FakeOverlay.last)).toBe(true);
    await rerender({ deckLayers: ['second'] });
    await waitFor(() => expect(FakeOverlay.last!.props.layers).toEqual(['second']));
    const overlay = FakeOverlay.last!;
    unmount();
    expect(overlay.finalized).toBe(true);
  });

  it('says so when deck.gl is not there', async () => {
    const onUnavailable = vi.fn();
    render(ExtrasHarness, { deckLayers: [], onUnavailable });
    await waitFor(() => expect(onUnavailable).toHaveBeenCalled());
  });

  it('loads from a registered loader, a global, or not at all', async () => {
    setDeckLoader(() => ({ MapboxOverlay: FakeOverlay }));
    expect((await loadDeck())?.MapboxOverlay).toBe(FakeOverlay);
    setDeckLoader(null);
    (globalThis as { deck?: unknown }).deck = { MapboxOverlay: FakeOverlay };
    expect(await loadDeck()).not.toBeNull();
    delete (globalThis as { deck?: unknown }).deck;
    setDeckLoader(() => {
      throw new Error('not installed');
    });
    expect(await loadDeck()).toBeNull();
  });
});
