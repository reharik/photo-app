import React, { useRef, useState } from 'react';
import type { Key, Selection } from 'react-aria-components';
import {
  Button,
  ComboBox,
  Input,
  ListBox,
  ListBoxItem,
  Popover,
  Tag,
  TagGroup,
  TagList,
} from 'react-aria-components';
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

/** Sentinel key for the synthetic "create custom value" row injected into the list. */
const CUSTOM_KEY = '__multicombobox_custom__';

type ListItem = {
  id: string;
  label: string;
  isCustom: boolean;
  option?: MultiComboboxOption;
};

const DEFAULT_EMPTY_MESSAGE = 'No results.';
const defaultCustomValueLabel = (input: string): string => `Add "${input}"`;

const includesValue = (list: readonly MultiComboboxOption[], item: MultiComboboxOption): boolean =>
  list.some((entry) => entry.value === item.value);

const buildListItems = (
  rawInputValue: string,
  catalogItems: readonly MultiComboboxOption[],
  selected: readonly MultiComboboxOption[],
  allowCustom: boolean,
  customValueLabel: (input: string) => string,
): ListItem[] => {
  const query = rawInputValue.trim().toLowerCase();
  const selectedKeys = new Set(selected.map((entry) => entry.value));

  const filtered = catalogItems
    .filter((item) => !selectedKeys.has(item.value))
    .filter((item) => query === '' || item.display.toLowerCase().includes(query));

  const hasExactMatch =
    query !== '' && catalogItems.some((item) => item.display.trim().toLowerCase() === query);

  const items: ListItem[] = filtered.map((option) => ({
    id: option.value,
    label: option.display,
    isCustom: false,
    option,
  }));

  if (allowCustom && rawInputValue.trim() && !hasExactMatch) {
    items.push({ id: CUSTOM_KEY, label: customValueLabel(rawInputValue.trim()), isCustom: true });
  }

  return items;
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
  // The popover anchors to the whole field box (tags + input), not just the input.
  const fieldBoxRef = useRef<HTMLDivElement>(null);

  const displayError = error ?? localValidationError;
  const hasError = Boolean(displayError);

  const listItems = buildListItems(inputValue, items, value, allowCustomValue, customValueLabel);

  /** Add a catalog/custom option, with dedup backstop. Always clears the input. */
  const addOption = (option: MultiComboboxOption): void => {
    if (!includesValue(value, option)) {
      onChange([...value, option]);
    }
    setInputValue('');
    setLocalValidationError(undefined);
  };

  /** Commit free-text custom value (validation gate). Keeps input on validation failure. */
  const commitCustom = (raw: string): void => {
    const trimmed = raw.trim();
    if (!trimmed || !allowCustomValue || !createCustomItem) {
      return;
    }
    const validationMessage = validateEntry?.(trimmed);
    if (validationMessage) {
      setLocalValidationError(validationMessage);
      return;
    }
    addOption(createCustomItem(trimmed));
  };

  const handleSelectionChange = (key: Key | null): void => {
    // Custom-value blur paths surface as null here — handled by onBlur instead.
    if (key == null) {
      return;
    }
    if (key === CUSTOM_KEY) {
      commitCustom(inputValue);
      return;
    }
    const picked = listItems.find((entry) => entry.id === key)?.option;
    if (picked) {
      addOption(picked);
    }
  };

  const handleRemove = (keys: Selection): void => {
    if (keys === 'all') {
      onChange([]);
      return;
    }
    onChange(value.filter((entry) => !keys.has(entry.value)));
  };

  return (
    <FieldWrapper>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      {hint ? <Hint>{hint}</Hint> : null}
      <FieldBox ref={fieldBoxRef} $hasError={hasError} $disabled={Boolean(disabled)}>
        {/*
          The TagGroup MUST be a sibling of the ComboBox, not nested inside it: RAC's Tag
          and ListBox both read the same ListStateContext, so a TagGroup rendered under a
          ComboBox resolves the combobox's list state and crashes on its tag items.
        */}
        <StyledTagGroup
          aria-label={label ? `Selected ${label}` : 'Selected items'}
          onRemove={handleRemove}
        >
          <TagList items={value} renderEmptyState={() => null}>
            {(item: MultiComboboxOption) => (
              // Raw Tag — styled() would change its type and break RAC collection detection.
              <Tag id={item.value} textValue={item.display} className="mc-tag">
                <PillLabel>{item.display}</PillLabel>
                <RemoveButton
                  slot="remove"
                  aria-label={`Remove ${item.display}`}
                  isDisabled={disabled}
                >
                  ×
                </RemoveButton>
              </Tag>
            )}
          </TagList>
        </StyledTagGroup>
        <ContentsComboBox
          aria-label={label}
          // selection always flows into the tag list; the combobox never holds a selection
          selectedKey={null}
          inputValue={inputValue}
          onInputChange={(next) => {
            setInputValue(next);
            setLocalValidationError(undefined);
          }}
          onSelectionChange={handleSelectionChange}
          // OUR allowCustomValue is modelled via the injected custom row + blur-commit below;
          // RAC's own flag stays off so the first option auto-focuses for Enter-to-commit.
          allowsCustomValue={false}
          allowsEmptyCollection
          // Open on focus so predefined options are visible without typing.
          menuTrigger="focus"
          isDisabled={disabled}
        >
          <StyledInput
            placeholder={placeholder}
            aria-invalid={hasError}
            onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
              // Backspace on an empty input removes the most recently added tag.
              if (event.key === 'Backspace' && inputValue === '' && value.length > 0) {
                event.preventDefault();
                onChange(value.slice(0, -1));
                return;
              }
              if (event.key !== 'Enter') {
                return;
              }
              // Never let Enter submit the enclosing form from this field.
              event.preventDefault();
              // If the user arrow-focused an option, let RAC select it (onSelectionChange).
              if (event.currentTarget.getAttribute('aria-activedescendant')) {
                return;
              }
              // Otherwise commit the typed value (RAC does not auto-focus the first row).
              if (!inputValue.trim()) {
                return;
              }
              const query = inputValue.trim().toLowerCase();
              const exact = listItems.find(
                (entry) => !entry.isCustom && entry.label.trim().toLowerCase() === query,
              );
              const target = exact ?? listItems.find((entry) => entry.isCustom) ?? listItems[0];
              if (target?.isCustom) {
                commitCustom(inputValue);
              } else if (target?.option) {
                addOption(target.option);
              }
            }}
            onBlur={() => {
              if (allowCustomValue) {
                // Commit-on-blur: turn a pending valid custom entry into a tag.
                // No-op on empty input (e.g. just after a selection cleared it).
                if (inputValue.trim()) {
                  commitCustom(inputValue);
                }
              } else if (inputValue) {
                // List-only field: discard un-committed filter text on blur.
                setInputValue('');
                setLocalValidationError(undefined);
              }
            }}
          />
          <StyledPopover triggerRef={fieldBoxRef}>
            <StyledListBox items={listItems} renderEmptyState={() => <Empty>{emptyMessage}</Empty>}>
              {(item: ListItem) => (
                // Raw ListBoxItem (see Tag note) — styled via .mc-item on the parent.
                <ListBoxItem id={item.id} textValue={item.label} className="mc-item">
                  {item.label}
                </ListBoxItem>
              )}
            </StyledListBox>
          </StyledPopover>
        </ContentsComboBox>
      </FieldBox>
      {displayError ? <ErrorMessage>{displayError}</ErrorMessage> : null}
    </FieldWrapper>
  );
};

const FieldWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

const FieldLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSize._14};
  color: ${({ theme }) => theme.color.label};
`;

const Hint = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize._12};
  line-height: 1.4;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
`;

const FieldBox = styled.div<{ $hasError: boolean; $disabled: boolean }>`
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

// Pills flow inline with the input inside FieldBox; the wrappers themselves render no box.
const StyledTagGroup = styled(TagGroup)`
  display: contents;

  .mc-tag {
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
    outline: none;
  }
`;

const ContentsComboBox = styled(ComboBox)`
  display: contents;
`;

const PillLabel = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RemoveButton = styled(Button)`
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

  &[data-disabled] {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &[data-hovered] {
    background: rgba(0, 0, 0, 0.08);
  }
`;

const StyledInput = styled(Input)`
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

  &[data-disabled] {
    color: ${({ theme }) => theme.color.inputDisabledText};
    cursor: not-allowed;
  }
`;

const StyledPopover = styled(Popover)`
  width: var(--trigger-width);
`;

const StyledListBox = styled(ListBox)`
  margin: 0;
  padding: ${({ theme }) => theme.spacing(0.5)} 0;
  list-style: none;
  background: ${({ theme }) => theme.color.bodyRaised};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.boxShadow.md};
  max-height: ${({ theme }) => theme.spacing(32)};
  overflow-y: auto;
  outline: none;

  .mc-item {
    padding: ${({ theme }) => theme.spacing(1.25)} ${({ theme }) => theme.spacing(1.5)};
    font-size: ${({ theme }) => theme.fontSize._14};
    color: ${({ theme }) => theme.color.bodyText};
    cursor: pointer;
    outline: none;
  }

  .mc-item[data-focused] {
    background: ${({ theme }) => theme.color.bodyElevated};
  }

  .mc-item[data-selected] {
    background: ${({ theme }) => theme.color.selectionBg};
    color: ${({ theme }) => theme.color.selectionText};
  }
` as typeof ListBox;

const Empty = styled.div`
  padding: ${({ theme }) => theme.spacing(1.25)} ${({ theme }) => theme.spacing(1.5)};
  color: ${({ theme }) => theme.color.bodyTextMuted};
  font-size: ${({ theme }) => theme.fontSize._14};
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.color.formError};
  font-size: ${({ theme }) => theme.fontSize._12};
`;

export type { MultiComboboxProps };
