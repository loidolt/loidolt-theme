<script lang="ts">
  import { resolve } from '$app/paths';
  import { Breadcrumbs } from '@loidolt/theme-svelte';
</script>

<div class="ldt-stack">
  <Breadcrumbs
    label="Component hierarchy"
    items={[
      { label: 'Components', href: resolve('/components') },
      { label: 'Navigation', href: resolve('/components') },
      { label: 'Breadcrumbs' },
    ]}
  />
  <Breadcrumbs
    label="Foundation hierarchy"
    separator=">"
    items={[{ label: 'Foundations', href: resolve('/foundations') }, { label: 'Tokens' }]}
  />
</div>
