<script lang="ts">
  import { SignaturePad, type SignatureValue } from '@loidolt/theme-svelte';

  let signature = $state<SignatureValue | null>(null);
</script>

<div class="ldt-stack">
  <SignaturePad
    label="Customer signature"
    bind:value={signature}
    fonts={[
      { family: 'cursive', label: 'Script' },
      { family: 'Jost, sans-serif', label: 'Plain' },
    ]}
  />
  <p class="ldt-utility-text">
    {signature
      ? `Accepted: ${signature.mode === 'draw' ? 'drawn' : `typed as ${signature.typedName}`}`
      : 'Not signed yet'}
  </p>
</div>
