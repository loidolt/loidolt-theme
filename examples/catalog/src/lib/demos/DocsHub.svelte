<script lang="ts">
  import { resolve } from '$app/paths';
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
          href: resolve('/foundations'),
          description: 'Colour, spacing and type, with their roles.',
          eyebrow: 'Guide',
        },
        {
          title: 'Patterns',
          href: resolve('/patterns'),
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
          href: resolve('/components/[slug]', { slug: 'chart' }),
          description: 'Themed, accessible ECharts.',
        },
        {
          title: 'Maps',
          href: resolve('/components/[slug]', { slug: 'map-view' }),
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
