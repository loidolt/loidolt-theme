<script lang="ts">
  import { MermaidDiagram } from '@loidolt/theme-docs';

  const lifecycle = `stateDiagram-v2
  [*] --> Quoted
  Quoted --> Approved: proof signed
  Approved --> Cutting
  Cutting --> Finished
  Finished --> [*]
  Quoted --> Cancelled`;
</script>

<MermaidDiagram
  code={lifecycle}
  label="Order lifecycle"
  description="An order is quoted, approved when the proof is signed, cut, and finished. A quote can also be cancelled."
/>
