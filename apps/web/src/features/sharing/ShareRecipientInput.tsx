import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { type ShareContactType } from '../../graphql/generated/types';
import { FormInput } from '../../ui/FormInput';

type ShareRecipientInputProps = {
  value: string;
  onChange: (value: string) => void;
  suggestions: ShareContactType[];
  onSelectSuggestion: (suggestion: ShareContactType) => void;
  disabled?: boolean;
  error?: string;
};

const filterSuggestions = (suggestions: ShareContactType[], query: string): ShareContactType[] => {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return [];
  }
  return suggestions.filter((s) => s.handle.toLowerCase().includes(trimmed));
};

export const ShareRecipientInput = ({
  value,
  onChange,
  suggestions,
  onSelectSuggestion,
  disabled,
  error,
}: ShareRecipientInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const matches = useMemo(() => filterSuggestions(suggestions, value), [suggestions, value]);
  const showDropdown = isFocused && matches.length > 0;

  const handleSelect = (suggestion: ShareContactType) => {
    onSelectSuggestion(suggestion);
    setIsFocused(false);
  };

  return (
    <Wrapper>
      <FormInput
        label="Recipient"
        placeholder="user@example.com or @handle"
        value={value}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          // Defer so a click on a suggestion can register before we hide the dropdown.
          window.setTimeout(() => setIsFocused(false), 120);
        }}
        disabled={disabled}
        error={error}
        autoComplete="off"
      />
      {showDropdown && (
        <Dropdown role="listbox">
          {matches.map((suggestion) => (
            <DropdownItem
              key={suggestion.userId}
              type="button"
              role="option"
              aria-selected={false}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleSelect(suggestion)}
            >
              {suggestion.handle}
            </DropdownItem>
          ))}
        </Dropdown>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  position: relative;
  width: 100%;
`;

const Dropdown = styled.ul`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 10;
  margin: 0;
  padding: 0;
  list-style: none;
  background: ${({ theme }) => theme.color.bodyRaised};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.boxShadow.md};
  max-height: 200px;
  overflow-y: auto;
`;

const DropdownItem = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  background: transparent;
  color: ${({ theme }) => theme.color.bodyText};
  border: 0;
  padding: ${({ theme }) => theme.spacing(1.25)} ${({ theme }) => theme.spacing(1.5)};
  font: inherit;
  cursor: pointer;

  &:hover,
  &:focus {
    background: ${({ theme }) => theme.color.body};
    outline: none;
  }
`;
