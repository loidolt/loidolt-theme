<script lang="ts">
  import { resolve } from '$app/paths';
  import { MarkdownPage } from '@loidolt/theme-docs';
  import { guide } from '$lib/sample-docs.js';
</script>

<MarkdownPage
  source={guide}
  options={{ idPrefix: 'guide-' }}
  previous={{ title: 'Markdown', href: resolve('/components/[slug]', { slug: 'markdown' }) }}
  next={{ title: 'Code snippets', href: resolve('/components/[slug]', { slug: 'code-snippet' }) }}
/>
