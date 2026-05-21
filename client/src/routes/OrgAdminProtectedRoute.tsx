import { Navigate, Outlet } from 'react-router-dom';
import { SystemRoles } from 'librechat-data-provider';
import { useAuthContext } from '~/hooks/AuthContext';
import { useIsActiveTrainerQuery } from '~/data-provider/TrainingOrganizations/queries';

/**
 * A route wrapper that redirects ORGADMIN users with no ongoing trainings
 * to /training-organizations if they try to access any other route
 */
const OrgAdminProtectedRoute = () => {
  const { user } = useAuthContext();
  const { data: trainerData, isLoading } = useIsActiveTrainerQuery();

  if (isLoading) {
    return null;
  }

  const isSuperAdmin = user?.role.includes(SystemRoles.ADMIN);
  const isOrgAdmin = user?.role.includes(SystemRoles.ORGADMIN);
  const isTrainerWithOngoingTraining =
    user?.role.includes(SystemRoles.TRAINER) && trainerData?.isActiveTrainer;

  if (isOrgAdmin && !isSuperAdmin && !isTrainerWithOngoingTraining) {
    return <Navigate to="/training-organizations" replace />;
  }

  return <Outlet />;
};

export default OrgAdminProtectedRoute;
