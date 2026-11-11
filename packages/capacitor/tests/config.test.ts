import { darkSemantic, semantic } from '@loidolt/theme-tokens';
import { describe, expect, it } from 'vitest';
import { themeConfig, withTheme } from '../src/lib/config/index.js';

describe('themeConfig', () => {
  it('paints the launch in the light background by default', () => {
    expect(themeConfig()).toEqual({
      backgroundColor: semantic.background,
      ios: { backgroundColor: semantic.background },
      android: { backgroundColor: semantic.background },
      plugins: {
        SystemBars: { insetsHandling: 'css' },
        SplashScreen: { launchAutoHide: false },
        Keyboard: { resize: 'native' },
      },
    });
  });

  it('takes the dark background, a colour of its own and a resize mode', () => {
    expect(themeConfig({ scheme: 'dark' }).backgroundColor).toBe(darkSemantic.background);
    expect(themeConfig({ backgroundColor: '#123456' }).ios.backgroundColor).toBe('#123456');
    expect(themeConfig({ keyboardResize: 'none' }).plugins.Keyboard.resize).toBe('none');
  });
});

describe('withTheme', () => {
  it('lays the app config over the theme, down to single plugin options', () => {
    const config = withTheme(
      {
        appId: 'space.loidolt.topostack',
        webDir: 'build',
        ios: { scheme: 'Topostack' },
        android: { backgroundColor: '#000000' },
        plugins: {
          SplashScreen: { launchShowDuration: 0 },
          Keyboard: { resize: 'none' },
          LocalNotifications: { iconColor: '#d65a26' },
        },
      },
      { scheme: 'dark' }
    );
    expect(config).toEqual({
      appId: 'space.loidolt.topostack',
      webDir: 'build',
      backgroundColor: darkSemantic.background,
      ios: { backgroundColor: darkSemantic.background, scheme: 'Topostack' },
      android: { backgroundColor: '#000000' },
      plugins: {
        SystemBars: { insetsHandling: 'css' },
        SplashScreen: { launchAutoHide: false, launchShowDuration: 0 },
        Keyboard: { resize: 'none' },
        LocalNotifications: { iconColor: '#d65a26' },
      },
    });
  });

  it('leaves the splash colour to the launch screen, so iOS can follow dark mode', () => {
    // SplashScreen paints its backgroundColor over LaunchScreen.storyboard on iOS, which hid a
    // launch colour asset's dark variant behind one fixed colour.
    expect(themeConfig({ scheme: 'dark' }).plugins.SplashScreen).not.toHaveProperty(
      'backgroundColor'
    );
    const own = withTheme({ plugins: { SplashScreen: { backgroundColor: '#101010' } } });
    expect(own.plugins.SplashScreen).toEqual({ launchAutoHide: false, backgroundColor: '#101010' });
  });

  it('keeps an app background colour', () => {
    expect(withTheme({ backgroundColor: '#ffffff' }).backgroundColor).toBe('#ffffff');
  });
});
