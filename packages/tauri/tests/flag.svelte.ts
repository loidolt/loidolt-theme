/** A boolean in `$state`, for commands whose `enabled` reads reactive state. */
export function flag(initial: boolean) {
  let value = $state(initial);
  return {
    get value() {
      return value;
    },
    set value(next: boolean) {
      value = next;
    },
  };
}
