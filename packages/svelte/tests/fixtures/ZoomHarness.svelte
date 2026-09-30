<script lang="ts">
  import { createMediaZoom } from '../../src/lib/media-zoom.svelte.js';

  const zoom = createMediaZoom({ maxScale: 3, step: 1 });
</script>

<div data-testid="frame" {@attach zoom.attach} style="width: 200px; height: 100px">
  <img alt="Sheet" src="data:," style:transform={zoom.transform} />
</div>
<output>{zoom.scale}×{zoom.x},{zoom.y}</output>
<button type="button" onclick={zoom.zoomIn}>In</button>
<button type="button" onclick={zoom.zoomOut}>Out</button>
<button type="button" onclick={zoom.reset}>Reset</button>
<button type="button" onclick={zoom.toggle}>Toggle</button>
