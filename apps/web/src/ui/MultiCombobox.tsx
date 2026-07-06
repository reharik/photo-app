import { Trash2 } from 'lucide-react';
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
import styled, { useTheme } from 'styled-components';

export type MultiComboboxOption = {
  value: string;
  display: string;
};

const DEFAULT_DELETE_ITEM_LABEL = 'Remove';

type MultiComboboxProps = {
  value: readonly MultiComboboxOption[];
  onChange: (next: MultiComboboxOption[]) => void;
  items: readonly MultiComboboxOption[];
  allowCustomValue?: boolean;
  createCustomItem?: (input: string) => MultiComboboxOption;
  validateEntry?: (input: string) => string | undefined;
  /**
   * Characters that commit the current input as a custom value when typed (and split
   * pasted text into multiple values). E.g. `[',', ' ']` lets `a@x.com b@y.com` or a
   * pasted list become individual pills. Only active when `allowCustomValue` +
   * `createCustomItem` are set; each committed token still passes `validateEntry`.
   */
  separators?: readonly string[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  hint?: string;
  emptyMessage?: string;
  /**
   * When set, each suggestion row shows a delete affordance that calls this with the
   * row's `value`. Used to remove a saved suggestion from history (not the current
   * selection). Rows are only the popup catalog items, so this never appears on pills.
   */
  onDeleteItem?: (value: string) => void;
  /** Accessible label + desktop tooltip for the per-row delete control. */
  deleteItemLabel?: string;
};

type ListItem = {
  id: string;
  label: string;
  option: MultiComboboxOption;
};

const DEFAULT_EMPTY_MESSAGE = 'No results.';

/**
 * Categorical pill palette — the theme's six accent/avatar hues. Each uses the
 * saturated `_lighter` tint as background with the `_darkest` variant for text, so
 * the chips read bold and clearly distinct while keeping AA-readable, per-hue
 * foregrounds. Theme tokens only. Status hues (error/success/etc.) are not used as
 * semantic signals here — these are drawn from the categorical avatar set.
 */
const PILL_PALETTE = [
  { bg: 'clay_lighter', text: 'clay_darkest' },
  { bg: 'blue_lighter', text: 'blue_darkest' },
  { bg: 'green_lighter', text: 'green_darkest' },
  { bg: 'purple_lighter', text: 'purple_darkest' },
  { bg: 'teal_lighter', text: 'teal_darkest' },
  { bg: 'yellow_lighter', text: 'yellow_darkest' },
] as const;

/**
 * Stable 32-bit string hash → palette index. Pure function of the value, so a given
 * option always maps to the same colour across renders and reloads, and adding or
 * removing pills never recolours the others.
 */
const pillPaletteIndex = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (Math.imul(hash, 31) + value.charCodeAt(i)) >>> 0;
  }
  return hash % PILL_PALETTE.length;
};

const includesValue = (list: readonly MultiComboboxOption[], item: MultiComboboxOption): boolean =>
  list.some((entry) => entry.value === item.value);

const escapeForCharClass = (char: string): string => char.replace(/[\]\\^-]/g, '\\$&');

/**
 * Regex that splits pasted text on any configured separator plus all whitespace
 * (so newline/tab-delimited paste also works). Returns null when no separators are
 * configured. Whitespace is always included since a value with a space is never a
 * single token in a separator-enabled field.
 */
const buildSeparatorRegex = (separators: readonly string[]): RegExp | null => {
  if (separators.length === 0) {
    return null;
  }
  const nonWhitespace = separators.filter((sep) => !/\s/.test(sep)).map(escapeForCharClass);
  return new RegExp(`[\\s${nonWhitespace.join('')}]+`);
};

/**
 * Pure typeahead list: the catalog options that aren't already selected and match the
 * query. No synthetic "add this" row — custom values are committed via
 * keyboard/paste/blur — so the popover only appears when there's a real suggestion and
 * never covers the field's error text while free text is being typed.
 */
