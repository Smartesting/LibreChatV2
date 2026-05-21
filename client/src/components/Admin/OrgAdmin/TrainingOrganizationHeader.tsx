import React, { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useSmaLocalize } from '~/hooks';

const TrainingOrganizationHeader: FC<{
  organizationName: string;
  showBackButton?: boolean;
}> = ({ organizationName, showBackButton }) => {
  const smaLocalize = useSmaLocalize();
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="mb-6 flex items-center">
      {showBackButton && (
        <button
          onClick={handleGoBack}
          className="mr-4 flex items-center rounded-lg border border-border-light p-2 text-sm text-text-primary hover:bg-surface-tertiary"
          aria-label={smaLocalize('com_ui_back')}
        >
          <ArrowLeft className="mr-1 text-text-primary" size={16} />
          {smaLocalize('com_ui_back')}
        </button>
      )}
      <h1 className="text-2xl font-bold text-text-primary">{organizationName}</h1>
    </div>
  );
};

export default TrainingOrganizationHeader;
