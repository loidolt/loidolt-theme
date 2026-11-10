import { isTauri, quietly } from './platform.js';
import type {
  MenuModule,
  TauriResource,
  TrayIconHandle,
  TrayImage,
  TrayMenuEntry,
  TrayModule,
} from './types.js';

/**
 * One line of the tray menu; `'separator'` for a rule between groups, `'quit'` for the platform's
 * own Quit item (macOS and Windows).
 */
export type TrayMenuItem =
  | {
      id: string;
      label: string;
      /** Greyed out when `false`. Defaults to `true`. */
      enabled?: boolean;
      /** Runs when the item is chosen. */
      action?: () => void;
    }
  | 'separator'
  | 'quit';

export interface TrayContent {
  /**
   * A path, PNG or ICO bytes, or an `Image`, or a promise of one — pass `defaultWindowIcon()`
   * from `@tauri-apps/api/app` for the app's own icon. Without one, macOS shows only `title`.
   */
  icon?: TrayImage | Promise<TrayImage | null> | null;
  /** The hover text. Not shown on Linux. */
  tooltip?: string;
  /** Text beside the icon in the macOS menu bar. */
  title?: string;
  /** The menu, top to bottom. Empty or absent: no menu. */
  items?: TrayMenuItem[];
}

export interface TrayOptions extends TrayContent {
  /** `@tauri-apps/api/tray`. */
  tray: TrayModule;
  /** `@tauri-apps/api/menu`. */
  menu: MenuModule;
  /** A stable id, for finding the icon from Rust. */
  id?: string;
  /** macOS: draw the icon as a template image, tinted to match the menu bar. */
  iconAsTemplate?: boolean;
  /**
   * A left click on the icon — showing the main window, say. With it, the menu opens on a right
   * click only (macOS, Windows).
   */
  onClick?: () => void;
}

export interface Tray {
  /** Settles once the icon is in the tray (or failed to get there). */
  readonly ready: Promise<void>;
  /** Changes what is given and leaves the rest. A no-op once destroyed. */
  update(changes: TrayContent): Promise<void>;
  /** Removes the icon and frees its menu. Safe to call twice, even before {@link ready}. */
  destroy(): void;
}

const inert: Tray = {
  ready: Promise.resolve(),
  update: async ({ icon }) => quietly(icon),
  destroy() {},
};

function entries(items: readonly TrayMenuItem[]): TrayMenuEntry[] {
  return items.map((item) =>
    item === 'separator'
      ? { item: 'Separator' }
      : item === 'quit'
        ? { item: 'Quit' }
        : {
            id: item.id,
            text: item.label,
            enabled: item.enabled ?? true,
            action: item.action ? () => item.action!() : undefined,
          }
  );
}

/**
 * An icon in the menu bar (macOS) or system tray (Windows, Linux) with a simple menu, for an app
 * that keeps working with its window closed. A no-op outside a Tauri window.
 *
 * ```ts
 * const tray = createTray({
 *   tray, menu, // import * as tray from '@tauri-apps/api/tray', and menu likewise
 *   icon: defaultWindowIcon(),
 *   tooltip: 'Watching for new files',
 *   items: [
 *     { id: 'show', label: 'Show window', action: show },
 *     'separator',
 *     { id: 'quit', label: 'Quit', action: quit },
 *   ],
 * });
 * tray.update({ tooltip: '2 jobs running' });
 * ```
 */
export function createTray(options: TrayOptions): Tray {
  if (!isTauri()) {
    // `defaultWindowIcon()` rejects in a browser; nothing will await it here.
    quietly(options.icon);
    return inert;
  }
  const { tray, menu, id, iconAsTemplate, onClick } = options;
  let destroyed = false;
  let icon: TrayIconHandle | null = null;
  let currentMenu: TauriResource | null = null;

  const buildMenu = (items: readonly TrayMenuItem[] | undefined) =>
    items?.length ? menu.Menu.new({ items: entries(items) }) : Promise.resolve(null);

  const release = (resource: TauriResource | null) => {
    if (resource) quietly(resource.close());
  };

  const ready = (async () => {
    try {
      const [image, built] = await Promise.all([options.icon, buildMenu(options.items)]);
      currentMenu = built;
      if (destroyed) return release(built);
      const created = await tray.TrayIcon.new({
        id,
        icon: image ?? undefined,
        tooltip: options.tooltip,
        title: options.title,
        menu: built ?? undefined,
        iconAsTemplate,
        showMenuOnLeftClick: !onClick,
        action: onClick
          ? (event) => {
              if (event.type === 'Click' && event.button === 'Left' && event.buttonState === 'Up')
                onClick();
            }
          : undefined,
      });
      // A destroy() while this was in flight has already freed the menu.
      if (destroyed) release(created);
      else icon = created;
    } catch {
      /* not allowed by the capability, or no tray on this desktop */
    }
  })();

  async function update(changes: TrayContent): Promise<void> {
    await ready;
    if (destroyed || !icon) return;
    const target = icon;
    try {
      if ('tooltip' in changes) await target.setTooltip(changes.tooltip ?? null);
      if ('title' in changes) await target.setTitle(changes.title ?? null);
      if ('icon' in changes) await target.setIcon((await changes.icon) ?? null);
      if ('items' in changes) {
        const next = await buildMenu(changes.items);
        if (destroyed) return release(next);
        await target.setMenu(next);
        release(currentMenu);
        currentMenu = next;
      }
    } catch {
      /* a call the capability does not allow */
    }
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    release(icon);
    release(currentMenu);
    icon = null;
    currentMenu = null;
  }

  return { ready, update, destroy };
}