const buildListItems = (
  rawInputValue: string,
  catalogItems: readonly MultiComboboxOption[],
  selected: readonly MultiComboboxOption[],
): ListItem[] => {
  const query = rawInputValue.trim().toLowerCase();
  const selectedKeys = new Set(selected.map((entry) => entry.value));

  return catalogItems
    .filter((item) => !selectedKeys.has(item.value))
    .filter((item) => query === '' || item.display.toLowerCase().includes(query))
    .map((option) => ({ id: option.value, label: option.display, option }));
};

/**
 * Renders `text` with the first case-insensitive occurrence of `query` wrapped for
 * emphasis — the standard typeahead affordance showing what the input matched. Mirrors
 * the substring filter in buildListItems.
 */
const HighlightMatch = ({ text, query }: { text: string; query: string }): React.ReactElement => {
  const needle = query.trim().toLowerCase();
  const index = needle ? text.toLowerCase().indexOf(needle) : -1;
  if (index === -1) {
    return <>{text}</>;
  }
  return (
    <div>
      {text.slice(0, index)}
      <Match>{text.slice(index, index + needle.length)}</Match>
      {text.slice(index + needle.length)}
    </div>
  );
};

export const MultiCombobox = ({
  value,
  onChange,
  items,
  allowCustomValue = false,
  createCustomItem,
  validateEntry,
  separators = [],
  placeholder,
  disabled,
  error,
  label,
  hint,
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
  onDeleteItem,
  deleteItemLabel = DEFAULT_DELETE_ITEM_LABEL,
}: MultiComboboxProps): React.ReactElement => {
  const theme = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [localValidationError, setLocalValidationError] = useState<string | undefined>(undefined);
  // The popover anchors to the whole field box (tags + input), not just the input.
  const fieldBoxRef = useRef<HTMLDivElement>(null);
  // Delete-vs-select guard: RAC ComboBox selects an option on press-UP, which our
  // trash button's onClick can't reliably cancel (the click is swallowed while the
  // press-up selection still fires — the row would silently become a recipient pill).
  // So we delete on pointer-down and stamp the row's key here; handleSelectionChange
  // drops the matching press-up selection. Keyed (not a bare bool) so a stale value is
  // harmless — it only ever suppresses re-selecting the exact row we just deleted.
  const suppressSelectKeyRef = useRef<Key | null>(null);

  const displayError = error ?? localValidationError;
  const hasError = Boolean(displayError);

  const listItems = buildListItems(inputValue, items, value);

  // RAC's ComboBox manages its own open state (useComboBoxState hard-forces isOpen to
  // undefined, so it can't be controlled). Instead we lean on menuTrigger="focus" +
  // no allowsEmptyCollection: it opens on focus and auto-closes when nothing matches.
  // This mirror of "is the suggestion popover covering the field?" is only used to hide
  // the error text while the dropdown sits over it.
  const suggestionsOpen = isFocused && listItems.length > 0;

  // Separator/paste committing only makes sense when we can actually build custom values.
  const separatorEnabled = allowCustomValue && Boolean(createCustomItem) && separators.length > 0;
  const separatorKeys = new Set(separators);
  const separatorRegex = buildSeparatorRegex(separators);

  /** Add a catalog/custom option, with dedup backstop. Always clears the input. */
  const addOption = (option: MultiComboboxOption): void => {
    if (!includesValue(value, option)) {
      onChange([...value, option]);
    }
    setInputValue('');
    setLocalValidationError(undefined);
  };

  /** Add several options in one onChange (dedup vs current value and each other). */
  const addOptions = (options: MultiComboboxOption[]): void => {
    if (options.length === 0) {
      return;
    }
    const next = [...value];
    for (const option of options) {
      if (!includesValue(next, option)) {
        next.push(option);
      }
    }
    onChange(next);
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

  /**
   * Commit the current input via Enter or a separator key: an exact catalog match wins,
   * otherwise a validated custom value (allowCustomValue fields), otherwise — for
   * list-only fields — the best current match. No-op on empty input.
   */
  const commitInput = (): void => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      return;
    }
    const query = trimmed.toLowerCase();
    const exact = listItems.find((entry) => entry.label.trim().toLowerCase() === query);
    if (exact) {
      addOption(exact.option);
    } else if (allowCustomValue) {
      commitCustom(inputValue);
    } else if (listItems[0]) {
      addOption(listItems[0].option);
    }
  };

  /**
   * Paste-to-pills: split pasted text (combined with any text already typed) on the
   * configured separators, commit every token that validates, and leave the rest —
   * unparsed/invalid tokens — in the input for the user to fix. If nothing validates,
   * fall through to the browser's default paste so the field just fills normally.
   */
  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>): void => {
    if (!separatorEnabled || !separatorRegex || !createCustomItem) {
      return;
    }
    const pasted = event.clipboardData.getData('text');
    if (!pasted) {
      return;
    }
    const tokens = (inputValue + pasted)
      .split(separatorRegex)
      .map((token) => token.trim())
      .filter(Boolean);

    const toCommit: MultiComboboxOption[] = [];
    const leftovers: string[] = [];
    for (const token of tokens) {
      if (validateEntry?.(token)) {
        leftovers.push(token);
      } else {
        toCommit.push(createCustomItem(token));
      }
    }

    if (toCommit.length === 0) {
      return; // nothing valid — let the default paste populate the input
    }
    event.preventDefault();
    addOptions(toCommit);
    setInputValue(leftovers.join(' '));
    setLocalValidationError(undefined);
  };

  const handleSelectionChange = (key: Key | null): void => {
    // Custom-value blur paths surface as null here — handled by onBlur instead.
    if (key == null) {
      return;
    }
    // Drop the press-up selection that RAC fires when the trash button was pressed
    // (see suppressSelectKeyRef) so deleting a suggestion never also selects it.
    if (key === suppressSelectKeyRef.current) {
      suppressSelectKeyRef.current = null;
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
            {(item: MultiComboboxOption) => {
              // Deterministic colour from the value: same value → same pill colour.
              const pill = PILL_PALETTE[pillPaletteIndex(item.value)];
              return (
                // Raw Tag — styled() would change its type and break RAC collection detection.
                <Tag
                  id={item.value}
                  textValue={item.display}
                  className="mc-tag"
                  style={
                    {
                      '--pill-bg': theme.color[pill.bg],
                      '--pill-text': theme.color[pill.text],
                    } as React.CSSProperties
                  }
                >
                  <PillLabel>{item.display}</PillLabel>
                  <RemoveButton
                    slot="remove"
                    aria-label={`Remove ${item.display}`}
                    isDisabled={disabled}
                  >
                    ×
                  </RemoveButton>
                </Tag>
              );
            }}
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
          // OUR allowCustomValue is modelled via keyboard/paste/blur commit below; RAC's
          // own flag stays off so selection always flows through onSelectionChange.
          allowsCustomValue={false}
          // Open on focus so the recent/suggested options show on click or tab-in. With
          // no allowsEmptyCollection, RAC auto-closes the popover when the query matches
          // nothing — so free text never sits under an open dropdown. After a commit
          // clears the input, RAC reopens it with the remaining options.
          menuTrigger="focus"
          isDisabled={disabled}
        >
          <StyledInput
            placeholder={placeholder}
            aria-invalid={hasError}
            onFocus={() => setIsFocused(true)}
            onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
              // Backspace on an empty input removes the most recently added tag.
              if (event.key === 'Backspace' && inputValue === '' && value.length > 0) {
                event.preventDefault();
                onChange(value.slice(0, -1));
                return;
              }
              // A configured separator (e.g. "," or space) commits the typed value as a
              // pill instead of being entered as a character.
              if (separatorEnabled && separatorKeys.has(event.key)) {
                event.preventDefault();
                commitInput();
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
              commitInput();
            }}
            onPaste={handlePaste}
            onBlur={() => {
              setIsFocused(false);
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
                  <HighlightMatch text={item.label} query={inputValue} />
                  {onDeleteItem ? (
                    <DeleteContactButton
                      type="button"
                      className="mc-delete"
                      aria-label={deleteItemLabel}
                      title={deleteItemLabel}
                      disabled={disabled}
                      // Stamp the row key so handleSelectionChange drops the press-up
                      // selection RAC fires for THIS row. Don't delete yet: deleting here
                      // would reflow the list mid-gesture and slide the next row under the
                      // pointer, so RAC's press-up would select THAT row instead.
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        event.preventDefault();
                        suppressSelectKeyRef.current = item.id;
                      }}
                      // Delete on pointer-UP, deferred a microtask so it runs AFTER RAC has
                      // resolved (and we've suppressed) the press-up selection — the row
                      // under the pointer stays this item the whole gesture, so no neighbour
                      // gets selected. (Mouse/touch path; keyboard is handled in onClick.)
                      onPointerUp={(event) => {
                        event.stopPropagation();
                        event.preventDefault();
                        if (disabled) {
                          return;
                        }
                        const { id } = item;
                        queueMicrotask(() => onDeleteItem(id));
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        event.preventDefault();
                        // Keyboard activation (Enter/Space) arrives as a click with
                        // detail 0 and no preceding pointer events — delete here for
                        // keyboard users. Mouse clicks (detail >= 1) are already handled
                        // by onPointerUp; just neutralise them.
                        if (!disabled && event.detail === 0) {
                          onDeleteItem(item.id);
                        }
                      }}
                    >
                      <Trash2 size={14} strokeWidth={2} aria-hidden />
                    </DeleteContactButton>
                  ) : null}
                </ListBoxItem>
              )}
            </StyledListBox>
          </StyledPopover>
        </ContentsComboBox>
      </FieldBox>
      {/*
        The popover renders directly below the field, over this error line. Only show the
        error when the suggestion dropdown isn't covering it — when nothing matches, RAC
        closes the dropdown and the error becomes visible.
      */}
      {displayError && !suggestionsOpen ? <ErrorMessage>{displayError}</ErrorMessage> : null}
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
    background: var(--pill-bg);
    color: var(--pill-text);
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

