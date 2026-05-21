import React, { FC, useState } from 'react';
import { useSmaLocalize } from '~/hooks';
import { ChevronDown, ChevronUp, Edit, Eye, Trash2, User } from 'lucide-react';
import TrainingDetails from './TrainingDetails';
import { Training, TrainingWithStatus } from 'librechat-data-provider';

const TrainingItem: FC<{
  training: TrainingWithStatus;
  setTrainingToEdit: (trainingToEdit: Training) => void;
  setIsTrainingModalOpen: (isOpen: boolean) => void;
  setTrainingToDelete: (trainingToDelete: string) => void;
  setIsEditDisabled: (isEditDisabled: boolean) => void;
  editable?: boolean;
  deletable?: boolean;
}> = ({
  training,
  setTrainingToEdit,
  setIsTrainingModalOpen,
  setTrainingToDelete,
  setIsEditDisabled,
  editable,
  deletable,
}) => {
  const smaLocalize = useSmaLocalize();
  const [expandedTrainingId, setExpandedTrainingId] = useState<string | null>(null);

  const toggleTrainingExpand = (trainingId: string) => {
    setExpandedTrainingId(expandedTrainingId === trainingId ? null : trainingId);
  };
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <li key={training._id} className="overflow-hidden rounded bg-surface-tertiary">
      <div
        className="flex cursor-pointer items-center justify-between p-3"
        onClick={() => toggleTrainingExpand(training._id)}
      >
        <div className="flex flex-1 items-center">
          <span className="mr-2 font-medium text-text-primary">{training.name}</span>
          <span className="mx-2">•</span>
          <span className="text-sm text-text-secondary">{training.participantCount}</span>
          <User size={14} className="mx-1 text-text-secondary" />
          <span className="mx-2">•</span>
          <span className="text-sm text-text-secondary">{formatDate(training.startDateTime)}</span>
        </div>

        <div className="flex items-center">
          <button
            className="mr-2 rounded-full p-1 hover:bg-surface-secondary"
            aria-label={smaLocalize('com_ui_details')}
            onClick={(e) => {
              e.stopPropagation();
              setTrainingToEdit(training);
              setIsEditDisabled(true);
              setIsTrainingModalOpen(true);
            }}
          >
            <Eye size={16} className="text-text-primary" />
          </button>
          {editable && (
            <button
              className="mr-1 rounded-full p-1 hover:bg-surface-secondary"
              aria-label={smaLocalize('com_ui_edit')}
              onClick={(e) => {
                e.stopPropagation();
                setTrainingToEdit(training);
                setIsTrainingModalOpen(true);
              }}
            >
              <Edit size={16} className="text-text-primary" />
            </button>
          )}
          {deletable && (
            <button
              className="mr-2 rounded-full p-1 hover:bg-surface-secondary"
              aria-label={smaLocalize('com_ui_delete')}
              onClick={(e) => {
                e.stopPropagation();
                setTrainingToDelete(training._id);
              }}
            >
              <Trash2 size={16} className="text-text-primary" />
            </button>
          )}
          {expandedTrainingId === training._id ? (
            <ChevronUp size={20} className="text-text-primary" />
          ) : (
            <ChevronDown size={20} className="text-text-primary" />
          )}
        </div>
      </div>
      <TrainingDetails training={training} expandedTrainingId={expandedTrainingId} />
    </li>
  );
};

export default TrainingItem;
