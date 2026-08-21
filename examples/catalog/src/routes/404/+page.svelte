<script lang="ts">
  import { base } from '$app/paths';
  import { Button, EmptyState } from '@loidolt/theme-svelte';
</script>

<svelte:head><title>Not found — Loidolt Theme</title></svelte:head>

<!--
  Prerendered to `404.html`, which is what the Worker's `not_found_handling: "404-page"` serves
  for any path that has no file. It is a real page in the site, so it carries the same shell,
  navigation, and theme as everything else.
-->
<EmptyState
  title="No page at this address"
  description="The link may be out of date, or the component may have been renamed."
  headingLevel={1}
>
  {#snippet actions()}
    <Button variant="primary" href={`${base}/components`}>Browse components</Button>
    <Button variant="quiet" href={`${base}/`}>Overview</Button>
  {/snippet}
</EmptyState>
