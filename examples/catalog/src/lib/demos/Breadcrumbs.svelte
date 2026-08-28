<script lang="ts">
  import { base } from '$app/paths';
  import { Breadcrumbs } from '@loidolt/theme-svelte';
</script>

<div class="ldt-stack">
  <Breadcrumbs
    label="Component hierarchy"
    items={[
      { label: 'Components', href: `${base}/components` },
      { label: 'Navigation', href: `${base}/components` },
      { label: 'Breadcrumbs' },
    ]}
  />
  <Breadcrumbs
    label="Foundation hierarchy"
    separator=">"
    items={[{ label: 'Foundations', href: `${base}/foundations` }, { label: 'Tokens' }]}
  />
</div>
