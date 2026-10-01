<script lang="ts">
  import { base } from '$app/paths';
  import { MarkdownPage } from '@loidolt/theme-docs';
  import { guide } from '$lib/sample-docs.js';
</script>

<MarkdownPage
  source={guide}
  options={{ idPrefix: 'guide-' }}
  previous={{ title: 'Markdown', href: `${base}/components/markdown` }}
  next={{ title: 'Code snippets', href: `${base}/components/code-snippet` }}
/>
