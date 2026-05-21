import React, { FC, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { cn, defaultTextProps, removeFocusOutlines } from '~/utils';
import { useLocalize, useSmaLocalize } from '~/hooks';
import { Button } from '@librechat/client';
import type { TrainingOrganization } from 'librechat-data-provider';

const inputClass = cn(
  defaultTextProps,
  'flex w-full px-3 py-2 border-border-light bg-surface-secondary focus-visible:ring-2 focus-visible:ring-ring-primary',
  removeFocusOutlines,
);

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: TrainingOrganization | null;
  onConfirm: (id: string) => void;
}

const DeleteConfirmationModal: FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  organization,
  onConfirm,
}) => {
  const smaLocalize = useSmaLocalize();
  const localize = useLocalize();
  const [confirmName, setConfirmName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!organization) {
      return;
    }

    if (confirmName !== organization.name) {
      setError(smaLocalize('com_superadmin_delete_organization_name_mismatch'));
      return;
    }

    onConfirm(organization._id);
    setConfirmName('');
    setError(null);
    onClose();
  };

  const handleClose = () => {
    setConfirmName('');
    setError(null);
    onClose();
  };

  return (
    <Transition appear show={isOpen}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
                'overflow-hidden rounded-xl rounded-b-lg bg-background pb-6 shadow-2xl backdrop-blur-2xl animate-in sm:rounded-2xl md:w-[500px]',
              )}
            >
              <DialogTitle
                className="mb-1 flex items-center justify-between p-6 pb-5 text-left"
                as="div"
              >
                <h2 className="text-lg font-medium leading-6 text-text-primary">
                  {smaLocalize('com_superadmin_delete_organization_confirm')}
                </h2>
                <button
                  type="button"
                  className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-border-xheavy focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-surface-primary dark:focus:ring-offset-surface-primary"
                  onClick={handleClose}
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

              <div className="px-6">
                <p className="mb-4 text-text-primary">
                  {smaLocalize('com_superadmin_delete_organization_warning')}
                </p>

                <p className="mb-4 text-text-primary">
                  {smaLocalize('com_superadmin_delete_organization_type_name', {
                    name: organization?.name || '',
                  })}
                </p>

                <div className="mb-4">
                  <input
                    value={confirmName}
                    onChange={(e) => {
                      setConfirmName(e.target.value);
                      setError(null);
                    }}
                    className={inputClass}
                    type="text"
                    placeholder={smaLocalize('com_superadmin_delete_organization_name_placeholder')}
                    aria-label="Confirm organization name"
                  />
                  {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
                </div>

                <div className="flex gap-4">
                  <Button
                    size={'sm'}
                    variant={'outline'}
                    className="btn btn-neutral border-token-border-light relative h-9 w-full gap-1 rounded-lg font-medium"
                    type="button"
                    onClick={handleClose}
                  >
                    {localize('com_ui_cancel')}
                  </Button>
                  <button
                    className="btn btn-danger focus:shadow-outline flex h-9 w-full items-center justify-center bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 focus:border-red-500"
                    type="button"
                    onClick={handleConfirm}
                  >
                    {smaLocalize('com_superadmin_delete_organization_confirm_button')}
                  </button>
                </div>
              </div>
            </DialogPanel>
          </div>
        </TransitionChild>
      </Dialog>
    </Transition>
  );
};

export default DeleteConfirmationModal;
