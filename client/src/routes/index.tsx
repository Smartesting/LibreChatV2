import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import {
  ApiErrorWatcher,
  Login,
  Registration,
  RequestPasswordReset,
  ResetPassword,
  TwoFactorScreen,
  VerifyEmail,
} from '~/components/Auth';
import { MarketplaceProvider } from '~/components/Agents/MarketplaceContext';
import AgentMarketplace from '~/components/Agents/Marketplace';
import { OAuthError, OAuthSuccess } from '~/components/OAuth';
import { AuthContextProvider } from '~/hooks/AuthContext';
import WithRum from '~/lib/rum/WithRum';
import RouteErrorBoundary from './RouteErrorBoundary';
import StartupLayout from './Layouts/Startup';
import LoginLayout from './Layouts/Login';
import dashboardRoutes from './Dashboard';
import ShareRoute from './ShareRoute';
import ChatRoute from './ChatRoute';
import Search from './Search';
import Root from './Root';
import TrainingOrganizationsRoute from '~/routes/TrainingOrganizationsRoute';
import TrainingOrganizationRoute from '~/routes/TrainingOrganizationRoute';
import OrgAdminProtectedRoute from '~/routes/OrgAdminProtectedRoute';
import SuperAdminRoute from '~/routes/SuperAdminRoute';
import OrgAdminInvite from '~/components/Auth/OrgAdminInvite';
import AdminInvite from '~/components/Auth/AdminInvite';
import TrainerInvite from '~/components/Auth/TrainerInvite';

const AuthLayout = () => (
  <AuthContextProvider>
    <WithRum>
      <Outlet />
    </WithRum>
    <ApiErrorWatcher />
  </AuthContextProvider>
);

const loadInlinePromptsView = () =>
  import('~/components/Prompts/layouts/InlinePromptsView').then((m) => ({
    Component: m.default,
  }));

const loadSkillsView = () =>
  import('~/components/Skills/layouts/SkillsView').then((m) => ({
    Component: m.default,
  }));

const baseEl = document.querySelector('base');
const baseHref = baseEl?.getAttribute('href') || '/';

export const router = createBrowserRouter(
  [
    {
      path: 'share/:shareId',
      element: <ShareRoute />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'oauth',
      errorElement: <RouteErrorBoundary />,
      children: [
        {
          path: 'success',
          element: <OAuthSuccess />,
        },
        {
          path: 'error',
          element: <OAuthError />,
        },
      ],
    },
    {
      path: '/',
      element: <StartupLayout />,
      errorElement: <RouteErrorBoundary />,
      children: [
        {
          path: 'register',
          element: <Registration />,
        },
        {
          path: 'forgot-password',
          element: <RequestPasswordReset />,
        },
        {
          path: 'reset-password',
          element: <ResetPassword />,
        },
        {
          path: 'org-admin-invite',
          element: <OrgAdminInvite />,
        },
        {
          path: 'admin-invite',
          element: <AdminInvite />,
        },
        {
          path: 'trainer-invite',
          element: <TrainerInvite />,
        },
      ],
    },
    {
      path: 'verify',
      element: <VerifyEmail />,
      errorElement: <RouteErrorBoundary />,
    },
    {
      element: <AuthLayout />,
      errorElement: <RouteErrorBoundary />,
      children: [
        {
          path: 'training-organizations',
          element: <TrainingOrganizationsRoute />,
          errorElement: <RouteErrorBoundary />,
        },
        {
          path: 'training-organizations/:orgId',
          element: <TrainingOrganizationRoute />,
          errorElement: <RouteErrorBoundary />,
        },
        {
          path: '/',
          element: <LoginLayout />,
          children: [
            {
              path: 'login',
              element: <Login />,
            },
            {
              path: 'login/2fa',
              element: <TwoFactorScreen />,
            },
          ],
        },
        dashboardRoutes,
        {
          path: '/',
          element: <Root />,
          children: [
            {
              index: true,
              element: <Navigate to="/c/new" replace={true} />,
            },
            {
              path: 'c/:conversationId?',
              element: <ChatRoute />,
            },
            {
              path: 'search',
              element: <Search />,
            },
            {
              path: 'prompts',
              element: <Navigate to="/prompts/new" replace={true} />,
            },
            {
              path: 'prompts/new',
              lazy: loadInlinePromptsView,
            },
            {
              path: 'prompts/:promptId',
              lazy: loadInlinePromptsView,
            },
            {
              path: 'skills',
              lazy: loadSkillsView,
            },
            {
              path: 'skills/new',
              lazy: loadSkillsView,
            },
            {
              path: 'skills/:skillId',
              lazy: loadSkillsView,
            },
            {
              path: 'skills/:skillId/edit',
              lazy: loadSkillsView,
            },
            {
              path: 'agents',
              element: (
                <MarketplaceProvider>
                  <AgentMarketplace />
                </MarketplaceProvider>
              ),
            },
            {
              path: 'agents/:category',
              element: (
                <MarketplaceProvider>
                  <AgentMarketplace />
                </MarketplaceProvider>
              ),
            },
          ],
        },
        // Protected routes - not accessible to ORGADMIN users
        {
          element: <OrgAdminProtectedRoute />,
          children: [
            {
              path: 'admin',
              element: <SuperAdminRoute />,
              errorElement: <RouteErrorBoundary />,
            },
            dashboardRoutes,
            {
              path: '/',
              element: <Root />,
              children: [
                {
                  index: true,
                  element: <Navigate to="/c/new" replace={true} />,
                },
                {
                  path: 'c/:conversationId?',
                  element: <ChatRoute />,
                },
                {
                  path: 'search',
                  element: <Search />,
                },
                {
                  path: 'prompts',
                  element: <Navigate to="/prompts/new" replace={true} />,
                },
                {
                  path: 'prompts/new',
                  lazy: loadInlinePromptsView,
                },
                {
                  path: 'prompts/:promptId',
                  lazy: loadInlinePromptsView,
                },
                {
                  path: 'skills',
                  lazy: loadSkillsView,
                },
                {
                  path: 'skills/:skillId',
                  lazy: loadSkillsView,
                },
                {
                  path: 'skills/:skillId/edit',
                  lazy: loadSkillsView,
                },
                {
                  path: 'agents',
                  element: (
                    <MarketplaceProvider>
                      <AgentMarketplace />
                    </MarketplaceProvider>
                  ),
                },
                {
                  path: 'agents/:category',
                  element: (
                    <MarketplaceProvider>
                      <AgentMarketplace />
                    </MarketplaceProvider>
                  ),
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  { basename: baseHref },
);
