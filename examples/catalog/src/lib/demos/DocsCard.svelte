<script lang="ts">
  import { base } from '$app/paths';
  import { DocsCard } from '@loidolt/theme-docs';
</script>

<div class="ldt-grid" style="--ldt-min: 14rem;">
  <DocsCard
    title="Docs hub"
    href={`${base}/components/docs-hub`}
    description="An index of pages, in sections."
    eyebrow="Component"
  />
  <DocsCard title="Source on GitHub" href="https://github.com/loidolt/loidolt-theme" external />
</div>
