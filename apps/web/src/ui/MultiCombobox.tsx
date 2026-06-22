import { useCombobox, useMultipleSelection } from 'downshift';
import React, { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';

export type MultiComboboxOption = {
  value: string;
  display: string;
};

type MultiComboboxProps = {
  value: readonly MultiComboboxOption[];
  onChange: (next: MultiComboboxOption[]) => void;
  items: readonly MultiComboboxOption[];
  allowCustomValue?: boolean;
  createCustomItem?: (input: string) => MultiComboboxOption;
  validateEntry?: (input: string) => string | undefined;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  hint?: string;
  emptyMessage?: string;
  customValueLabel?: (input: string) => string;
};

type ListOption = { kind: 'item'; item: MultiComboboxOption } | { kind: 'custom'; value: string };

const DEFAULT_EMPTY_MESSAGE = 'No results.';
const PANEL_OFFSET_PX = 4;
const defaultCustomValueLabel = (input: string): string => `Add "${input}"`;

const includesValue = (list: readonly MultiComboboxOption[], item: MultiComboboxOption): boolean =>
  list.some((entry) => entry.value === item.value);

type BuildComboboxItemsResult = {
  comboboxItems: ListOption[];
  customOption: ListOption | null;
};

const buildComboboxItems = (
  rawInputValue: string,
  catalogItems: readonly MultiComboboxOption[],
  allowCustom: boolean,
): BuildComboboxItemsResult => {
  const query = rawInputValue.trim().toLowerCase();
  const filteredItems =
    query === ''
      ? [...catalogItems]
      : catalogItems.filter((item) => item.display.toLowerCase().includes(query));

  const hasExactMatch =
    query !== '' && catalogItems.some((item) => item.display.trim().toLowerCase() === query);

  const customOption: ListOption | null =
    allowCustom && rawInputValue.trim() && !hasExactMatch
      ? { kind: 'custom', value: rawInputValue.trim() }
      : null;

  const comboboxItems: ListOption[] = [
    ...filteredItems.map((item) => ({ kind: 'item' as const, item })),
    ...(customOption ? [customOption] : []),
  ];

  return { comboboxItems, customOption };
};

/** Option X: when a custom row exists, highlight it; otherwise the top catalog match. */
const resolveHighlightedIndex = (
  comboboxItems: readonly ListOption[],
  customOption: ListOption | null,
): number => {
  if (comboboxItems.length === 0) {
    return -1;
  }
  if (customOption != null) {
    return comboboxItems.length - 1;
  }
  return 0;
};

export const MultiCombobox = ({
  value,
  onChange,
  items,
  allowCustomValue = false,
  createCustomItem,
  validateEntry,
  placeholder,
  disabled,
  error,
  label,
  hint,
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
  customValueLabel = defaultCustomValueLabel,
}: MultiComboboxProps): React.ReactElement => {
  const [inputValue, setInputValue] = useState('');
  const [localValidationError, setLocalValidationError] = useState<string | undefined>(undefined);
  const [menuCoords, setMenuCoords] = useState<
    { top: number; left: number; width: number } | undefined
  >(undefined);
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const inputId = React.useId();
  const displayError = error ?? localValidationError;
  const hasError = Boolean(displayError);

  const selectedItems = React.useMemo(() => [...value], [value]);

  const { getSelectedItemProps, getDropdownProps, removeSelectedItem } = useMultipleSelection({
    selectedItems,
    onSelectedItemsChange: ({ selectedItems: nextSelectedItems }) => {
      onChange(nextSelectedItems ?? []);
    },
    itemToKey: (item) => (item == null ? '' : item.value),
  });

  const { comboboxItems } = buildComboboxItems(inputValue, items, allowCustomValue);

  const itemToString = (option: ListOption | null): string => {
    if (!option) {
      return '';
    }
    return option.kind === 'item' ? option.item.display : option.value;
  };

  const addItem = (item: MultiComboboxOption): void => {
    if (includesValue(value, item)) {
      return;
    }
    onChange([...value, item]);
  };

  const handleSelectOption = (option: ListOption): void => {
    if (option.kind === 'item') {
      addItem(option.item);
      setLocalValidationError(undefined);
      return;
    }

    if (!createCustomItem) {
      return;
    }

    const trimmed = option.value;
    const validationMessage = validateEntry?.(trimmed);
    if (validationMessage) {
      setLocalValidationError(validationMessage);
      setInputValue(trimmed);
      return;
    }

    addItem(createCustomItem(trimmed));
    setLocalValidationError(undefined);
  };

  const {
    isOpen,
    highlightedIndex,
    getMenuProps,
    getInputProps,
    getItemProps,
    selectItem,
    closeMenu,
  } = useCombobox<ListOption>({
    items: comboboxItems,
    inputValue,
    itemToString,
    onInputValueChange: ({ inputValue: nextInputValue }) => {
      setInputValue(nextInputValue ?? '');
      setLocalValidationError(undefined);
    },
    onSelectedItemChange: ({ selectedItem: nextSelectedItem }) => {
      if (!nextSelectedItem) {
        return;
      }
      handleSelectOption(nextSelectedItem);
    },
    stateReducer: (state, actionAndChanges) => {
      const { changes, type } = actionAndChanges;
      switch (type) {
        case useCombobox.stateChangeTypes.InputChange: {
          const { comboboxItems: nextItems, customOption: nextCustomOption } = buildComboboxItems(
            changes.inputValue ?? '',
            items,
            allowCustomValue,
          );
          return {
            ...changes,
            highlightedIndex: resolveHighlightedIndex(nextItems, nextCustomOption),
          };
        }
        case useCombobox.stateChangeTypes.InputClick: {
          if (!changes.isOpen) {
            return changes;
          }
          const { comboboxItems: nextItems, customOption: nextCustomOption } = buildComboboxItems(
            state.inputValue,
            items,
            allowCustomValue,
          );
          return {
            ...changes,
            highlightedIndex: resolveHighlightedIndex(nextItems, nextCustomOption),
          };
        }
        case useCombobox.stateChangeTypes.ItemClick:
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
          if (changes.selectedItem != null) {
            return {
              ...changes,
              isOpen: true,
              inputValue: '',
            };
          }
          return changes;
        default:
          return changes;
      }
    },
  });

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuCoords(undefined);
      return;
    }

    const updatePosition = (): void => {
      const anchor = triggerRef.current;
      if (anchor == null) {
        return;
      }
      const rect = anchor.getBoundingClientRect();
      setMenuCoords({
        top: rect.bottom + PANEL_OFFSET_PX,
        left: rect.left,
        width: rect.width,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  const showEmpty = isOpen && comboboxItems.length === 0;

  const inputProps = getInputProps({
    ...getDropdownProps({
      id: inputId,
      disabled,
      placeholder,
      autoComplete: 'off',
      name: 'new-password',
    }),
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Tab' && highlightedIndex >= 0) {
        selectItem(comboboxItems[highlightedIndex] ?? null);
      }
    },
  });

  const menuProps = getMenuProps(
    {
      'aria-hidden': !isOpen,
    },
    { suppressRefError: true },
  );

  const portaledMenu =
    isOpen && menuCoords != null
      ? createPortal(
          <MenuList
            {...menuProps}
            $open={isOpen}
            $top={menuCoords.top}
            $left={menuCoords.left}
            $width={menuCoords.width}
          >
            {comboboxItems.map((option, index) => (
              <MenuItem
                key={option.kind === 'item' ? option.item.value : `custom-${option.value}`}
                {...getItemProps({ item: option, index })}
                $highlighted={highlightedIndex === index}
                $selected={option.kind === 'item' && includesValue(value, option.item)}
              >
                {option.kind === 'item' ? option.item.display : customValueLabel(option.value)}
              </MenuItem>
            ))}
            {showEmpty ? <EmptyMessage>{emptyMessage}</EmptyMessage> : null}
          </MenuList>,
          document.body,
        )
      : null;

  return (
    <FieldWrapper>
      {label ? <LabelWrapper htmlFor={inputId}>{label}</LabelWrapper> : null}
      {hint ? <Hint>{hint}</Hint> : null}
      <InputWrap>
        <TriggerWrap ref={triggerRef} $hasError={hasError} $disabled={Boolean(disabled)}>
          {selectedItems.map((selectedItem, index) => (
            <SelectedPill
              key={selectedItem.value}
              {...getSelectedItemProps({ selectedItem, index })}
            >
              <PillLabel>{selectedItem.display}</PillLabel>
              <RemoveButton
                type="button"
                aria-label={`Remove ${selectedItem.display}`}
                disabled={disabled}
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                  event.stopPropagation();
                  removeSelectedItem(selectedItem);
                }}
              >
                ×
              </RemoveButton>
            </SelectedPill>
          ))}
          <InlineInput
            {...inputProps}
            onBlur={(event: React.FocusEvent<HTMLInputElement>) => {
              inputProps.onBlur?.(event);
              closeMenu();
            }}
            aria-invalid={hasError}
          />
        </TriggerWrap>
        {portaledMenu}
      </InputWrap>
      {displayError ? <ErrorMessage>{displayError}</ErrorMessage> : null}
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

const Hint = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize._12};
  line-height: 1.4;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
