import React, { FC, useMemo, useState } from 'react';
import useSmaLocalize from '../../../hooks/useSmaLocalize';
import GenericList from '~/components/ui/GenericList';
import { useToastContext } from '@librechat/client';
import {
  useGetAdminInvitationsQuery,
  useGetAdminUsersQuery,
  useGrantAdminAccessMutation,
  useRevokeAdminAccessMutation,
} from '~/data-provider';
import { AxiosError } from 'axios';
import { isValidEmail } from '~/utils';
import ConfirmModal from '~/components/ui/ConfirmModal';

const AdminList: FC = () => {
  const { data: adminUsers = [] } = useGetAdminUsersQuery();
  const { data: adminInvitations = [] } = useGetAdminInvitationsQuery();
  const smaLocalize = useSmaLocalize();
  const { showToast } = useToastContext();

  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [adminToRevoke, setAdminToRevoke] = useState<{ email: string; name: string } | null>(null);

  const existingAndInvitedAdmins = useMemo(() => {
    const invitedUsers = adminInvitations.map((invitation) => ({
      email: invitation.email,
      name: smaLocalize('com_ui_invited'),
    }));

    return [...adminUsers, ...invitedUsers];
  }, [adminUsers, adminInvitations, smaLocalize]);

  const grantAdminAccessMutation = useGrantAdminAccessMutation({
    onSuccess: () => {
      showToast({
        message: smaLocalize('com_ui_add_admin_success'),
        status: 'success',
      });
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.data?.message) {
        showToast({
          message: `${smaLocalize('com_ui_add_admin_error')} ${error.response.data.message}`,
          status: 'error',
        });
      }
    },
  });

  const revokeAdminAccessMutation = useRevokeAdminAccessMutation({
    onSuccess: () => {
      showToast({
        message: smaLocalize('com_ui_revoke_admin_success'),
        status: 'success',
      });
      setAdminToRevoke(null);
      setIsRevokeModalOpen(false);
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.data?.message) {
        showToast({
          message: `${smaLocalize('com_ui_revoke_admin_error')} ${error.response.data.message}`,
          status: 'error',
        });
        setAdminToRevoke(null);
        setIsRevokeModalOpen(false);
      }
    },
  });

  const handleAddAdmin = (email: string) => {
    if (!isValidEmail(email)) {
      showToast({
        message: smaLocalize('com_ui_error_email_invalid'),
        status: 'error',
      });
      return;
    }

    grantAdminAccessMutation.mutate({ email: email.trim() });
  };

  const handleRevokeAdmin = (admin: { email: string; name: string }) => {
    setAdminToRevoke(admin);
    setIsRevokeModalOpen(true);
  };

  const confirmRevokeAdmin = () => {
    if (!adminToRevoke) {
      return;
    }
    revokeAdminAccessMutation.mutate({ email: adminToRevoke.email });
  };

  return (
    <>
      <ConfirmModal
        isOpen={isRevokeModalOpen}
        onConfirm={confirmRevokeAdmin}
        onClose={() => setIsRevokeModalOpen(false)}
        confirmTitle={smaLocalize('com_ui_confirm_admin_revocation')}
        confirmDescription={smaLocalize('com_ui_admin_revocation_message', {
          email: adminToRevoke?.email || '',
          name: adminToRevoke?.name || '',
        })}
        confirmButton={smaLocalize('com_ui_revoke')}
      />
      <GenericList
        className="rounded-lg border border-border-light p-4"
        title={smaLocalize('com_superadmin_administrators')}
        items={existingAndInvitedAdmins}
        getKey={(item) => item.email}
        renderItem={(item) => `${item.email} (${item.name})`}
        handleAddItem={handleAddAdmin}
        handleRemoveItem={handleRevokeAdmin}
        placeholder={smaLocalize('com_ui_admin_email_placeholder')}
      />
    </>
  );
};

export default AdminList;
