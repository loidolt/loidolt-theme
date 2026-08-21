<script lang="ts">
  import { base } from '$app/paths';
  import { Button, Drawer } from '@loidolt/theme-svelte';
</script>

<div class="ldt-cluster">
  <Drawer title="Navigation" description="Everything in this project">
    {#snippet trigger()}Open from the left{/snippet}
    <nav class="ldt-stack" style="--ldt-gap: 0.5rem">
      <a href={`${base}/`}>Overview</a>
      <a href={`${base}/foundations`}>Foundations</a>
      <a href={`${base}/patterns`}>Patterns</a>
    </nav>
    {#snippet footer()}<Button variant="quiet" size="sm">Sign out</Button>{/snippet}
  </Drawer>
  <Drawer title="Filters" side="right" triggerClass="ldt-button ldt-button--quiet">
    {#snippet trigger()}Open from the right{/snippet}
    <p>Anchor a drawer to whichever edge the content belongs to.</p>
  </Drawer>
</div>
