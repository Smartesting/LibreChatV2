import React, { FC, useMemo, useState } from 'react';
import {
  useListTrainingOrganizationsQuery,
  useTrainingsByOrganizationQuery,
} from '~/data-provider/TrainingOrganizations/queries';
import { useDeleteTrainingOrganizationMutation } from '~/data-provider/TrainingOrganizations/mutations';
import useSmaLocalize from '~/hooks/useSmaLocalize';
import { AxiosError } from 'axios';
import { NotificationSeverity } from '~/common';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import type { TrainingOrganization } from 'librechat-data-provider';
import { TrainingStatus } from 'librechat-data-provider';
import GenericList from '~/components/ui/GenericList';
import OrgCreationModal from '~/components/Admin/SuperAdmin/OrgCreationModal';
import { Link } from 'react-router-dom';
import { useToastContext } from '@librechat/client';

const OrgList: FC = () => {
  const smaLocalize = useSmaLocalize();
  const { data: trainingOrganizations = [] } = useListTrainingOrganizationsQuery();
  const deleteTrainingOrganizationMutation = useDeleteTrainingOrganizationMutation();
  const [isOrgCreationModalOpened, setIsOrgCreationModalOpened] = useState(false);
  const [confirmDeleteOrg, setConfirmDeleteOrg] = useState<TrainingOrganization | null>(null);
  const { showToast } = useToastContext();

  const handleDeleteClick = (organization: TrainingOrganization) => {
    setConfirmDeleteOrg(organization);
  };

  const handleConfirmDelete = (id: string) => {
    deleteTrainingOrganizationMutation.mutate(id, {
      onError: (error) => {
        if (error instanceof AxiosError && error.response?.data?.error) {
          showToast({
            message: `${smaLocalize('com_superadmin_delete_organization_error')} ${error.response.data.error}`,
            severity: NotificationSeverity.ERROR,
            showIcon: true,
            duration: 5000,
          });
        }
      },
    });
  };

  return (
    <>
      <DeleteConfirmationModal
        isOpen={confirmDeleteOrg !== null}
        onClose={() => setConfirmDeleteOrg(null)}
        organization={confirmDeleteOrg}
        onConfirm={handleConfirmDelete}
      />
      <OrgCreationModal
        isOpen={isOrgCreationModalOpened}
        onClose={() => setIsOrgCreationModalOpened(false)}
      />
      <GenericList
        className="rounded-lg border border-border-light p-4"
        title={smaLocalize('com_superadmin_training_organizations')}
        items={trainingOrganizations}
        getKey={(org) => org._id}
        renderItem={(org) => <OrganizationItem organization={org} />}
        onAddButtonClick={() => setIsOrgCreationModalOpened(true)}
        handleRemoveItem={(org) => handleDeleteClick(org)}
      />
    </>
  );
};

const OrganizationItem: FC<{
  organization: TrainingOrganization;
}> = ({ organization }) => {
  const smaLocalize = useSmaLocalize();
  const { data: trainings = [] } = useTrainingsByOrganizationQuery(organization._id);

  const trainingCounts = useMemo(() => {
    const past = trainings.filter((training) => training.status === TrainingStatus.PAST).length;
    const inProgress = trainings.filter(
      (training) => training.status === TrainingStatus.IN_PROGRESS,
    ).length;
    const upcoming = trainings.filter(
      (training) => training.status === TrainingStatus.UPCOMING,
    ).length;

    return { past, inProgress, upcoming };
  }, [trainings]);

  return (
    <div className="flex items-baseline">
      <Link to={`/training-organizations/${organization._id}`} className="mr-2 hover:underline">
        {organization.name}
      </Link>
      <span className="mx-2">•</span>
      <span className="text-sm text-text-secondary">
        {smaLocalize('com_superadmin_past_trainings')} {trainingCounts.past}
      </span>
      <span className="mx-2">•</span>
      <span className="text-sm text-text-secondary">
        {smaLocalize('com_superadmin_upcoming_trainings')} {trainingCounts.upcoming}
      </span>
      {trainingCounts.inProgress > 0 && (
        <>
          <span className="mx-2">•</span>
          <span className="text-sm text-text-secondary">
            {smaLocalize('com_superadmin_in_progress_trainings')} {trainingCounts.inProgress}
          </span>
        </>
      )}
    </div>
  );
};

export default OrgList;
