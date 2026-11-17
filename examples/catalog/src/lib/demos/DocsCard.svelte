<script lang="ts">
  import { resolve } from '$app/paths';
  import { DocsCard } from '@loidolt/theme-docs';
</script>

<div class="ldt-grid" style="--ldt-min: 14rem;">
  <DocsCard
    title="Docs hub"
    href={resolve('/components/[slug]', { slug: 'docs-hub' })}
    description="An index of pages, in sections."
    eyebrow="Component"
  />
  <DocsCard title="Source on GitHub" href="https://github.com/loidolt/loidolt-theme" external />
</div>
