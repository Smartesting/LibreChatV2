import React, { FC, useCallback, useState } from 'react';
import { cn, defaultTextProps, removeFocusOutlines } from '~/utils';
import { Controller, FormProvider, useFieldArray, useForm } from 'react-hook-form';
import { useLocalize, useSmaLocalize } from '~/hooks';
import { NotificationSeverity, OrgForm } from '~/common';
import { defaultOrgFormValues } from 'librechat-data-provider';
import { Button } from '@librechat/client';
import { useCreateTrainingOrganizationMutation } from '~/data-provider/TrainingOrganizations';
import { Plus, X } from 'lucide-react';
import { AxiosError } from 'axios';
import { useToastContext } from '@librechat/client';

const labelClass = 'mb-2 text-token-text-primary block font-medium';
const inputClass = cn(
  defaultTextProps,
  'flex w-full px-3 py-2 border-border-light bg-surface-secondary focus-visible:ring-2 focus-visible:ring-ring-primary',
  removeFocusOutlines,
);

const OrgCreationForm: FC<{ onSubmit: () => void; onCancel: () => void }> = ({
  onSubmit,
  onCancel,
}) => {
  const smaLocalize = useSmaLocalize();
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const methods = useForm<OrgForm>({
    defaultValues: defaultOrgFormValues,
    mode: 'onChange',
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = methods;

  const { fields, append, prepend, remove } = useFieldArray({
    control,
    name: 'administrators' as never,
  });

  const create = useCreateTrainingOrganizationMutation();

  const onFormSubmit = useCallback(
    (data: OrgForm) => {
      const { name, administrators } = data;

      // Ensure name is not empty after trimming
      if (!name || !name.trim()) {
        return;
      }

      setIsSubmitting(true);
      create.mutate(
        {
          name: name.trim(),
          administrators,
        },
        {
          onSuccess: () => {
            setIsSubmitting(false);
            onSubmit();
          },
          onError: (error) => {
            setIsSubmitting(false);
            if (error instanceof AxiosError && error.response?.data?.error) {
              showToast({
                message: `${smaLocalize('com_superadmin_error_create_organization')} ${error.response.data.error}`,
                severity: NotificationSeverity.ERROR,
                showIcon: true,
                duration: 5000,
              });
            }
          },
        },
      );
    },
    [create, onSubmit, showToast, smaLocalize],
  );

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onFormSubmit)}
        className="scrollbar-gutter-stable h-auto w-full flex-shrink-0 overflow-x-hidden"
        aria-label="Agent configuration form"
      >
        <div className="flex max-h-[550px] flex-col overflow-auto px-6 md:max-h-[400px] md:min-h-[400px] md:w-[680px]">
          <div className="mb-4">
            <label className={labelClass} htmlFor="name">
              {smaLocalize('com_superadmin_organization_name')}
            </label>
            <Controller
              name="name"
              control={control}
              rules={{
                required: smaLocalize('com_superadmin_error_name_required'),
                validate: (value) =>
                  (value && value.trim().length > 0) ||
                  smaLocalize('com_superadmin_error_name_not_empty'),
              }}
              render={({ field }) => (
                <>
                  <input
                    {...field}
                    value={field.value ?? ''}
                    maxLength={512}
                    className={inputClass}
                    type="text"
                    placeholder={smaLocalize('com_superadmin_give_org_name')}
                    aria-label="Organization name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                  )}
                </>
              )}
            />
          </div>

          <div className="mb-4 flex-1">
            <div className="mb-2 flex items-center">
              <label className={labelClass}>{smaLocalize('com_superadmin_administrators')}</label>
              <button
                type="button"
                onClick={() => prepend('')}
                className="text-token-text-secondary mb-2 ml-2 flex h-6 w-6 items-center justify-center rounded-md border border-border-light bg-surface-secondary hover:bg-surface-tertiary"
                aria-label="Add administrator"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[200px] space-y-2 overflow-y-auto p-1">
              {fields.length === 0 && (
                <div className="text-token-text-secondary py-2 text-center">
                  {smaLocalize('com_superadmin_no_administrators')}
                </div>
              )}
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Controller
                    name={`administrators.${index}`}
                    control={control}
                    rules={{
                      required: smaLocalize('com_superadmin_error_email_required'),
                      pattern: {
                        value: /\S+@\S+\.\S+/,
                        message: smaLocalize('com_ui_error_email_invalid'),
                      },
                    }}
                    render={({ field }) => (
                      <>
                        <input
                          {...field}
                          className={inputClass}
                          type="email"
                          placeholder={smaLocalize('com_ui_admin_email_placeholder')}
                          aria-label="Administrator email"
                        />
                        {errors.administrators?.[index] && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.administrators[index]?.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-token-text-secondary flex h-9 w-9 items-center justify-center rounded-md border border-border-light bg-surface-secondary hover:bg-surface-tertiary"
                    aria-label="Remove administrator"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <Button
              size={'sm'}
              variant={'outline'}
              className="btn btn-neutral border-token-border-light relative h-9 w-full gap-1 rounded-lg font-medium"
              type="button"
              onClick={onCancel}
            >
              {localize('com_ui_cancel')}
            </Button>
            <button
              className="btn btn-primary focus:shadow-outline flex h-9 w-full items-center justify-center px-4 py-2 font-semibold text-white hover:bg-green-600 focus:border-green-500 disabled:opacity-50"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? localize('com_ui_loading') : localize('com_ui_create')}
            </button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

export default OrgCreationForm;