`;

const InputWrap = styled.div`
  position: relative;
`;

const TriggerWrap = styled.div<{ $hasError: boolean; $disabled: boolean }>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.75)};
  width: 100%;
  box-sizing: border-box;
  padding: ${({ theme }) => theme.spacing(0.75)} ${({ theme }) => theme.spacing(1.25)};
  background: ${({ theme, $disabled }) =>
    $disabled ? theme.color.inputDisabledBg : theme.color.inputBg};
  border: 1px solid
    ${({ theme, $hasError }) => ($hasError ? theme.color.formError : theme.color.inputBorder)};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'text')};

  &:focus-within {
    border-color: ${({ theme, $hasError }) =>
      $hasError ? theme.color.formError : theme.color.inputBorderFocus};
    box-shadow: 0 0 0 3px
      ${({ theme, $hasError }) =>
        $hasError ? `${theme.color.formError}26` : `${theme.color.inputBorderFocus}26`};
  }
`;

const SelectedPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
  padding: 2px 4px 2px 8px;
  border-radius: 999px;
  background: ${({ theme }) => theme.color.selectionBg};
  color: ${({ theme }) => theme.color.selectionText};
  font-size: ${({ theme }) => theme.fontSize._12};
  line-height: 1.4;
  max-width: 100%;
