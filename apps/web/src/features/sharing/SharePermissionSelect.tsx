import { SharePermission } from '@packages/contracts';
import React from 'react';
import { FormInput } from '../../ui/FormInput';

type SharePermissionSelectProps = {
  value: SharePermission;
  onChange: (value: SharePermission) => void;
  disabled?: boolean;
};

export const SharePermissionSelect = ({
  value,
  onChange,
  disabled,
}: SharePermissionSelectProps) => {
  return (
    <FormInput
      as="select"
      label="Permission"
      value={value.value}
      disabled={disabled}
      onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
        const next = event.target.value;
        onChange(SharePermission.fromValue(next));
      }}
    >
      {SharePermission.items().map((option) => (
        <option key={option.value} value={option.value}>
          {option.display}
        </option>
      ))}
    </FormInput>
  );
};
