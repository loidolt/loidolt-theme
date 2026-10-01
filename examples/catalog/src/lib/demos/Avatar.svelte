<script lang="ts">
  import { Avatar } from '@loidolt/theme-svelte';

  // An inline SVG stands in for a profile photo so the demo needs no network.
  const photo =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#265162"/><circle cx="20" cy="16" r="7" fill="#ebe7dc"/><rect x="8" y="26" width="24" height="14" fill="#ebe7dc"/></svg>'
    );
</script>

<div class="ldt-cluster">
  <Avatar name="Ada Lovelace" src={photo} size="lg" />
  <Avatar name="Grace Hopper" size="lg" />
  <Avatar name="Margaret Hamilton" />
  <Avatar name="Katherine Johnson" size="sm" />
  <span class="ldt-cluster"><Avatar size="sm" initials="LS" /> Label Studio</span>
</div>
