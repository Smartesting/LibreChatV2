import React, { FC, useMemo, useState } from 'react';
import { useSmaLocalize } from '~/hooks';
import {
  useAddAdministratorMutation,
  useRemoveAdministratorMutation,
} from '~/data-provider/TrainingOrganizations';
import GenericList from '~/components/ui/GenericList';
import { isValidEmail } from '~/utils';
import { AxiosError } from 'axios';
import ConfirmModal from '~/components/ui/ConfirmModal';
import { useToastContext } from '@librechat/client';
import { Invitation, User } from 'librechat-data-provider';

const OrgAdminList: FC<{
  orgId: string;
  orgAdmins: User[];
  adminInvitations: Invitation[];
}> = ({ orgId, orgAdmins, adminInvitations = [] }) => {
  const smaLocalize = useSmaLocalize();
  const { showToast } = useToastContext();

  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [adminToRevoke, setAdminToRevoke] = useState<{ email: string; name: string } | null>(null);

  // Combine existing admins with invited admins
  const allAdmins = useMemo(() => {
    const invitedAdmins = adminInvitations.map((invitation) => ({
      email: invitation.email,
      name: smaLocalize('com_ui_invited'),
    }));

    return [...orgAdmins, ...invitedAdmins];
  }, [adminInvitations, orgAdmins, smaLocalize]);

  const addAdminMutation = useAddAdministratorMutation({
    onSuccess: () => {
      showToast({
        message: smaLocalize('com_ui_add_admin_success'),
        status: 'success',
      });
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.data?.error) {
        showToast({
          message: `${smaLocalize('com_ui_add_admin_error')} ${error.response.data.error}`,
          status: 'error',
        });
      }
    },
  });

  const removeAdminMutation = useRemoveAdministratorMutation({
    onSuccess: () => {
      showToast({
        message: smaLocalize('com_ui_revoke_admin_success'),
        status: 'success',
      });
      setAdminToRevoke(null);
      setIsRevokeModalOpen(false);
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.data?.error) {
        showToast({
          message: `${smaLocalize('com_ui_revoke_admin_error')} ${error.response.data.error}`,
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

    addAdminMutation.mutate({ id: orgId, email: email.trim() });
  };

  const handleRemoveAdmin = (admin: { email: string; name: string }) => {
    setAdminToRevoke(admin);
    setIsRevokeModalOpen(true);
  };

  const confirmRevokeAdmin = () => {
    if (!adminToRevoke) {
      return;
    }
    removeAdminMutation.mutate({ id: orgId, email: adminToRevoke.email });
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
        className="mb-6 rounded-lg border border-border-light p-4"
        title={smaLocalize('com_orgadmin_administrators')}
        items={allAdmins}
        getKey={(user) => user.email}
        renderItem={(item) => item.email + ` (${item.name})`}
        handleRemoveItem={handleRemoveAdmin}
        handleAddItem={handleAddAdmin}
        placeholder={smaLocalize('com_ui_admin_email_placeholder')}
      />
    </>
  );
};

export default OrgAdminList;
