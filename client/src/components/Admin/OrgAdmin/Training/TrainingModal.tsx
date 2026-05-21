import React, { FC, useEffect, useRef, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { cn } from '~/utils';
import TrainingForm from '~/components/Admin/OrgAdmin/Training/TrainingForm';
import { useLocalize, useSmaLocalize } from '~/hooks';
import { Training } from 'librechat-data-provider';
import UserMultiSelect from '~/components/ui/UserMultiSelect';
import GenericList from '~/components/ui/GenericList';
import { ClipboardCopy, MonitorCheck, MonitorX } from 'lucide-react';
import { useToastContext } from '@librechat/client';

type Trainee = {
  username: string;
  password: string;
  hasLoggedIn: boolean;
};

interface TrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  training?: Training;
  organizationTrainers?: { email: string }[];
  disabled?: boolean;
}

const TrainingModal: FC<TrainingModalProps> = ({
  isOpen,
  onClose,
  organizationId,
  training,
  organizationTrainers = [],
  disabled = false,
}) => {
  const { showToast } = useToastContext();
  const smaLocalize = useSmaLocalize();
  const localize = useLocalize();
  const isEditing = !!training;
  const [trainers, setTrainers] = useState<{ email: string }[]>([]);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (training && training.trainers) {
      const trainerEmails = training.trainers.map((email) => ({ email }));
      setTrainers(trainerEmails);
    } else {
      setTrainers([]);
    }
    if (training && training.trainees) {
      setTrainees(training.trainees);
    } else {
      setTrainees([]);
    }
  }, [training]);

  const copyToClipboard = async (trainees: Trainee[]) => {
    const textToCopy = trainees
      .map((trainee) => `User: ${trainee.username}\nPassword: ${trainee.password}`)
      .join('\n\n');
    try {
      await navigator.clipboard.writeText(textToCopy);
      showToast({
        message: smaLocalize('com_orgadmin_copy_success'),
        status: 'success',
      });
    } catch (err) {
      showToast({
        message: `${smaLocalize('com_orgadmin_copy_error')}: ${err.response.data.message}`,
        status: 'error',
      });
    }
  };

  const renderTrainee = (trainee: Trainee) => {
    const LoginIcon = () =>
      trainee.hasLoggedIn ? (
        <MonitorCheck size={24} color="green">
          <title>{smaLocalize('com_orgadmin_trainee_hasLoggedIn')}</title>
        </MonitorCheck>
      ) : (
        <MonitorX size={24} color="grey">
          <title>{smaLocalize('com_orgadmin_trainee_notLoggedIn')}</title>
        </MonitorX>
      );
    return (
      <div className="flex items-center gap-3 text-sm text-text-primary">
        <LoginIcon />
        {trainee.username}
      </div>
    );
  };

  return (
    <Transition appear show={isOpen}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black opacity-50 dark:opacity-80" aria-hidden="true" />
        </TransitionChild>

        <TransitionChild
          enter="ease-out duration-200"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <div className={cn('fixed inset-0 flex w-screen items-center justify-center p-4')}>
            <DialogPanel
              className={cn(
                'flex max-h-full min-h-[600px] flex-col overflow-hidden rounded-xl rounded-b-lg bg-background shadow-2xl backdrop-blur-2xl animate-in sm:rounded-2xl md:min-h-[373px] md:w-[900px]',
              )}
            >
              <DialogTitle
                className="mb-1 flex items-center justify-between p-6 pb-5 text-left"
                as="div"
              >
                <h2 className="text-lg font-medium leading-6 text-text-primary">
                  {isEditing
                    ? smaLocalize('com_orgadmin_edit_training')
                    : smaLocalize('com_orgadmin_create_training')}
                </h2>
                <button
                  type="button"
                  className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-border-xheavy focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-surface-primary dark:focus:ring-offset-surface-primary"
                  onClick={onClose}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-text-primary"
                  >
                    <line x1="18" x2="6" y1="6" y2="18"></line>
                    <line x1="6" x2="18" y1="6" y2="18"></line>
                  </svg>
                  <span className="sr-only">{localize('com_ui_close')}</span>
                </button>
              </DialogTitle>

              <div className="flex flex-1 overflow-hidden">
                <div className="w-1/2 overflow-auto border-r border-border-light p-6">
                  <TrainingForm
                    onSubmit={onClose}
                    organizationId={organizationId}
                    setIsSubmitting={setIsSubmitting}
                    training={training}
                    trainers={trainers.map((t) => t.email)}
                    formRef={formRef}
                    disabled={disabled}
                  />
                </div>

                <div className="w-1/2 overflow-auto p-6">
                  <UserMultiSelect
                    title={smaLocalize('com_orgadmin_trainers')}
                    disabled={disabled}
                    users={organizationTrainers}
                    selectedUsers={trainers.map((t) => t.email)}
                    onSelectedUsersChange={(selectedEmails) => {
                      const newTrainers = selectedEmails.map((email) => ({ email }));
                      setTrainers(newTrainers);
                    }}
                    maxEntries={2}
                  />
                  <br />
                  <GenericList
                    title={smaLocalize('com_orgadmin_participants_title')}
                    titleButton={(trainees) => (
                      <button
                        onClick={() => copyToClipboard(trainees)}
                        className="rounded-full p-1 hover:bg-surface-secondary"
                        aria-label={smaLocalize('com_orgadmin_copy')}
                      >
                        <ClipboardCopy size={16} className="text-text-primary" />
                      </button>
                    )}
                    items={trainees}
                    getKey={(trainee) => trainee.username}
                    renderItem={renderTrainee}
                    extraButtons={(trainee) => [
                      <button
                        key={`copy-${trainee.username}`}
                        onClick={() => copyToClipboard([trainee])}
                        className="rounded-full p-1 hover:bg-surface-secondary"
                        aria-label={smaLocalize('com_orgadmin_copy')}
                      >
                        <ClipboardCopy size={16} className="text-text-primary" />
                      </button>,
                    ]}
                    defaultText={smaLocalize('com_orgadmin_participants_description')}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 border-t border-border-light bg-surface-primary p-4">
                <button
                  className="btn btn-neutral border-token-border-light relative h-9 gap-1 rounded-lg px-4 font-medium"
                  type="button"
                  onClick={onClose}
                >
                  {localize('com_ui_cancel')}
                </button>
                <button
                  disabled={isSubmitting || disabled}
                  className="btn btn-primary focus:shadow-outline h-9 px-4 py-2 font-semibold text-white hover:bg-green-600 focus:border-green-500"
                  type="button"
                  onClick={() => {
                    if (formRef.current) {
                      formRef.current.dispatchEvent(
                        new Event('submit', { cancelable: true, bubbles: true }),
                      );
                    }
                  }}
                >
                  {isSubmitting
                    ? smaLocalize('com_ui_loading')
                    : isEditing
                      ? localize('com_ui_save')
                      : localize('com_ui_create')}
                </button>
              </div>
            </DialogPanel>
          </div>
        </TransitionChild>
      </Dialog>
    </Transition>
  );
};

export default TrainingModal;
