<script lang="ts">
  import { CodeSnippet } from '@loidolt/theme-docs';

  const svelte = `<script lang="ts">
  import { LineChart } from '@loidolt/theme-charts';
  let { data } = $props();
${'<'}/script>

<LineChart title="Sheets per month" {data} dataTable="toggle" />`;
</script>

<div class="ldt-stack">
  <CodeSnippet code="npm install @loidolt/theme-docs shiki" lang="sh" />
  <CodeSnippet code={svelte} lang="svelte" filename="Report.svelte" />
</div>
