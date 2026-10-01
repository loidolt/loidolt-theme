# @loidolt/theme-svelte

Accessible Svelte 5 components and state helpers for the Loidolt design system.

```sh
npm install @loidolt/theme-svelte
```

Import the global styles once:

```css
@import '@loidolt/theme-svelte/styles.css';
```

Then import components from the package barrel:

```svelte
<script>
  import { Button, Field, Input } from '@loidolt/theme-svelte';
</script>
```

`hls.js` is an optional peer dependency, needed only to play HLS (`.m3u8`) streams outside
Safari. Install it and register it once:

```ts
import { setHlsLoader } from '@loidolt/theme-svelte';

setHlsLoader(() => import('hls.js').then((module) => module.default));
```

See the [design-system documentation](https://theme.loidolt.space) for every component.
