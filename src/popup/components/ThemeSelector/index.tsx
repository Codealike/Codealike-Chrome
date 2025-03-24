import * as React from 'react';

import { Button, ButtonType } from '../../../blocks/Button';
import { Icon, IconType } from '../../../blocks/Icon';
import { getAppTheme, setAppTheme } from '../../hooks/useTheme';
import { Panel, PanelBody, PanelHeader } from '../../../blocks/Panel';

export const ThemeSelector: React.FC = () => {
  const [theme, setTheme] = React.useState(getAppTheme());

  const handleThemeChange = React.useCallback(
    (theme: 'light' | 'dark' | 'auto') => {
      setAppTheme(theme);
      setTheme(theme);
    },
    []
  );

  const handleDarkThemeSelect = React.useCallback(() => {
    handleThemeChange('dark');
  }, [handleThemeChange]);

  const handleLightThemeSelect = React.useCallback(() => {
    handleThemeChange('light');
  }, [handleThemeChange]);

  const handleAutoThemeSelect = React.useCallback(() => {
    handleThemeChange('auto');
  }, [handleThemeChange]);

  console.log(theme)
  return (
    <Panel>
      <PanelHeader>Change Theme</PanelHeader>
      <PanelBody className="flex flex-col gap-2">
        <p>You can change your extension theme from here.</p>
        <div className="flex justify-between items-end gap-2">
          <Button
            className="h-fit py-2 px-4 border-2 border-solid border-transparent"
            buttonType={ButtonType.Primary}
            onClick={handleAutoThemeSelect}
          >
            <Icon type={IconType.Eclipse} /> Auto
          </Button>
          <Button
            className="h-fit py-2 px-4 border-2 border-solid border-transparent"
            buttonType={ButtonType.Primary}
            onClick={handleDarkThemeSelect}
          >
            <Icon type={IconType.Moon} /> Dark
          </Button>
          <Button
            className="h-fit py-2 px-4 border-2 border-solid border-transparent"
            buttonType={ButtonType.Primary}
            onClick={handleLightThemeSelect}
          >
            <Icon type={IconType.Sun} /> Light
          </Button>
        </div>
      </PanelBody>
    </Panel>
  );
};
