<script lang="ts">
  import { OTPInput } from '@loidolt/theme-svelte';

  let code = $state('');
  let verified = $state('');
</script>

<div class="ldt-stack">
  <OTPInput
    label="Verification code"
    bind:value={code}
    groupSize={3}
    onComplete={(value) => (verified = value)}
  />
  <p class="ldt-utility-text">{verified ? `Submitted ${verified}` : 'Enter the six-digit code'}</p>
</div>