`;

const PillLabel = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RemoveButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ theme }) => theme.spacing(2)};
  height: ${({ theme }) => theme.spacing(2)};
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: inherit;
  font-size: ${({ theme }) => theme.fontSize._14};
  line-height: 1;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.08);
  }
`;

const InlineInput = styled.input`
  flex: 1 1 120px;
  min-width: 80px;
  border: 0;
  outline: none;
  background: transparent;
  color: ${({ theme }) => theme.color.inputText};
  font-size: ${({ theme }) => theme.fontSize._14};
  padding: ${({ theme }) => theme.spacing(0.25)} 0;

  &::placeholder {
    color: ${({ theme }) => theme.color.inputPlaceholder};
  }

  &:disabled {
    color: ${({ theme }) => theme.color.inputDisabledText};
    cursor: not-allowed;
  }
`;

const MenuList = styled.ul<{ $open: boolean; $top: number; $left: number; $width: number }>`
  position: fixed;
  top: ${({ $top }) => $top}px;
  left: ${({ $left }) => $left}px;
  width: ${({ $width }) => $width}px;
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

const MenuItem = styled.li<{ $highlighted: boolean; $selected: boolean }>`
  padding: ${({ theme }) => theme.spacing(1.25)} ${({ theme }) => theme.spacing(1.5)};
  font-size: ${({ theme }) => theme.fontSize._14};
  cursor: pointer;
  background: ${({ theme, $highlighted, $selected }) => {
    if ($highlighted) {
      return theme.color.bodyElevated;
    }
    if ($selected) {
      return theme.color.selectionBg;
    }
    return 'transparent';
  }};
  color: ${({ theme, $selected }) =>
    $selected ? theme.color.selectionText : theme.color.bodyText};
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

export type { MultiComboboxProps };
