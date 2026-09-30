import type { CategoryData } from './types.js';

/** Throws a `RangeError` naming the builder, so a bad dataset fails where it is built. */
export function invariant(condition: unknown, builder: string, message: string): asserts condition {
  if (!condition) throw new RangeError(`${builder}: ${message}`);
}

export function checkCategories(data: CategoryData, builder: string): void {
  for (const series of data.series) {
    invariant(
      series.data.length === data.categories.length,
      builder,
      `series "${series.name}" has ${series.data.length} values for ${data.categories.length} categories`
    );
  }
}
