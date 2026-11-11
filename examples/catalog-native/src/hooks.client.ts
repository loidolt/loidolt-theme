import '@loidolt/theme-capacitor/styles.css';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Clipboard } from '@capacitor/clipboard';
import { Filesystem } from '@capacitor/filesystem';
import { Haptics } from '@capacitor/haptics';
import { Keyboard } from '@capacitor/keyboard';
import { Network } from '@capacitor/network';
import { Preferences } from '@capacitor/preferences';
import { Share } from '@capacitor/share';
import { SplashScreen } from '@capacitor/splash-screen';
import { TextZoom } from '@capacitor/text-zoom';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import type { ClientInit } from '@sveltejs/kit';
import { goto } from '$app/navigation';
import { base } from '$app/paths';
import { setupCapacitor } from '@loidolt/theme-capacitor';
import { parsePreview } from '$lib/presets.js';
import { theme } from '$lib/theme.js';

/*
 * The one addition to the catalog: every theme-capacitor adapter, set up once before the first
 * render. The catalog's layout stays as it is on the web, so what this app shows is exactly what
 * a native user of the published site would get.
 */
export const init: ClientInit = () => {
  /*
   * The preset preview frames on /presets take their preset and scheme from the URL. On the web
   * the catalog's server hook writes them into the prerendered page; this build renders on the
   * client, so they are written here, before the frame's first paint.
   */
  const preview = parsePreview(location.pathname.slice(base.length));
  if (preview) {
    document.documentElement.dataset.preset = preview.preset;
    document.documentElement.dataset.theme = preview.scheme;
    return;
  }

  setupCapacitor({
    plugins: {
      App,
      Browser,
      Clipboard,
      FilePicker,
      Filesystem,
      Haptics,
      Keyboard,
      Network,
      Preferences,
      Share,
      SplashScreen,
      TextZoom,
    },
    theme,
    navigate: (path) => void goto(path),
  });
};
