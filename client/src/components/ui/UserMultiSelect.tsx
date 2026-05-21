import React, { FC, useEffect, useState } from 'react';
import { useSmaLocalize } from '../../hooks';
import { MultiSelect } from '@librechat/client';

interface UserMultiSelectProps {
  title: string;
  users: { email: string }[] | string[];
  selectedUsers: string[];
  onSelectedUsersChange: (users: string[]) => void;
  className?: string;
  maxEntries?: number;
  disabled?: boolean;
}

const UserMultiSelect: FC<UserMultiSelectProps> = ({
  title,
  users,
  selectedUsers,
  onSelectedUsersChange,
  className,
  maxEntries,
  disabled = false,
}) => {
  const smaLocalize = useSmaLocalize();
  const [selectedValues, setSelectedValues] = useState<string[]>(selectedUsers);

  useEffect(() => {
    setSelectedValues(selectedUsers);
  }, [selectedUsers]);

  const handleSelectedValuesChange = (values: string[]) => {
    if (maxEntries !== undefined && values.length > maxEntries) {
      const limitedValues = values.slice(0, maxEntries);
      setSelectedValues(limitedValues);
      onSelectedUsersChange(limitedValues);
    } else {
      setSelectedValues(values);
      onSelectedUsersChange(values);
    }
  };

  const userEmails = users.map((user) => (typeof user === 'string' ? user : user.email));

  return (
    <div className={className}>
      <h2 className="mb-2 text-lg font-semibold text-text-primary">{title}</h2>
      <MultiSelect
        items={userEmails}
        selectedValues={selectedValues}
        setSelectedValues={handleSelectedValuesChange}
        placeholder={smaLocalize('com_orgadmin_select_users')}
        selectedItemsText={smaLocalize('com_orgadmin_selected_users')}
        disabled={disabled}
        displayValues={true}
      />
    </div>
  );
};

export default UserMultiSelect;
