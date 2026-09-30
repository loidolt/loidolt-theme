<script lang="ts">
  import { TocPanel } from '@loidolt/theme-docs';

  const items = [
    { id: 'panel-demo-prepare', text: 'Prepare the file', depth: 2 },
    { id: 'panel-demo-material', text: 'Choose a material', depth: 2 },
    { id: 'panel-demo-run', text: 'Run the job', depth: 2 },
  ];
  let article = $state<HTMLElement | null>(null);
</script>

<div class="ldt-grid" style="--ldt-min: 14rem;">
  <TocPanel {items} container={article} />
  <article bind:this={article} class="ldt-prose">
    <h2 id="panel-demo-prepare">Prepare the file</h2>
    <p>Export vectors at 1:1 and close every cut path.</p>
    <h2 id="panel-demo-material">Choose a material</h2>
    <p>Only use stock from the approved shelf.</p>
    <h2 id="panel-demo-run">Run the job</h2>
    <p>Frame the job, start the extraction, then start the cut.</p>
  </article>
</div>
