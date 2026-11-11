import type { CapacitorConfig } from '@capacitor/cli';
import { withTheme } from '@loidolt/theme-capacitor/config';

// The theme's launch colour, safe-area variables, a splash that waits for the theme, and the
// keyboard resize mode. `LDT_DEV=http://<this Mac's address>:5376 npm run ios:sync` loads the
// dev server for live reload; sync again without it before a real build.
const dev = process.env.LDT_DEV;

export default withTheme<CapacitorConfig>(
  {
    appId: 'space.loidolt.theme.catalog',
    appName: 'Theme catalog',
    webDir: 'dist',
    ...(dev ? { server: { url: dev, cleartext: true } } : {}),
  },
  { scheme: process.env.LDT_LAUNCH === 'dark' ? 'dark' : 'light' }
);
