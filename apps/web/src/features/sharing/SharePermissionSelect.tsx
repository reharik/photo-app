import { Operation } from '@packages/contracts';
import { Select } from '../../ui/Select';

type SharePermissionSelectProps = {
  value: Operation;
  onChange: (value: Operation) => void;
  disabled?: boolean;
};

export const SharePermissionSelect = ({
  value,
  onChange,
  disabled,
}: SharePermissionSelectProps) => {
  const options = Operation.items();

  return (
    <Select
      items={options}
      value={value}
      label="Operation"
      disabled={disabled}
      onChange={onChange}
      getKey={(item) => item.value}
      getLabel={(item) => item.display}
    />
  );
};
