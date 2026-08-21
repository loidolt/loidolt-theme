<script lang="ts">
  import { Accordion } from '@loidolt/theme-svelte';

  const items = [
    { value: 'materials', title: 'Materials' },
    { value: 'tolerances', title: 'Tolerances' },
    { value: 'finishing', title: 'Finishing' },
  ];

  const copy: Record<string, string> = {
    materials: '3mm birch ply, grain running along the long edge.',
    tolerances: 'Kerf 0.2mm; slots cut 0.1mm under nominal.',
    finishing: 'Sanded to 240, hardwax oil, two coats.',
  };
</script>

<Accordion {items} value="materials">
  {#snippet children({ value })}{copy[value]}{/snippet}
</Accordion>
