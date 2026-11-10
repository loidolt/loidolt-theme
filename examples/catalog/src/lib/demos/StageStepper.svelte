<script lang="ts">
  import { Button, StageStepper, type StageStep } from '@loidolt/theme-svelte';

  const fresh = (): StageStep[] => [
    { id: 'upload', label: 'Upload', state: 'pending' },
    { id: 'analyse', label: 'Analyse', state: 'pending' },
    { id: 'convert', label: 'Convert', state: 'pending' },
    { id: 'package', label: 'Package', state: 'pending' },
    { id: 'verify', label: 'Verify', state: 'pending' },
  ];

  // Each press applies the next phase of a simulated run: one that skips a step and fails late.
  const phases: Array<Record<string, Partial<StageStep>>> = [
    { upload: { state: 'running', progress: 35 } },
    { upload: { state: 'done', progress: undefined }, analyse: { state: 'running' } },
    {
      analyse: { state: 'done' },
      convert: { state: 'skipped', description: 'Files are already in the target format.' },
      package: { state: 'running', progress: 60 },
    },
    {
      package: { state: 'failed', description: 'The archive exceeded the size limit.' },
      verify: { state: 'skipped', description: 'Skipped after a failed step.' },
    },
  ];

  let steps = $state(fresh());
  let phase = $state(0);
  let selected = $state<string>();

  const finished = $derived(phase >= phases.length);

  function advance() {
    if (finished) {
      steps = fresh();
      phase = 0;
      return;
    }
    const patch = phases[phase];
    steps = steps.map((step) => (patch[step.id] ? { ...step, ...patch[step.id] } : step));
    phase += 1;
  }
</script>

<div class="ldt-stack">
  <StageStepper {steps} label="Run stages" />
  <div class="ldt-cluster">
    <Button variant="primary" onclick={advance}>{finished ? 'Reset run' : 'Advance run'}</Button>
  </div>
  <!-- The same run as a column. Only one stepper per run should announce. -->
  <StageStepper
    {steps}
    orientation="vertical"
    label="Run stages, detailed"
    announce={false}
    onSelect={(step) => (selected = step.label)}
  />
  <p class="ldt-muted">{selected ? `Selected: ${selected}` : 'Select a stage to inspect it.'}</p>
</div>
