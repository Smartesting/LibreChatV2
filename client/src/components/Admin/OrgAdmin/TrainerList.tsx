import React, { FC, useMemo, useState } from 'react';
import { useSmaLocalize } from '~/hooks';
import {
  useAddTrainerMutation,
  useRemoveTrainerMutation,
} from '~/data-provider/TrainingOrganizations';
import GenericList from '~/components/ui/GenericList';
import { isValidEmail } from '~/utils';
import { AxiosError } from 'axios';
import ConfirmModal from '~/components/ui/ConfirmModal';
import { Invitation, User } from 'librechat-data-provider';
import { useToastContext } from '@librechat/client';

interface TrainersListProps {
  orgId: string;
  trainers: User[];
  trainerInvitations: Invitation[];
}

const TrainerList: FC<TrainersListProps> = ({ orgId, trainers, trainerInvitations = [] }) => {
  const smaLocalize = useSmaLocalize();
  const { showToast } = useToastContext();

  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [trainerToRevoke, setTrainerToRevoke] = useState<{ email: string; name: string } | null>(
    null,
  );

  // Combine existing trainers with invited trainers
  const allTrainers = useMemo(() => {
    const invitedTrainers = trainerInvitations.map((invitation) => ({
      email: invitation.email,
      name: smaLocalize('com_ui_invited'),
    }));

    return [...trainers, ...invitedTrainers];
  }, [trainerInvitations, trainers, smaLocalize]);

  const addTrainerMutation = useAddTrainerMutation({
    onSuccess: () => {
      showToast({
        message: smaLocalize('com_orgadmin_add_trainer_success'),
        status: 'success',
      });
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.data?.error) {
        showToast({
          message: `${smaLocalize('com_orgadmin_add_trainer_error')} ${error.response.data.error}`,
          status: 'error',
        });
      }
    },
  });

  const removeTrainerMutation = useRemoveTrainerMutation({
    onSuccess: () => {
      showToast({
        message: smaLocalize('com_orgadmin_revoke_trainer_success'),
        status: 'success',
      });
      setTrainerToRevoke(null);
      setIsRevokeModalOpen(false);
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.data?.error) {
        showToast({
          message: `${smaLocalize('com_orgadmin_revoke_trainer_error')} ${error.response.data.error}`,
          status: 'error',
        });
        setTrainerToRevoke(null);
        setIsRevokeModalOpen(false);
      }
    },
  });

  const handleAddTrainer = (email: string) => {
    if (!isValidEmail(email)) {
      showToast({
        message: smaLocalize('com_ui_error_email_invalid'),
        status: 'error',
      });
      return;
    }

    addTrainerMutation.mutate({ id: orgId, email: email.trim() });
  };

  const handleRemoveTrainer = (trainer: { email: string; name: string }) => {
    setTrainerToRevoke(trainer);
    setIsRevokeModalOpen(true);
  };

  const confirmRevokeTrainer = () => {
    if (!trainerToRevoke) {
      return;
    }
    removeTrainerMutation.mutate({ id: orgId, email: trainerToRevoke.email });
  };

  return (
    <>
      <ConfirmModal
        isOpen={isRevokeModalOpen}
        onConfirm={confirmRevokeTrainer}
        onClose={() => setIsRevokeModalOpen(false)}
        confirmTitle={smaLocalize('com_ui_confirm_trainer_revocation')}
        confirmDescription={smaLocalize('com_ui_trainer_revocation_message', {
          email: trainerToRevoke?.email || '',
          name: trainerToRevoke?.name || '',
        })}
        confirmButton={smaLocalize('com_ui_revoke')}
      />
      <GenericList
        className="rounded-lg border border-border-light p-4"
        title={smaLocalize('com_orgadmin_trainers')}
        items={allTrainers}
        getKey={(user) => user.email}
        renderItem={(item) => item.email + ` (${item.name})`}
        handleRemoveItem={handleRemoveTrainer}
        handleAddItem={handleAddTrainer}
        placeholder={smaLocalize('com_ui_trainer_email_placeholder')}
      />
    </>
  );
};

export default TrainerList;
