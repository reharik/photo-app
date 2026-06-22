import type { SmartEnumLike, StandardEnumItem } from '@reharik/smart-enum';

import type { MultiComboboxOption } from '../../ui/MultiCombobox';

/** enum members (+ optional filter) → MultiComboboxOption[] */
export const valueDisplayFromEnumMembers = (
  members: readonly StandardEnumItem[],
): MultiComboboxOption[] => {
  return members.map((member) => ({
    value: member.value,
    display: member.display,
  }));
};

export const valueDisplayFromEnum = <T extends SmartEnumLike>(
  enumeration: T,
  filter?: (member: StandardEnumItem) => boolean,
): MultiComboboxOption[] => {
  return enumeration
    .items()
    .filter((item) => filter?.(item) ?? true)
    .map((item) => ({
      value: item.value,
      display: item.display,
    }));
};

/** MultiComboboxOption[] → Operation[] for grant mutations */
export const enumItemsFromValueDisplay = <T extends StandardEnumItem>(
  enumeration: SmartEnumLike,
  options: readonly MultiComboboxOption[],
): T[] => {
  return options.map((option) => enumeration.tryFromValue(option.value) as T);
};
