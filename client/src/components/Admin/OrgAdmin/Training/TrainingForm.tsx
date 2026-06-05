import React, { FC, useCallback, useEffect, useState } from 'react';
import { cn, defaultTextProps, removeFocusOutlines } from '~/utils';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { useSmaLocalize } from '~/hooks';
import { NotificationSeverity } from '~/common';
import {
  useCreateTrainingMutation,
  useUpdateTrainingMutation,
} from '~/data-provider/TrainingOrganizations';
import { AxiosError } from 'axios';
import { Training, TrainingCreateParams } from 'librechat-data-provider';
import { formatDateToTimezoneLocalString, parseDatetimeLocalToDate } from './dateMethods';
import HoverCardSettings from '~/components/Nav/SettingsTabs/HoverCardSettings';
import { useToastContext } from '@librechat/client';

const labelClass = 'mb-2 text-token-text-primary block font-medium';
const inputClass = cn(
  defaultTextProps,
  'flex w-full px-3 py-2 border-border-light bg-surface-secondary focus-visible:ring-2 focus-visible:ring-ring-primary',
  removeFocusOutlines,
);

type TrainingFormValues = Omit<TrainingCreateParams, 'startDateTime' | 'endDateTime'> & {
  startDateTime?: Date | undefined;
  endDateTime?: Date | undefined;
};

const defaultTrainingFormValues: TrainingFormValues = {
  name: 'ISTQB CT-GenAI',
  description: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Default to browser timezone
  startDateTime: undefined,
  endDateTime: undefined,
  participantCount: 1,
  trainers: [],
  trainees: [],
  trainingOrganizationId: '',
  location: '',
};

