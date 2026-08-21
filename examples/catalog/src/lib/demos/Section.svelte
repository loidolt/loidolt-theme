<script lang="ts">
  import { Button, Card, Section } from '@loidolt/theme-svelte';
</script>

<Section eyebrow="Projects" title="Your recent work" headingLevel={3}>
  {#snippet actions()}<Button variant="primary" size="sm">Create project</Button>{/snippet}
  <div class="ldt-grid">
    <Card title="Crater Lake" headingLevel={4}>Updated today</Card>
    <Card title="Grand Teton" headingLevel={4}>Updated yesterday</Card>
  </div>
</Section>
