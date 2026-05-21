import { FC } from 'react';
import { Navigate } from 'react-router-dom';
import { useListTrainingOrganizationsQuery } from '~/data-provider/TrainingOrganizations/queries';
import { useAuthContext, useSmaLocalize } from '~/hooks';
import { NotificationSeverity } from '~/common';
import { useToastContext } from '@librechat/client';
import TrainingOrganizationsView from '~/components/Admin/OrgAdmin/TrainingOrganizationsView';
import axios from 'axios';

const TrainingOrganizationsRoute: FC = () => {
  const { data: trainingOrganizations, isLoading, error } = useListTrainingOrganizationsQuery();
  const { isAuthenticated } = useAuthContext();
  const smaLocalize = useSmaLocalize();
  const { showToast } = useToastContext();

  if (!isAuthenticated || isLoading) {
    return null;
  }

  if (error) {
    showToast({
      message: `${smaLocalize('com_orgadmin_error_loading_organizations')} ${axios.isAxiosError(error) ? error.response?.data?.error : error}`,
      severity: NotificationSeverity.ERROR,
      showIcon: true,
      duration: 5000,
    });

    return <Navigate to="/" replace />;
  }

  return <TrainingOrganizationsView trainingOrganizations={trainingOrganizations!} />;
};

export default TrainingOrganizationsRoute;
