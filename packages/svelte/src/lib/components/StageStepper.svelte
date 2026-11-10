<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { createAnnouncer } from '../announcer.svelte.js';
  import type { Orientation, StageState, StageStep } from '../types.js';
  import { cx } from '../utils.js';
  import LiveRegion from './LiveRegion.svelte';
  import Progress from './Progress.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The run's steps, in order. Change a step's `state` to move the run along. */
    steps: StageStep[];
    /**
     * `horizontal` lays the steps out in a row and falls back to a column when its container is
     * too narrow to hold one; `vertical` is always a column.
     */
    orientation?: Orientation;
    /** Accessible name of the list. */
    label?: string;
    /** The words for each state, read with every step. Missing keys keep the English default. */
    stateLabels?: Partial<Record<StageState, string>>;
    /** Accessible name of a step's progress bar. */
    progressLabel?: (step: StageStep) => string;
    /** Speak a step's new state through a polite live region whenever it changes. */
    announce?: boolean;
    /** What is spoken when a step changes state. */
    formatAnnouncement?: (step: StageStep, stateLabel: string) => string;
    /** Makes each step's label a button; called with the step that was pressed. */
    onSelect?: (step: StageStep) => void;
    /** Lands on the wrapper around the list and its live region. */
    class?: string;
    ref?: HTMLDivElement | null;
  }

  const defaultStateLabels: Record<StageState, string> = {
    pending: 'Pending',
    running: 'In progress',
    done: 'Done',
    skipped: 'Skipped',
    failed: 'Failed',
  };

  let {
    steps,
    orientation = 'horizontal',
    label = 'Stages',
    stateLabels,
    progressLabel = (step) => `${step.label} progress`,
    announce = true,
    formatAnnouncement = (step, stateLabel) => `${step.label}: ${stateLabel}`,
    onSelect,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const words = $derived({ ...defaultStateLabels, ...stateLabels });
  // Only one step is "current": the first one running.
  const currentId = $derived(steps.find((step) => step.state === 'running')?.id);

  const announcer = createAnnouncer();
  // Plain, not `$state`: it is a memo of the last render, and writing it must not re-run the effect.
  let previous: Map<string, StageState> | undefined;

  $effect(() => {
    const current = new Map(steps.map((step) => [step.id, step.state]));
    if (previous && announce) {
      const changed = steps.filter(
        (step) => previous!.has(step.id) && previous!.get(step.id) !== step.state
      );
      if (changed.length) {
        announcer.announce(
          changed.map((step) => formatAnnouncement(step, words[step.state])).join('. ')
        );
      }
    }
    previous = current;
  });

  const progressVariant = (state: StageState) =>
    state === 'failed' ? 'error' : state === 'done' ? 'success' : 'default';
</script>

<!--
  An ordered list, so assistive technology hears "3 of 5" without help. Each step's state is
  spoken in words through a visually hidden suffix; the glyph and colour are the sighted copy and
  never carry it alone. The live region is mounted once with the list, empty, so the first change
  is heard.
-->
<div
  bind:this={ref}
  class={cx('ldt-stage-stepper', `ldt-stage-stepper--${orientation}`, className)}
  {...rest}
>
  <ol class="ldt-stage-stepper__list" aria-label={label}>
    {#each steps as step, index (step.id)}
      {@const current = step.id === currentId}
      <li
        class={cx('ldt-stage-stepper__step', `ldt-stage-stepper__step--${step.state}`)}
        aria-current={current && !onSelect ? 'step' : undefined}
      >
        <span class="ldt-stage-stepper__indicator" aria-hidden="true">
          {#if step.state === 'done'}
            <svg viewBox="0 0 12 12" width="12" height="12" focusable="false"
              ><path
                d="m2.5 6.2 2.3 2.3 4.7-5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
              /></svg
            >
          {:else if step.state === 'failed'}
            <svg viewBox="0 0 12 12" width="12" height="12" focusable="false"
              ><path d="m3 3 6 6M9 3 3 9" stroke="currentColor" stroke-width="1.6" /></svg
            >
          {:else if step.state === 'skipped'}
            <svg viewBox="0 0 12 12" width="12" height="12" focusable="false"
              ><path d="M3 6h6" stroke="currentColor" stroke-width="1.6" /></svg
            >
          {:else}
            {#if step.state === 'running'}<span class="ldt-stage-stepper__activity"></span>{/if}
            <span class="ldt-stage-stepper__number">{index + 1}</span>
          {/if}
        </span>
        <div class="ldt-stage-stepper__body">
          {#if onSelect}
            <button
              type="button"
              class="ldt-stage-stepper__label ldt-stage-stepper__action"
              aria-current={current ? 'step' : undefined}
              onclick={() => onSelect(step)}
              >{step.label}<span class="ldt-sr-only">, {words[step.state]}</span></button
            >
          {:else}
            <span class="ldt-stage-stepper__label"
              >{step.label}<span class="ldt-sr-only">, {words[step.state]}</span></span
            >
          {/if}
          {#if step.description}
            <p class="ldt-stage-stepper__description">{step.description}</p>
          {/if}
          {#if step.progress !== undefined}
            <Progress
              class="ldt-stage-stepper__progress"
              value={step.progress}
              label={progressLabel(step)}
              variant={progressVariant(step.state)}
              size="sm"
              showValue
            />
          {/if}
        </div>
      </li>
    {/each}
  </ol>
  {#if announce}
    <LiveRegion message={announcer.message} politeness={announcer.politeness} />
  {/if}
</div>
