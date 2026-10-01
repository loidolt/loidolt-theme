<script lang="ts">
  import { TableOfContents } from '@loidolt/theme-docs';

  const items = [
    { id: 'toc-demo-prepare', text: 'Prepare the file', depth: 2 },
    { id: 'toc-demo-material', text: 'Choose a material', depth: 2 },
    { id: 'toc-demo-run', text: 'Run the job', depth: 2 },
    { id: 'toc-demo-leave', text: 'Before you leave', depth: 3 },
    { id: 'toc-demo-calibration', text: 'Calibration', depth: 2 },
  ];
  let active = $state<string | null>('toc-demo-prepare');
</script>

<div class="ldt-grid" style="--ldt-min: 14rem;">
  <div>
    <TableOfContents {items} bind:activeId={active} />
    <p class="ldt-eyebrow">Current: {items.find((item) => item.id === active)?.text}</p>
  </div>
  <article class="ldt-prose">
    <h2 id="toc-demo-prepare">Prepare the file</h2>
    <p>Export vectors at 1:1 and close every cut path.</p>
    <h2 id="toc-demo-material">Choose a material</h2>
    <p>Only use stock from the approved shelf.</p>
    <h2 id="toc-demo-run">Run the job</h2>
    <p>Frame the job, start the extraction, then start the cut.</p>
    <h3 id="toc-demo-leave">Before you leave</h3>
    <p>Wait for the extraction to clear the bed.</p>
    <h2 id="toc-demo-calibration">Calibration</h2>
    <p>Focus is checked each morning.</p>
  </article>
</div>
