<script lang="ts">
  interface Props {
    code: string;
  }

  let { code }: Props = $props();
</script>

<!-- The element is intentionally focusable: narrow code samples scroll horizontally, and Safari
     keyboard users need to be able to reach the scroll container. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<pre tabindex="0">{code}</pre>
