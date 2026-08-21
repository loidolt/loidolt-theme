<script lang="ts">
  import { Input } from '@loidolt/theme-svelte';
</script>

<div class="ldt-stack">
  <Input aria-label="Underlined" value="Underlined (default)" />
  <Input aria-label="Boxed" boxed value="Boxed" />
  <Input aria-label="Invalid" boxed aria-invalid="true" value="Invalid" />
  <Input aria-label="Disabled" boxed disabled value="Disabled" />
</div>
