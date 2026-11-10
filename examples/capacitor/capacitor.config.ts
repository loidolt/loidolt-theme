import type { CapacitorConfig } from '@capacitor/cli';
import { withTheme } from '@loidolt/theme-capacitor/config';

// The theme's launch colour, safe-area variables, a splash that waits for the theme, and the
// keyboard resize mode. `LDT_LAUNCH=dark npm run ios:sync` paints the web view's launch background dark, and
// `LDT_DEV=http://localhost:5175 npm run ios:sync` loads the Vite dev server for live reload.
const dev = process.env.LDT_DEV;

export default withTheme<CapacitorConfig>(
  {
    appId: 'space.loidolt.theme.example',
    appName: 'Theme example',
    webDir: 'dist',
    ...(dev ? { server: { url: dev, cleartext: true } } : {}),
  },
  { scheme: process.env.LDT_LAUNCH === 'dark' ? 'dark' : 'light' }
);
