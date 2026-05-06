import { type ShareContactType } from '../../graphql/generated/types';
import { Combobox } from '../../ui/Combobox';

type ShareRecipientInputProps = {
  value: string;
  onChange: (value: string) => void;
  suggestions: ShareContactType[];
  disabled?: boolean;
  error?: string;
};

export const ShareRecipientInput = ({
  value,
  onChange,
  suggestions,
  disabled,
  error,
}: ShareRecipientInputProps) => {
  const selectedSuggestion =
    suggestions.find(
      (suggestion) => suggestion.handle.toLowerCase() === value.trim().toLowerCase(),
    ) ?? null;

  const handleChange = (next: ShareContactType | { customValue: string }): void => {
    if ('customValue' in next) {
      onChange(next.customValue);
      return;
    }
    onChange(next.handle);
  };

  return (
    <Combobox
      items={suggestions}
      value={selectedSuggestion}
      onChange={handleChange}
      getKey={(suggestion) => suggestion.userId}
      getLabel={(suggestion) => suggestion.handle}
      allowCustomValue
      label="Recipient"
      placeholder="user@example.com or @handle"
      disabled={disabled}
      error={error}
    />
  );
};
