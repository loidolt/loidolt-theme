<script lang="ts">
  import { Skeleton } from '@loidolt/theme-svelte';
</script>

<div class="ldt-stack" style="--ldt-gap: 0.75rem">
  <div class="ldt-cluster">
    <Skeleton variant="avatar" />
    <Skeleton variant="title" width="40%" />
  </div>
  <Skeleton variant="text" lines={3} />
  <Skeleton variant="button" />
  <Skeleton width="40%" height="1.2rem" />
</div>
