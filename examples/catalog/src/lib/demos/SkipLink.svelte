<script lang="ts">
  import { SkipLink } from '@loidolt/theme-svelte';
</script>

<!--
  In an app the link sits first in <body> and stays off-screen until Tab reaches it. It is pinned
  in place here so the demo has something to look at.
-->
<div class="ldt-stack">
  <SkipLink targetId="skip-demo-target" style="position: static; transform: none;" />
  <p id="skip-demo-target">
    Activating the link moves focus here, so the next Tab continues from this paragraph.
  </p>
</div>
