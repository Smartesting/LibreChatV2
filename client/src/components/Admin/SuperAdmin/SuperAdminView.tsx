import React, { FC } from 'react';
import OrgList from '~/components/Admin/SuperAdmin/OrgList';
import UtilityButtons from '~/components/Admin/UtilityButtons';
import AdminList from '~/components/Admin/SuperAdmin/AdminList';
import UserList from '~/components/Admin/SuperAdmin/UserList';
import { useSmaLocalize } from '~/hooks';

const SuperAdminView: FC = () => {
  const smaLocalize = useSmaLocalize();

  return (
    <div className="p-6">
      <UtilityButtons />
      <div className="mb-6 flex items-center">
        <h1 className="text-2xl font-bold text-text-primary">
          {smaLocalize('com_superadmin_admin_panel')}
        </h1>
      </div>
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="md:w-1/3">
          <AdminList />
        </div>
        <div className="md:w-2/3">
          <OrgList />
        </div>
      </div>
      <div className="mt-6">
        <UserList />
      </div>
    </div>
  );
};

export default SuperAdminView;
