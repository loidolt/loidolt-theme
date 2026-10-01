import { definePreset } from './define.js';

/**
 * The Loidolt look, packed tighter for data-dense tools. Coarse pointers still get their 44px
 * targets: those rules key off the pointer, not the preset.
 */
export const compact = definePreset({
  name: 'compact',
  label: 'Compact',
  description: 'The Loidolt look with tighter padding and smaller controls.',
  density: 0.75,
  primitives: {
    sizing: {
      // 28px: still above the 24px WCAG 2.5.8 minimum.
      controlSm: '1.75rem',
      control: '2.125rem',
      controlLg: '2.5rem',
      topbar: '3.25rem',
      contextbar: '2.25rem',
    },
  },
});
