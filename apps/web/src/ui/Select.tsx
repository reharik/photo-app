import * as RadixSelect from '@radix-ui/react-select';
import React from 'react';
import styled from 'styled-components';

type SelectProps<T> = {
  items: readonly T[];
  value: T | null;
  onChange: (value: T) => void;
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  error?: string;
};

export const Select = <T,>({
  items,
  value,
  onChange,
  getKey,
  getLabel,
  placeholder,
  disabled,
  label,
  error,
}: SelectProps<T>): React.ReactElement => {
  const selectedKey = value ? getKey(value) : '';
  const hasError = Boolean(error);

  const itemByKey = React.useMemo(() => {
    return new Map(items.map((item) => [getKey(item), item]));
  }, [getKey, items]);

  const handleValueChange = (nextKey: string): void => {
    const nextItem = itemByKey.get(nextKey);
    if (!nextItem) {
      return;
    }
    onChange(nextItem);
  };

  const triggerId = React.useId();

  return (
    <FieldWrapper>
      {label ? <LabelWrapper htmlFor={triggerId}>{label}</LabelWrapper> : null}
      <RadixSelect.Root value={selectedKey} onValueChange={handleValueChange} disabled={disabled}>
        <RadixSelect.Trigger id={triggerId} asChild aria-invalid={hasError}>
          <TriggerButton type="button" $hasError={hasError}>
            <RadixSelect.Value placeholder={placeholder} />
            <RadixSelect.Icon>
              <Chevron aria-hidden="true">▾</Chevron>
            </RadixSelect.Icon>
          </TriggerButton>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content position="popper" sideOffset={4} asChild>
            <Content>
              <RadixSelect.Viewport>
                {items.map((item) => {
                  const key = getKey(item);
                  return (
                    <RadixSelect.Item key={key} value={key} asChild>
                      <ItemRow>
                        <RadixSelect.ItemText>{getLabel(item)}</RadixSelect.ItemText>
                      </ItemRow>
                    </RadixSelect.Item>
                  );
                })}
              </RadixSelect.Viewport>
            </Content>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
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

const TriggerButton = styled.button<{ $hasError: boolean }>`
  width: 100%;
  box-sizing: border-box;
  padding: ${({ theme }) => theme.spacing(1.25)} ${({ theme }) => theme.spacing(1.5)};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border: 1px solid
    ${({ theme, $hasError }) => ($hasError ? theme.color.formError : theme.color.inputBorder)};
  background: ${({ theme }) => theme.color.inputBg};
  color: ${({ theme }) => theme.color.inputText};
  font-size: ${({ theme }) => theme.fontSize._14};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1)};
  outline: none;

  &[data-placeholder] {
    color: ${({ theme }) => theme.color.inputPlaceholder};
  }

  &:focus-visible {
    border-color: ${({ theme, $hasError }) =>
      $hasError ? theme.color.formError : theme.color.inputBorderFocus};
    box-shadow: 0 0 0 3px
      ${({ theme, $hasError }) =>
        $hasError ? `${theme.color.formError}26` : `${theme.color.inputBorderFocus}26`};
  }

  &:disabled {
    background: ${({ theme }) => theme.color.inputDisabledBg};
    color: ${({ theme }) => theme.color.inputDisabledText};
    cursor: not-allowed;
  }
`;

const Chevron = styled.span`
  color: ${({ theme }) => theme.color.bodyTextSecondary};
`;

const Content = styled.div`
  overflow: hidden;
  background: ${({ theme }) => theme.color.bodyRaised};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.boxShadow.md};
  min-width: var(--radix-select-trigger-width);
  max-height: ${({ theme }) => theme.spacing(32)};
  z-index: 1000;
`;

const ItemRow = styled.div`
  padding: ${({ theme }) => theme.spacing(1.25)} ${({ theme }) => theme.spacing(1.5)};
  color: ${({ theme }) => theme.color.bodyText};
  font-size: ${({ theme }) => theme.fontSize._14};
  cursor: pointer;
  outline: none;

  &[data-highlighted] {
    background: ${({ theme }) => theme.color.bodyElevated};
  }

  &[data-state='checked'] {
    background: ${({ theme }) => theme.color.selectionBg};
    color: ${({ theme }) => theme.color.selectionText};
  }
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.color.formError};
  font-size: ${({ theme }) => theme.fontSize._12};
`;

export type { SelectProps };
