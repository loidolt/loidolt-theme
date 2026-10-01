<script lang="ts">
  import { Button, createAnnouncer, LiveRegion } from '@loidolt/theme-svelte';

  const announcer = createAnnouncer();
  let saves = $state(0);
</script>

<div class="ldt-stack">
  <div class="ldt-cluster">
    <Button
      onclick={() => {
        saves += 1;
        announcer.announce('Draft saved');
      }}>Save draft</Button
    >
    <Button
      variant="danger"
      onclick={() => announcer.announce('Export failed', { politeness: 'assertive' })}
      >Fail export</Button
    >
  </div>
  <p class="ldt-muted">
    Saved {saves} times. Screen readers hear each save, even when the text repeats.
  </p>
  <!-- Shown here so you can watch it; in an app it stays visually hidden. -->
  <LiveRegion
    message={announcer.message}
    politeness={announcer.politeness}
    visuallyHidden={false}
  />
</div>
