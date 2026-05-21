import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import React, { useState } from 'react';
import { useLocalize, useSmaLocalize } from '~/hooks';
import { ErrorMessage } from '~/components/Auth/ErrorMessage';
import { Spinner } from '@librechat/client';

type TAdminInviteForm = {
  token: string;
  email: string;
  name: string;
  username: string;
  password: string;
  confirm_password: string;
};

function AdminInvite() {
  const localize = useLocalize();
  const smaLocalize = useSmaLocalize();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TAdminInviteForm>();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState<number>(6);

  const password = watch('password');

  // Create a mutation for accepting the invitation
  const acceptAdminInvitation = useMutation({
    mutationFn: (data: TAdminInviteForm) => {
      return axios.post('/api/invitations/accept', data);
    },
    onMutate: () => {
      setIsSubmitting(true);
    },
    onError: (error) => {
      setIsSubmitting(false);
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        setErrorMessage(error.response.data.error);
      }
    },
    onSuccess: () => {
      setIsSubmitting(false);
      setCountdown(6);
      const timer = setInterval(() => {
        setCountdown((prevCountdown) => {
          if (prevCountdown <= 1) {
            clearInterval(timer);
            navigate('/login', { replace: true });
            return 0;
          } else {
            return prevCountdown - 1;
          }
        });
      }, 1000);
    },
  });

  const onSubmit = (data: TAdminInviteForm) => {
    acceptAdminInvitation.mutate(data);
  };

  return (
    <>
      {errorMessage && (
        <ErrorMessage>
          {smaLocalize('com_ui_invite_error')} {errorMessage}
        </ErrorMessage>
      )}
      {acceptAdminInvitation.isSuccess && countdown > 0 && (
        <>
          <div
            className="relative mb-8 mt-4 rounded-2xl border border-green-400 bg-green-100 px-4 py-3 text-center text-green-700 dark:bg-gray-900 dark:text-white"
            role="alert"
          >
            {smaLocalize('com_superadmin_invite_success')}{' '}
            {' ' + localize('com_auth_email_verification_redirecting', { 0: countdown.toString() })}
          </div>
        </>
      )}
      <form className="mt-6" aria-label="Registration form" onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" id="token" value={params.get('token') ?? ''} {...register('token')} />
        <input type="hidden" id="email" value={params.get('email') ?? ''} {...register('email')} />

        <div className="mb-2">
          <div className="relative">
            <input
              type="text"
              id="name"
              autoComplete="name"
              aria-label={localize('com_auth_full_name')}
              {...register('name', {
                required: localize('com_auth_name_required'),
                minLength: {
                  value: 2,
                  message: localize('com_auth_name_min_length'),
                },
                maxLength: {
                  value: 80,
                  message: localize('com_auth_name_max_length'),
                },
              })}
              aria-invalid={!!errors.name}
              className="webkit-dark-styles transition-color peer w-full rounded-2xl border border-border-light bg-surface-primary px-3.5 pb-2.5 pt-3 text-text-primary duration-200 focus:border-green-500 focus:outline-none"
              placeholder=" "
            />
            <label
              htmlFor="name"
              className="absolute start-3 top-1.5 z-10 origin-[0] -translate-y-4 scale-75 transform bg-surface-primary px-2 text-sm text-text-secondary-alt duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-1.5 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-green-500 rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4"
            >
              {localize('com_auth_full_name')}
            </label>
          </div>
          {errors.name && (
            <span role="alert" className="mt-1 text-sm text-red-500 dark:text-red-900">
              {errors.name.message}
            </span>
          )}
        </div>

        <div className="mb-2">
          <div className="relative">
            <input
              type="text"
              id="username"
              autoComplete="username"
              aria-label={localize('com_auth_username')}
              {...register('username', {
                minLength: {
                  value: 2,
                  message: localize('com_auth_username_min_length'),
                },
                maxLength: {
                  value: 80,
                  message: localize('com_auth_username_max_length'),
                },
              })}
              aria-invalid={!!errors.username}
              className="webkit-dark-styles transition-color peer w-full rounded-2xl border border-border-light bg-surface-primary px-3.5 pb-2.5 pt-3 text-text-primary duration-200 focus:border-green-500 focus:outline-none"
              placeholder=" "
            />
            <label
              htmlFor="username"
              className="absolute start-3 top-1.5 z-10 origin-[0] -translate-y-4 scale-75 transform bg-surface-primary px-2 text-sm text-text-secondary-alt duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-1.5 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-green-500 rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4"
            >
              {localize('com_auth_username')}
            </label>
          </div>
          {errors.username && (
            <span role="alert" className="mt-1 text-sm text-red-500 dark:text-red-900">
              {errors.username.message}
            </span>
          )}
        </div>

        <div className="mb-2">
          <div className="relative">
            <input
              type="password"
              id="password"
              autoComplete="new-password"
              aria-label={localize('com_auth_password')}
              {...register('password', {
                required: localize('com_auth_password_required'),
                minLength: {
                  value: 8,
                  message: localize('com_auth_password_min_length'),
                },
                maxLength: {
                  value: 128,
                  message: localize('com_auth_password_max_length'),
                },
              })}
              aria-invalid={!!errors.password}
              className="webkit-dark-styles transition-color peer w-full rounded-2xl border border-border-light bg-surface-primary px-3.5 pb-2.5 pt-3 text-text-primary duration-200 focus:border-green-500 focus:outline-none"
              placeholder=" "
            />
            <label
              htmlFor="password"
              className="absolute start-3 top-1.5 z-10 origin-[0] -translate-y-4 scale-75 transform bg-surface-primary px-2 text-sm text-text-secondary-alt duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-1.5 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-green-500 rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4"
            >
              {localize('com_auth_password')}
            </label>
          </div>

          {errors.password && (
            <span role="alert" className="mt-1 text-sm text-red-500 dark:text-red-900">
              {errors.password.message}
            </span>
          )}
        </div>
        <div className="mb-2">
          <div className="relative">
            <input
              type="password"
              id="confirm_password"
              autoComplete="new-password"
              aria-label={localize('com_auth_password_confirm')}
              {...register('confirm_password', {
                validate: (value) => value === password || localize('com_auth_password_not_match'),
              })}
              aria-invalid={!!errors.confirm_password}
              className="webkit-dark-styles transition-color peer w-full rounded-2xl border border-border-light bg-surface-primary px-3.5 pb-2.5 pt-3 text-text-primary duration-200 focus:border-green-500 focus:outline-none"
              placeholder=" "
            />
            <label
              htmlFor="confirm_password"
              className="absolute start-3 top-1.5 z-10 origin-[0] -translate-y-4 scale-75 transform bg-surface-primary px-2 text-sm text-text-secondary-alt duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-1.5 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-green-500 rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4"
            >
              {localize('com_auth_password_confirm')}
            </label>
          </div>
          {errors.confirm_password && (
            <span role="alert" className="mt-1 text-sm text-red-500 dark:text-red-900">
              {errors.confirm_password.message}
            </span>
          )}
        </div>
        <div className="mt-6">
          <button
            disabled={
              !!errors.name ||
              !!errors.username ||
              !!errors.password ||
              !!errors.confirm_password ||
              isSubmitting ||
              acceptAdminInvitation.isSuccess
            }
            type="submit"
            aria-label="Submit registration"
            className="w-full rounded-2xl bg-green-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
          >
            {isSubmitting ? <Spinner /> : localize('com_auth_continue')}
          </button>
        </div>
      </form>
    </>
  );
}

export default AdminInvite;
