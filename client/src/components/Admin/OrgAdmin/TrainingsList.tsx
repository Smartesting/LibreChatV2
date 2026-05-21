import React, { FC, useState } from 'react';
import { Plus } from 'lucide-react';
import { SystemRoles, Training, TrainingWithStatus } from 'librechat-data-provider';
import { useAuthContext, useSmaLocalize } from '~/hooks';
import TrainingItem from '~/components/Admin/OrgAdmin/Training/TrainingItem';
import TrainingModal from '~/components/Admin/OrgAdmin/Training/TrainingModal';
import ConfirmModal from '~/components/ui/ConfirmModal';
import { useDeleteTrainingMutation } from '~/data-provider';
import { AxiosError } from 'axios';
import { useToastContext } from '@librechat/client';

type TrainingsListProps = {
  orgId: string;
  trainings: TrainingWithStatus[];
  isLoading: boolean;
  trainers: { email: string }[];
  type: 'upcoming' | 'past' | 'ongoing';
};

const TrainingsList: FC<TrainingsListProps> = ({ orgId, trainings, isLoading, trainers, type }) => {
  const smaLocalize = useSmaLocalize();
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [trainingToEdit, setTrainingToEdit] = useState<Training | null>(null);
  const [trainingToDelete, setTrainingToDelete] = useState<string | null>(null);
  const [isEditDisabled, setIsEditDisabled] = useState<boolean>(false);
  const { showToast } = useToastContext();
  const { user } = useAuthContext();
  const isSuperAdmin = user?.role.includes(SystemRoles.ADMIN);

  const isUpcoming = type === 'upcoming';
  const isEditable = isUpcoming || (isSuperAdmin && type === 'ongoing');
  let titleKey:
    | 'com_orgadmin_upcoming_trainings'
    | 'com_orgadmin_past_trainings'
    | 'com_orgadmin_ongoing_trainings';
  switch (type) {
    case 'upcoming':
      titleKey = 'com_orgadmin_upcoming_trainings';
      break;
    case 'past':
      titleKey = 'com_orgadmin_past_trainings';
      break;
    case 'ongoing':
      titleKey = 'com_orgadmin_ongoing_trainings';
      break;
  }

  const deleteTrainingMutation = useDeleteTrainingMutation({
    onSuccess: () => {
      showToast({
        message: smaLocalize('com_orgadmin_training_deleted'),
        status: 'success',
      });
      setTrainingToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting training:', error);
      showToast({
        message:
          error instanceof AxiosError && error.response?.data?.message
            ? error.response.data.error
            : smaLocalize('com_orgadmin_error_delete_training'),
        status: 'error',
      });
      setTrainingToDelete(null);
    },
  });

  const confirmDeleteTraining = () => {
    if (orgId && trainingToDelete) {
      deleteTrainingMutation.mutate({ organizationId: orgId, trainingId: trainingToDelete });
    }
  };

  return (
    <>
      <ConfirmModal
        isOpen={trainingToDelete !== null}
        onConfirm={confirmDeleteTraining}
        onClose={() => setTrainingToDelete(null)}
        confirmTitle={smaLocalize('com_orgadmin_confirm_delete_training')}
        confirmDescription={smaLocalize('com_orgadmin_delete_training_warning')}
        confirmButton={smaLocalize('com_ui_delete')}
      />
      <TrainingModal
        isOpen={isTrainingModalOpen}
        onClose={() => {
          setIsTrainingModalOpen(false);
          setTrainingToEdit(null);
          setIsEditDisabled(false);
        }}
        organizationId={orgId}
        training={trainingToEdit || undefined}
        organizationTrainers={trainers}
        disabled={isEditDisabled}
      />
      <div className="mb-6 rounded-lg border border-border-light p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">{smaLocalize(titleKey)}</h2>
          {isUpcoming && (
            <button
              className="rounded-full bg-surface-primary p-1 hover:bg-surface-secondary"
              aria-label={
                smaLocalize('com_ui_add') + ' ' + smaLocalize('com_orgadmin_upcoming_trainings')
              }
              onClick={() => setIsTrainingModalOpen(true)}
            >
              <Plus size={16} className="text-text-primary" />
            </button>
          )}
        </div>
        <ul className="space-y-2">
          {isLoading ? (
            <div className="p-4 text-center text-text-secondary">
              {smaLocalize('com_ui_loading')}
            </div>
          ) : trainings.length === 0 ? (
            <div className="p-4 text-center text-text-secondary">
              {smaLocalize('com_orgadmin_no_trainings')}
            </div>
          ) : (
            trainings.map((training) => (
              <TrainingItem
                key={training._id}
                training={training}
                editable={isEditable}
                deletable={isUpcoming || isSuperAdmin}
                setTrainingToEdit={setTrainingToEdit}
                setIsEditDisabled={setIsEditDisabled}
                setIsTrainingModalOpen={setIsTrainingModalOpen}
                setTrainingToDelete={setTrainingToDelete}
              />
            ))
          )}
        </ul>
      </div>
    </>
  );
};

export default TrainingsList;
