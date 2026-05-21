import React, { FC, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, Home, LogOut, Moon, Sun } from 'lucide-react';
import { SystemRoles } from 'librechat-data-provider';
import { useAuthContext } from '~/hooks/AuthContext';
import { Dropdown, ThemeContext, TooltipAnchor } from '@librechat/client';
import { useLocalize, useSmaLocalize } from '~/hooks';
import { useRecoilState } from 'recoil';
import Cookies from 'js-cookie';
import store from '~/store';
import { useIsActiveTrainerQuery } from '~/data-provider';

const UtilityButtons: FC = () => {
  const { theme, setTheme } = useContext(ThemeContext);
  const { logout, user } = useAuthContext();
  const navigate = useNavigate();
  const localize = useLocalize();
  const smaLocalize = useSmaLocalize();
  const [langcode, setLangcode] = useRecoilState(store.lang);
  const { data: trainerData } = useIsActiveTrainerQuery();
  const isSuperAdmin = user?.role.includes(SystemRoles.ADMIN);
  const isTrainerWithOngoingTraining =
    user?.role.includes(SystemRoles.TRAINER) && trainerData?.isActiveTrainer;

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const goToNewChat = () => {
    navigate('/c/new');
  };

  const handleLogout = () => {
    logout();
  };

  const openDocumentation = () => {
    window.open('https://www.smartesting.com/en/workbench-onlinehelp/', '_blank');
  };

  const changeLang = (value: string) => {
    let userLang = value;
    if (value === 'auto') {
      userLang = navigator.language || navigator.languages[0];
    }

    requestAnimationFrame(() => {
      document.documentElement.lang = userLang;
    });
    setLangcode(userLang);
    Cookies.set('lang', userLang, { expires: 365 });
  };

  const languageOptions = [
    { value: 'auto', label: localize('com_nav_lang_auto') },
    { value: 'en-US', label: localize('com_nav_lang_english') },
    { value: 'de-DE', label: localize('com_nav_lang_german') },
    { value: 'fr-FR', label: localize('com_nav_lang_french') },
  ];

  return (
    <div className="absolute right-4 top-4 flex space-x-2">
      {(isSuperAdmin || isTrainerWithOngoingTraining) && (
        <TooltipAnchor
          aria-label={localize('com_ui_back_to_prompts')}
          description={localize('com_ui_back_to_prompts')}
          role="button"
          onClick={goToNewChat}
          className="inline-flex size-10 flex-shrink-0 items-center justify-center rounded-xl border border-border-light bg-transparent text-text-primary transition-all ease-in-out hover:bg-surface-tertiary disabled:pointer-events-none disabled:opacity-50"
        >
          <Home size={24} />
        </TooltipAnchor>
      )}

      <TooltipAnchor
        aria-label={localize('com_nav_theme')}
        description={localize('com_nav_theme')}
        role="button"
        onClick={toggleTheme}
        className="inline-flex size-10 flex-shrink-0 items-center justify-center rounded-xl border border-border-light bg-transparent text-text-primary transition-all ease-in-out hover:bg-surface-tertiary disabled:pointer-events-none disabled:opacity-50"
      >
        {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
      </TooltipAnchor>

      <TooltipAnchor
        aria-label={smaLocalize('com_nav_documentation')}
        description={smaLocalize('com_nav_documentation')}
        role="button"
        onClick={openDocumentation}
        className="inline-flex size-10 flex-shrink-0 items-center justify-center rounded-xl border border-border-light bg-transparent text-text-primary transition-all ease-in-out hover:bg-surface-tertiary disabled:pointer-events-none disabled:opacity-50"
      >
        <HelpCircle size={24} />
      </TooltipAnchor>

      <div className="relative">
        <Dropdown
          ariaLabel={localize('com_nav_language')}
          value={langcode}
          onChange={changeLang}
          options={languageOptions}
          sizeClasses="[--anchor-max-height:256px]"
          className="rounded-xl"
        />
      </div>

      <TooltipAnchor
        aria-label={localize('com_nav_log_out')}
        description={localize('com_nav_log_out')}
        role="button"
        onClick={handleLogout}
        className="inline-flex size-10 flex-shrink-0 items-center justify-center rounded-xl border border-border-light bg-transparent text-text-primary transition-all ease-in-out hover:bg-surface-tertiary disabled:pointer-events-none disabled:opacity-50"
      >
        <LogOut size={24} />
      </TooltipAnchor>
    </div>
  );
};

export default UtilityButtons;
