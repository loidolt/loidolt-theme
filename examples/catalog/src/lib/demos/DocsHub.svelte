<script lang="ts">
  import { base } from '$app/paths';
  import { DocsHub } from '@loidolt/theme-docs';
</script>

<DocsHub
  headingLevel={3}
  sections={[
    {
      title: 'Foundations',
      description: 'The system the components are built on.',
      items: [
        {
          title: 'Tokens and type',
          href: `${base}/foundations`,
          description: 'Colour, spacing and type, with their roles.',
          eyebrow: 'Guide',
        },
        {
          title: 'Patterns',
          href: `${base}/patterns`,
          description: 'Layouts assembled from the components.',
          eyebrow: 'Guide',
        },
      ],
    },
    {
      title: 'Packages',
      items: [
        {
          title: 'Charts',
          href: `${base}/components/chart`,
          description: 'Themed, accessible ECharts.',
        },
        {
          title: 'Maps',
          href: `${base}/components/map-view`,
          description: 'Themed, accessible MapLibre maps.',
        },
        {
          title: 'Loidolt theme on GitHub',
          href: 'https://github.com/loidolt/loidolt-theme',
          external: true,
        },
      ],
    },
  ]}
/>
