<script lang="ts">
  import { Button, PageHeader } from '@loidolt/theme-svelte';
</script>

<PageHeader
  eyebrow="Projects"
  title="Your recent work"
  headingLevel={3}
  description="A general application header using the same foundation as the editor shell."
>
  {#snippet actions()}<Button variant="primary" size="sm">New project</Button>{/snippet}
</PageHeader>
