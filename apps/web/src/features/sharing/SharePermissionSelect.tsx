import { SharePermission } from '@packages/contracts';
import { Select } from '../../ui/Select';

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
  const options = SharePermission.items();

  return (
    <Select
      items={options}
      value={value}
      label="Permission"
      disabled={disabled}
      onChange={onChange}
      getKey={(item) => item.value}
      getLabel={(item) => item.display}
    />
  );
};
