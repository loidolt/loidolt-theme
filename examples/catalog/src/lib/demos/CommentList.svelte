<script lang="ts">
  import { CommentList } from '@loidolt/theme-svelte';

  let activeId = $state<string | null>('c2');
</script>

<CommentList
  bind:activeId
  items={[
    {
      id: 'c1',
      author: 'Jane Client',
      meta: '· 3 Jun 2026, 14:02',
      body: 'Logo is off-center.',
      marker: 1,
    },
    {
      id: 'c2',
      author: 'Studio',
      meta: '· 3 Jun 2026, 15:40',
      body: 'Fixed in round 2 — moved 4mm left.',
    },
    {
      id: 'c3',
      author: 'Jane Client',
      meta: '· 4 Jun 2026, 09:12',
      body: 'Looks great now.',
      marker: 2,
    },
  ]}
/>
