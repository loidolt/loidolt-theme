<script lang="ts">
  import { SegmentedNav } from '@loidolt/theme-svelte';
</script>

<div id="segmented-nav-demo">
  <SegmentedNav
    label="Rounds"
    items={[
      { label: 'R1', href: '#segmented-nav-demo' },
      { label: 'R2', href: '#segmented-nav-demo', current: true, hint: 'latest' },
    ]}
  />
</div>