const TrainingForm: FC<{
  onSubmit: () => void;
  organizationId: string;
  setIsSubmitting: (isSubmitting: boolean) => void;
  training?: Training;
  trainers?: string[];
  formRef?: React.RefObject<HTMLFormElement>;
  disabled?: boolean;
}> = ({
  onSubmit,
  organizationId,
  setIsSubmitting,
  training,
  trainers,
  formRef,
  disabled = false,
}) => {
  const smaLocalize = useSmaLocalize();
  const { showToast } = useToastContext();
  const isEditing = !!training;
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [startDateValue, setStartDateValue] = useState('');
  const [endDateValue, setEndDateValue] = useState('');

  const methods = useForm<TrainingCreateParams>({
    defaultValues: {
      ...defaultTrainingFormValues,
      trainingOrganizationId: organizationId,
    },
    mode: 'onChange',
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = methods;

  useEffect(() => {
    if (training) {
      if (training.startDateTime) {
        setStartDateValue(
          formatDateToTimezoneLocalString(new Date(training.startDateTime), training.timezone),
        );
      }
      if (training.endDateTime) {
        setEndDateValue(
          formatDateToTimezoneLocalString(new Date(training.endDateTime), training.timezone),
        );
      }
      if (training.timezone) {
        setTimezone(training.timezone);
      }

      reset({
        name: training.name,
        description: training.description || '',
        timezone: training.timezone,
        startDateTime: new Date(training.startDateTime),
        endDateTime: new Date(training.endDateTime),
        participantCount: training.participantCount,
        trainers: trainers || training.trainers || [],
        trainingOrganizationId: training.trainingOrganizationId,
        location: training.location || '',
      });
    }
  }, [training, trainers, reset]);

  useEffect(() => {
    if (trainers) {
      methods.setValue('trainers', trainers);
    }
  }, [trainers, methods]);

  const createTraining = useCreateTrainingMutation();
  const updateTraining = useUpdateTrainingMutation();

  const onFormSubmit = useCallback(
    (data: TrainingCreateParams) => {
      if (!data.name || !data.name.trim()) {
        return;
      }

      const formattedData = {
        ...data,
        name: data.name.trim(),
        description: data.description?.trim(),
        location: data.location?.trim(),
      };

      setIsSubmitting(true);

      if (isEditing && training) {
        updateTraining.mutate(
          {
            organizationId: training.trainingOrganizationId,
            id: training._id,
            data: formattedData,
          },
          {
            onSuccess: () => {
              setIsSubmitting(false);
              showToast({
                message: smaLocalize('com_orgadmin_training_updated'),
                severity: NotificationSeverity.SUCCESS,
                showIcon: true,
                duration: 5000,
              });
              onSubmit();
            },
            onError: (error) => {
              setIsSubmitting(false);
              if (error instanceof AxiosError && error.response?.data?.error) {
                showToast({
                  message: `${smaLocalize('com_orgadmin_error_update_training')} ${error.response.data.error}`,
                  severity: NotificationSeverity.ERROR,
                  showIcon: true,
                  duration: 5000,
                });
              }
            },
          },
        );
      } else {
        createTraining.mutate(formattedData, {
          onSuccess: () => {
            setIsSubmitting(false);
            showToast({
              message: smaLocalize('com_orgadmin_training_created'),
              severity: NotificationSeverity.SUCCESS,
              showIcon: true,
              duration: 5000,
            });
            onSubmit();
          },
          onError: (error) => {
            setIsSubmitting(false);
            if (error instanceof AxiosError && error.response?.data?.error) {
              showToast({
                message: `${smaLocalize('com_orgadmin_error_create_training')} ${error.response.data.error}`,
                severity: NotificationSeverity.ERROR,
                showIcon: true,
                duration: 5000,
              });
            }
          },
        });
      }
    },
    [
      setIsSubmitting,
      isEditing,
      training,
      updateTraining,
      showToast,
      smaLocalize,
      onSubmit,
      createTraining,
    ],
  );

  return (
    <FormProvider {...methods}>
      <form
        ref={formRef}
        onSubmit={handleSubmit(onFormSubmit)}
        className="scrollbar-gutter-stable h-auto w-full flex-shrink-0 overflow-x-hidden"
        aria-label="Training creation form"
      >
        <div className="flex flex-col overflow-auto px-2">
          <div className="mb-4">
            <label className={labelClass} htmlFor="name">
              {smaLocalize('com_orgadmin_training_name')}
            </label>
            <Controller
              name="name"
              disabled={disabled}
              control={control}
              rules={{
                required: smaLocalize('com_orgadmin_error_name_required'),
                validate: (value) =>
                  (value && value.trim().length > 0) ||
                  smaLocalize('com_orgadmin_error_name_not_empty'),
              }}
              render={({ field }) => (
                <>
                  <input
                    {...field}
                    value={field.value ?? ''}
                    maxLength={512}
                    className={inputClass}
                    type="text"
                    placeholder={smaLocalize('com_orgadmin_training_name_placeholder')}
                    aria-label="Training name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                  )}
                </>
              )}
            />
          </div>

          <div className="mb-4">
            <label className={labelClass} htmlFor="description">
              {smaLocalize('com_orgadmin_description')}
            </label>
            <Controller
              name="description"
              disabled={disabled}
              control={control}
              render={({ field }) => (
                <>
                  <textarea
                    {...field}
                    value={field.value ?? ''}
                    className={cn(inputClass, 'min-h-[80px]')}
                    placeholder={smaLocalize('com_orgadmin_description_placeholder')}
                    aria-label="Training description"
                  />
                </>
              )}
            />
          </div>

          <div className="mb-4">
            <label className={labelClass} htmlFor="location">
              {smaLocalize('com_orgadmin_location')}
            </label>
            <Controller
              name="location"
              disabled={disabled}
              control={control}
              render={({ field }) => (
                <>
                  <input
                    {...field}
                    value={field.value ?? ''}
                    className={inputClass}
                    type="text"
                    placeholder={smaLocalize('com_orgadmin_location_placeholder')}
                    aria-label="Training location"
                  />
                </>
              )}
            />
          </div>

          <div className="mb-4">
            <label className={labelClass} htmlFor="timezone">
              {smaLocalize('com_orgadmin_timezone')}
            </label>
            <Controller
              name="timezone"
              disabled={disabled}
              control={control}
              rules={{
                required: smaLocalize('com_orgadmin_error_timezone_required'),
              }}
              render={({ field }) => (
                <>
                  <select
                    {...field}
                    className={inputClass}
                    aria-label={smaLocalize('com_orgadmin_timezone')}
                    onChange={(e) => {
                      field.onChange(e);
                      setTimezone(e.target.value);
                    }}
                  >
                    {Intl.supportedValuesOf('timeZone').map((timezone) => (
                      <option key={timezone} value={timezone}>
                        {timezone}
                      </option>
                    ))}
                  </select>
                  {errors.timezone && (
                    <p className="mt-1 text-sm text-red-500">{errors.timezone.message}</p>
                  )}
                </>
              )}
            />
          </div>

          <div className="mb-4">
            <label className={labelClass} htmlFor="startDateTime">
              <div className="flex items-center space-x-2">
                <div>{smaLocalize('com_orgadmin_start_date')}</div>
                <HoverCardSettings
                  side="bottom"
                  text={smaLocalize('com_orgadmin_datetime_tooltip')}
                />
              </div>
            </label>
            <Controller
              name="startDateTime"
              disabled={disabled}
              control={control}
              rules={{
                required: smaLocalize('com_orgadmin_error_start_date_required'),
              }}
              render={({ field }) => (
                <>
                  <input
                    {...field}
                    type="datetime-local"
                    max="9999-01-01T00:00"
                    className={inputClass}
                    aria-label={smaLocalize('com_orgadmin_start_date')}
                    value={startDateValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStartDateValue(val);
                      field.onChange(parseDatetimeLocalToDate(val, timezone));
                    }}
                  />
                  {errors.startDateTime && (
                    <p className="mt-1 text-sm text-red-500">{errors.startDateTime.message}</p>
                  )}
                </>
              )}
            />
          </div>

          <div className="mb-4">
            <label className={labelClass} htmlFor="endDateTime">
              <div className="flex items-center space-x-2">
                <div>{smaLocalize('com_orgadmin_end_date')}</div>
                <HoverCardSettings
                  side="bottom"
                  text={smaLocalize('com_orgadmin_datetime_tooltip')}
                />
              </div>
            </label>
            <Controller
              name="endDateTime"
              disabled={disabled}
              control={control}
              rules={{
                required: smaLocalize('com_orgadmin_error_end_date_required'),
                validate: (value, formValues) => {
                  if (!(value instanceof Date) || !(formValues.startDateTime instanceof Date)) {
                    return true;
                  }
                  return (
                    value > formValues.startDateTime ||
                    smaLocalize('com_orgadmin_error_end_date_after_start')
                  );
                },
              }}
              render={({ field }) => (
                <>
                  <input
                    {...field}
                    type="datetime-local"
                    max="9999-01-01T00:00"
                    className={inputClass}
                    aria-label={smaLocalize('com_orgadmin_end_date')}
                    value={endDateValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEndDateValue(val);
                      field.onChange(parseDatetimeLocalToDate(val, timezone));
                    }}
                  />
                  {errors.endDateTime && (
                    <p className="mt-1 text-sm text-red-500">{errors.endDateTime.message}</p>
                  )}
                </>
              )}
            />
          </div>

          <div className="mb-4">
            <label className={labelClass} htmlFor="participantCount">
              {smaLocalize('com_orgadmin_participant_count')}
            </label>
            <Controller
              name="participantCount"
              disabled={disabled}
              control={control}
              rules={{
                required: smaLocalize('com_orgadmin_error_participant_count_required'),
                min: {
                  value: 0,
                  message: smaLocalize('com_orgadmin_error_participant_count_min'),
                },
              }}
              render={({ field }) => (
                <>
                  <input
                    {...field}
                    value={field.value ?? 0}
                    disabled={disabled}
                    onChange={(e) => field.onChange(String(parseInt(e.target.value, 10) || 0))}
                    className={inputClass}
                    type="number"
                    min="0"
                    aria-label="Training participant count"
                  />
                  {errors.participantCount && (
                    <p className="mt-1 text-sm text-red-500">{errors.participantCount.message}</p>
                  )}
                </>
              )}
            />
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

export default TrainingForm;
