import type { Option, OptionGroup } from '../types.js';

export type OptionEntry<T extends string = string> = Option<T> | OptionGroup<T>;

export const isOptionGroup = <T extends string>(entry: OptionEntry<T>): entry is OptionGroup<T> =>
  'options' in entry;

/** Every option, groups flattened, with a group's `disabled` pushed down onto its members. */
export const flattenOptions = <T extends string>(entries: readonly OptionEntry<T>[]): Option<T>[] =>
  entries.flatMap<Option<T>>((entry) =>
    isOptionGroup(entry)
      ? entry.options.map((option) => (entry.disabled ? { ...option, disabled: true } : option))
      : [entry]
  );

/** Keeps the entries whose options match, dropping groups left empty. */
export const filterEntries = <T extends string>(
  entries: readonly OptionEntry<T>[],
  keep: (option: Option<T>) => boolean
): OptionEntry<T>[] =>
  entries.flatMap<OptionEntry<T>>((entry) => {
    if (!isOptionGroup(entry)) return keep(entry) ? [entry] : [];
    const options = entry.options.filter(keep);
    return options.length ? [{ ...entry, options }] : [];
  });

/** Case- and accent-insensitive substring match on the label. */
export const matchesQuery = (option: Option, query: string) => {
  const fold = (value: string) =>
    value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLocaleLowerCase();
  return fold(option.label).includes(fold(query.trim()));
};