// Native <button> (not RAC Button) so onPointerDown/onClick are plain DOM handlers we
// can stopPropagation on — that's what keeps the trash from triggering row selection.
// Visuals mirror the pill RemoveButton; hover turns it destructive (formError).
const DeleteContactButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: ${({ theme }) => theme.spacing(2.5)};
  height: ${({ theme }) => theme.spacing(2.5)};
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: ${({ theme }) => theme.color.bodyTextMuted};
  cursor: pointer;
  line-height: 1;

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.08);
    color: ${({ theme }) => theme.color.formError};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.inputBorderFocus};
    outline-offset: 1px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
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

  /* Keep the invalid text visibly red until the user edits it (clears the error). */
  &[aria-invalid='true'] {
    color: ${({ theme }) => theme.color.formError};
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
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${({ theme }) => theme.spacing(1)};
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

  /*
    Delete affordance visibility — mirrors the hover-vs-touch precedent used across the
    app (MediaGridSelectionToggle, CommentActions). Hover devices reveal it on row
    hover or keyboard (virtual) focus; touch devices, which have no hover, show it
    always. Base rule keeps it visible for any device matching neither query.
  */
  .mc-delete {
    opacity: 1;
  }

  @media (hover: hover) {
    .mc-delete {
      opacity: 0;
      pointer-events: none;
      transition: opacity 150ms ease;
    }

    .mc-item:hover .mc-delete,
    .mc-item[data-focused] .mc-delete {
      opacity: 1;
      pointer-events: auto;
    }
  }

  @media (hover: none) and (pointer: coarse) {
    .mc-delete {
      opacity: 1;
      pointer-events: auto;
    }
  }
` as typeof ListBox;

const Empty = styled.div`
  padding: ${({ theme }) => theme.spacing(1.25)} ${({ theme }) => theme.spacing(1.5)};
  color: ${({ theme }) => theme.color.bodyTextMuted};
  font-size: ${({ theme }) => theme.fontSize._14};
`;

// The typed-substring emphasis inside each suggestion (clay accent, via link token).
const Match = styled.span`
  font-weight: ${({ theme }) => theme.weight.medium};
  color: ${({ theme }) => theme.color.link};
  background-color: ${({ theme }) => theme.color.yellow_lighter};
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.color.formError};
  font-size: ${({ theme }) => theme.fontSize._12};
`;

export type { MultiComboboxProps };
