<script lang="ts">
  import { TabBar } from '@loidolt/theme-svelte';
</script>

{#snippet today()}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
    ><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></svg
  >{/snippet}
{#snippet plan()}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
    ><path d="M4 19l5-7 4 4 7-10" /></svg
  >{/snippet}
{#snippet log()}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
    ><path d="M6 4h12v16H6zM9 9h6M9 13h6M9 17h3" /></svg
  >{/snippet}
{#snippet settings()}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
    ><circle cx="12" cy="12" r="3" /><path
      d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"
    /></svg
  >{/snippet}

<div id="tab-bar-demo" style="max-width: 24rem; border: 1px solid var(--loidolt-border)">
  <TabBar
    label="Demo"
    items={[
      { label: 'Today', href: '#tab-bar-demo', icon: today, current: true },
      { label: 'Plan', href: '#tab-bar-demo', icon: plan },
      { label: 'Log', href: '#tab-bar-demo', icon: log },
      { label: 'Settings', href: '#tab-bar-demo', icon: settings },
    ]}
  />
</div>
