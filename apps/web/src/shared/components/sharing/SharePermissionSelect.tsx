import React from 'react';
import type { SharePermissionValue } from '../../../application/sharing/useGrantShare';
import { FormInput } from '../../../ui/FormInput';

type SharePermissionSelectProps = {
  value: SharePermissionValue;
  onChange: (value: SharePermissionValue) => void;
  disabled?: boolean;
};

const PERMISSION_OPTIONS: { value: SharePermissionValue; label: string }[] = [
  { value: 'view', label: 'View' },
  { value: 'comment', label: 'Comment' },
  { value: 'download', label: 'Download' },
];

const isPermissionValue = (value: string): value is SharePermissionValue =>
  value === 'view' || value === 'comment' || value === 'download';

export const SharePermissionSelect = ({
  value,
  onChange,
  disabled,
}: SharePermissionSelectProps) => {
  return (
    <FormInput
      as="select"
      label="Permission"
      value={value}
      disabled={disabled}
      onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
        const next = event.target.value;
        if (isPermissionValue(next)) {
          onChange(next);
        }
      }}
    >
      {PERMISSION_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </FormInput>
  );
};
