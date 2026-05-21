import { FC } from 'react';
import { useSmaLocalize } from '~/hooks';
import TrainingOrganizationView from './TrainingOrganizationView';
import UtilityButtons from '../UtilityButtons';
import { TrainingOrganization } from 'librechat-data-provider';

const TrainingOrganizationsView: FC<{
  trainingOrganizations: ReadonlyArray<TrainingOrganization>;
}> = ({ trainingOrganizations }) => {
  const smaLocalize = useSmaLocalize();
  return trainingOrganizations.length === 0 ? (
    <div className="relative p-6">
      <UtilityButtons />
      <h1 className="mb-4 text-2xl font-bold text-text-primary">
        {smaLocalize('com_orgadmin_no_organizations')}
      </h1>
    </div>
  ) : (
    <div className="relative">
      <UtilityButtons />
      <ul className="space-y-2">
        {trainingOrganizations.map((organization) => (
          <li key={organization._id} className="text-text-primary">
            <TrainingOrganizationView trainingOrganization={organization} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TrainingOrganizationsView;
