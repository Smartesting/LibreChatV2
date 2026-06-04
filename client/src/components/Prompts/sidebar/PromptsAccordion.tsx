import { SystemRoles } from 'librechat-data-provider';
import { useAuthContext } from '~/hooks';
import { AdminSettings } from '~/components/Prompts';
import { hasRole } from '~/utils/roles';
import AutoSendPrompt from '../buttons/AutoSendPrompt';
import PromptSidePanel from './GroupSidePanel';
import FilterPrompts from './FilterPrompts';

export default function PromptsAccordion() {
  const { user } = useAuthContext();
  return (
    <PromptSidePanel className="space-y-2 pt-2">
      <FilterPrompts />
      {hasRole(user?.role, SystemRoles.ADMIN) && <AdminSettings />}
      <AutoSendPrompt />
    </PromptSidePanel>
  );
}
