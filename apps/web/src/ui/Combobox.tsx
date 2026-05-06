import { useCombobox } from 'downshift';
import React, { ReactNode } from 'react';
import styled from 'styled-components';

type ComboboxProps<T> = {
  items: readonly T[];
  value: T | null;
  onChange: (value: T | { customValue: string }) => void;
  onInputValueChange?: (value: string) => void;
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  renderItem?: (item: T) => ReactNode;
  allowCustomValue?: boolean;
  customValueLabel?: (input: string) => string;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  error?: string;
  emptyMessage?: string;
};

type ComboboxOption<T> = { kind: 'item'; item: T } | { kind: 'custom'; value: string };

const DEFAULT_EMPTY_MESSAGE = 'No results.';

export const Combobox = <T,>({
  items,
  value,
  onChange,
  onInputValueChange,
  getKey,
  getLabel,
  renderItem,
  allowCustomValue,
  customValueLabel,
  placeholder,
  disabled,
  label,
  error,
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
}: ComboboxProps<T>): React.ReactElement => {
  const [inputValue, setInputValue] = React.useState<string>(value ? getLabel(value) : '');
  const [selectedItem, setSelectedItem] = React.useState<ComboboxOption<T> | null>(
    value ? { kind: 'item', item: value } : null,
  );
  const inputId = React.useId();
  const hasError = Boolean(error);

  React.useEffect(() => {
    if (!value) {
      setSelectedItem(null);
      return;
    }
    setSelectedItem({ kind: 'item', item: value });
    setInputValue(getLabel(value));
  }, [getLabel, value]);

  const filteredItems = React.useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query) {
      return items;
    }
    return items.filter((item) => getLabel(item).toLowerCase().includes(query));
  }, [getLabel, inputValue, items]);

  const hasExactMatch = React.useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query) {
      return false;
    }
    return items.some((item) => getLabel(item).trim().toLowerCase() === query);
  }, [getLabel, inputValue, items]);

  const customOption: ComboboxOption<T> | null =
    allowCustomValue && inputValue.trim() && !hasExactMatch
      ? { kind: 'custom', value: inputValue.trim() }
      : null;

  const comboboxItems: ComboboxOption<T>[] = [
    ...filteredItems.map((item) => ({ kind: 'item', item }) as ComboboxOption<T>),
    ...(customOption ? [customOption] : []),
  ];

  const itemToString = (option: ComboboxOption<T> | null): string => {
    if (!option) {
      return '';
    }
    return option.kind === 'item' ? getLabel(option.item) : option.value;
  };

  const {
    isOpen,
    highlightedIndex,
    getMenuProps,
    getInputProps,
    getItemProps,
    selectItem,
    closeMenu,
  } = useCombobox<ComboboxOption<T>>({
    items: comboboxItems,
    inputValue,
    selectedItem,
    itemToString,
    onInputValueChange: ({ inputValue: nextInputValue }) => {
      const value = nextInputValue ?? '';
      setInputValue(value);
      onInputValueChange?.(value);
    },
    onSelectedItemChange: ({ selectedItem: nextSelectedItem }) => {
      if (!nextSelectedItem) {
        return;
      }

      setSelectedItem(nextSelectedItem);
      if (nextSelectedItem.kind === 'item') {
        const labelValue = getLabel(nextSelectedItem.item);
        setInputValue(labelValue);
        onChange(nextSelectedItem.item);
        return;
      }

      onChange({ customValue: nextSelectedItem.value });
    },
  });

  const showEmpty = isOpen && comboboxItems.length === 0;

  return (
    <FieldWrapper>
      {label ? <LabelWrapper htmlFor={inputId}>{label}</LabelWrapper> : null}
      <InputWrap>
        <InputField
          {...getInputProps({
            id: inputId,
            disabled,
            placeholder,
            onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
              if (event.key === 'Tab' && highlightedIndex >= 0) {
                selectItem(comboboxItems[highlightedIndex] ?? null);
                closeMenu();
              }
            },
            autoComplete: 'off',
            name: 'new-password',
          })}
          $hasError={hasError}
          aria-invalid={hasError}
        />
        <MenuList
          {...getMenuProps(
            {
              'aria-hidden': !isOpen,
            },
            { suppressRefError: true },
          )}
          $open={isOpen}
        >
          {comboboxItems.map((option, index) => (
            <MenuItem
              key={option.kind === 'item' ? getKey(option.item) : `custom-${option.value}`}
              {...getItemProps({ item: option, index })}
              $highlighted={highlightedIndex === index}
            >
              {option.kind === 'item'
                ? (renderItem?.(option.item) ?? getLabel(option.item))
                : (customValueLabel?.(option.value) ?? option.value)}
            </MenuItem>
          ))}
          {showEmpty ? <EmptyMessage>{emptyMessage}</EmptyMessage> : null}
        </MenuList>
      </InputWrap>
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
    </FieldWrapper>
  );
};

const FieldWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

const LabelWrapper = styled.label`
  font-size: ${({ theme }) => theme.fontSize._14};
  color: ${({ theme }) => theme.color.label};
`;

const InputWrap = styled.div`
  position: relative;
`;

const InputField = styled.input<{ $hasError: boolean }>`
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: ${({ theme }) => theme.spacing(1.25)} ${({ theme }) => theme.spacing(1.5)};
  background: ${({ theme }) => theme.color.inputBg};
  border: 1px solid
    ${({ theme, $hasError }) => ($hasError ? theme.color.formError : theme.color.inputBorder)};
  color: ${({ theme }) => theme.color.inputText};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  outline: none;
  font-size: ${({ theme }) => theme.fontSize._14};

  &:focus {
    border-color: ${({ theme, $hasError }) =>
      $hasError ? theme.color.formError : theme.color.inputBorderFocus};
    box-shadow: 0 0 0 3px
      ${({ theme, $hasError }) =>
        $hasError ? `${theme.color.formError}26` : `${theme.color.inputBorderFocus}26`};
  }

  &::placeholder {
    color: ${({ theme }) => theme.color.inputPlaceholder};
  }

  &:disabled {
    background: ${({ theme }) => theme.color.inputDisabledBg};
    color: ${({ theme }) => theme.color.inputDisabledText};
    cursor: not-allowed;
  }
`;

const MenuList = styled.ul<{ $open: boolean }>`
  position: absolute;
  top: calc(100% + ${({ theme }) => theme.spacing(0.5)});
  left: 0;
  right: 0;
  z-index: 1000;
  margin: 0;
  padding: ${({ theme }) => theme.spacing(0.5)} 0;
  list-style: none;
  background: ${({ theme }) => theme.color.bodyRaised};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.boxShadow.md};
  max-height: ${({ theme }) => theme.spacing(32)};
  overflow-y: auto;
  display: ${({ $open }) => ($open ? 'block' : 'none')};
`;

const MenuItem = styled.li<{ $highlighted: boolean }>`
  padding: ${({ theme }) => theme.spacing(1.25)} ${({ theme }) => theme.spacing(1.5)};
  color: ${({ theme }) => theme.color.bodyText};
  font-size: ${({ theme }) => theme.fontSize._14};
  cursor: pointer;
  background: ${({ theme, $highlighted }) =>
    $highlighted ? theme.color.bodyElevated : 'transparent'};
`;

const EmptyMessage = styled.li`
  padding: ${({ theme }) => theme.spacing(1.25)} ${({ theme }) => theme.spacing(1.5)};
  color: ${({ theme }) => theme.color.bodyTextMuted};
  font-size: ${({ theme }) => theme.fontSize._14};
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.color.formError};
  font-size: ${({ theme }) => theme.fontSize._12};
`;

export type { ComboboxProps };
