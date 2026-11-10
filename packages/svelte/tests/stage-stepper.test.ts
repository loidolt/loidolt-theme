import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StageStepper from '../src/lib/components/StageStepper.svelte';
import type { StageStep } from '../src/lib/types.js';

const run = (): StageStep[] => [
  { id: 'upload', label: 'Upload', state: 'done' },
  { id: 'analyse', label: 'Analyse', state: 'running', progress: 40 },
  { id: 'convert', label: 'Convert', state: 'skipped', description: 'Nothing to convert.' },
  { id: 'package', label: 'Package', state: 'failed', progress: 70 },
  { id: 'verify', label: 'Verify', state: 'pending' },
];

describe('StageStepper', () => {
  it('renders an ordered, named list with every state in words', () => {
    render(StageStepper, { steps: run(), label: 'Job stages' });
    const list = screen.getByRole('list', { name: 'Job stages' });
    expect(list.tagName).toBe('OL');
    const items = within(list).getAllByRole('listitem');
    expect(items.map((item) => item.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      'Upload, Done',
      expect.stringMatching(/^2 Analyse, In progress/),
      'Convert, Skipped Nothing to convert.',
      expect.stringMatching(/^Package, Failed/),
      '5 Verify, Pending',
    ]);
  });

  it('marks only the first running step as current', () => {
    const steps = run();
    steps[4].state = 'running';
    render(StageStepper, { steps });
    const current = screen
      .getAllByRole('listitem')
      .filter((item) => item.getAttribute('aria-current') === 'step');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent('Analyse');
    expect(current[0]).toHaveClass('ldt-stage-stepper__step--running');
    expect(current[0].querySelector('.ldt-stage-stepper__activity')).not.toBeNull();
  });

  it('draws progress bars coloured by outcome', () => {
    render(StageStepper, { steps: run() });
    const analyse = screen.getByRole('progressbar', { name: 'Analyse progress' });
    expect(analyse).toHaveAttribute('aria-valuenow', '40');
    expect(analyse).not.toHaveClass('ldt-progress--error');
    expect(screen.getByRole('progressbar', { name: 'Package progress' })).toHaveClass(
      'ldt-progress--error'
    );
    expect(screen.getAllByRole('progressbar')).toHaveLength(2);
  });

  it('colours a finished bar as a success', () => {
    render(StageStepper, {
      steps: [{ id: 'a', label: 'Upload', state: 'done', progress: 100 }],
      progressLabel: (step: StageStep) => `${step.label} – Fortschritt`,
    });
    expect(screen.getByRole('progressbar', { name: 'Upload – Fortschritt' })).toHaveClass(
      'ldt-progress--success'
    );
  });

  it('takes translated state labels, keeping defaults for missing keys', () => {
    render(StageStepper, {
      steps: run(),
      label: 'Schritte',
      stateLabels: { done: 'Fertig', failed: 'Fehlgeschlagen' },
    });
    const list = screen.getByRole('list', { name: 'Schritte' });
    expect(list).toHaveTextContent('Upload, Fertig');
    expect(list).toHaveTextContent('Package, Fehlgeschlagen');
    expect(list).toHaveTextContent('Verify, Pending');
  });

  it('sets the orientation class and forwards attributes', () => {
    let ref: HTMLDivElement | null = null;
    const view = render(StageStepper, {
      steps: run(),
      orientation: 'vertical',
      class: 'extra',
      'data-testid': 'stepper',
      get ref() {
        return ref;
      },
      set ref(value) {
        ref = value;
      },
    });
    const root = view.getByTestId('stepper');
    expect(root).toHaveClass('ldt-stage-stepper', 'ldt-stage-stepper--vertical', 'extra');
    expect(ref).toBe(root);
  });

  it('renders label buttons when selectable and reports the pressed step', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(StageStepper, { steps: run(), onSelect });
    const button = screen.getByRole('button', { name: 'Analyse, In progress' });
    expect(button).toHaveAttribute('aria-current', 'step');
    expect(button.closest('li')).not.toHaveAttribute('aria-current');
    await user.click(screen.getByRole('button', { name: 'Verify, Pending' }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'verify' }));
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  it('renders no buttons without onSelect', () => {
    render(StageStepper, { steps: run() });
    expect(screen.queryByRole('button')).toBeNull();
  });

  describe('announcements', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('speaks state changes, not the first render', async () => {
      const steps: StageStep[] = [
        { id: 'a', label: 'Upload', state: 'running' },
        { id: 'b', label: 'Convert', state: 'pending' },
      ];
      const view = render(StageStepper, { steps });
      const region = screen.getByRole('status');
      await vi.advanceTimersByTimeAsync(100);
      expect(region).toHaveTextContent('');

      await view.rerender({
        steps: [
          { id: 'a', label: 'Upload', state: 'done' },
          { id: 'b', label: 'Convert', state: 'running' },
        ],
      });
      await vi.advanceTimersByTimeAsync(100);
      expect(region).toHaveTextContent('Upload: Done. Convert: In progress');

      // A new step and a progress tick are not state changes.
      await view.rerender({
        steps: [
          { id: 'a', label: 'Upload', state: 'done' },
          { id: 'b', label: 'Convert', state: 'running', progress: 50 },
          { id: 'c', label: 'Verify', state: 'pending' },
        ],
      });
      await vi.advanceTimersByTimeAsync(6000);
      expect(region).toHaveTextContent('');
    });

    it('formats the message', async () => {
      const view = render(StageStepper, {
        steps: [{ id: 'a', label: 'Upload', state: 'running' }],
        stateLabels: { failed: 'Fehlgeschlagen' },
        formatAnnouncement: (step: StageStep, state: string) => `${state} – ${step.label}`,
      });
      await view.rerender({ steps: [{ id: 'a', label: 'Upload', state: 'failed' }] });
      await vi.advanceTimersByTimeAsync(100);
      expect(screen.getByRole('status')).toHaveTextContent('Fehlgeschlagen – Upload');
    });

    it('stays silent with announce off', async () => {
      const view = render(StageStepper, {
        steps: [{ id: 'a', label: 'Upload', state: 'running' }],
        announce: false,
      });
      expect(screen.queryByRole('status')).toBeNull();
      await view.rerender({ steps: [{ id: 'a', label: 'Upload', state: 'done' }] });
      await vi.advanceTimersByTimeAsync(100);
      expect(screen.queryByRole('status')).toBeNull();
    });
  });
});
