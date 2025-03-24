import * as React from 'react';
// import { twMerge } from 'tailwind-merge';

import { Button, ButtonType } from '../../../blocks/Button';
import { Icon, IconType } from '../../../blocks/Icon';
import { TextArea } from '../../../blocks/Input';
import { PanelBody } from '../../../blocks/Panel';
import { assertDomainIsValid } from '../../../shared/utils/domains';
import { usePopupContext } from '../../hooks/PopupContext';

export const WhitelistDomainSetting: React.FC = () => {
  const { settings, updateSettings } = usePopupContext();
  const [ allowedHosts, setAllowedHosts] = React.useState<string[]>(
    settings.allowedHosts ?? []
  );
  const [ newAllowedHost, setNewAllowedHost] = React.useState<string>('');

  const handleAddWhitelistDomain = React.useCallback(() => {
    try {
      const allowedHostsList = newAllowedHost.split(',')
      for (const host of allowedHostsList) {
        assertDomainIsValid(host.trim());
        setAllowedHosts((prev) => {
          const newAllowedHostList = Array.from(
            new Set([...prev, host.trim()])
          );
  
          updateSettings({
            allowedHosts: newAllowedHostList,
          });
  
          return newAllowedHostList;
        });
      }

      setNewAllowedHost('');
    } catch (_) {
      //
    }
  }, [newAllowedHost, updateSettings]);

  const handleRemoveAllowedHost = React.useCallback(
    (host: string) => {
      setAllowedHosts((prev) => {
        const newAllowedHostList = prev.filter((h) => h !== host);

        updateSettings({
          allowedHosts: newAllowedHostList,
        });

        return newAllowedHostList;
      });
    },
    [setAllowedHosts, updateSettings]
  );

  const handleAddtoAllowedHostChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setNewAllowedHost(e.target.value);
    },
    []
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if(event.key === 'Enter') {
      event.preventDefault();
      handleAddWhitelistDomain()
    }
  }

  return (
    <div className="p-2">
      <PanelBody className="flex flex-col gap-2">
        <p>You can add only the domains you wish to track.</p>
        <div className="flex justify-between items-end gap-2">
          <label className="flex flex-col gap-1 w-full">
            Domain
            <TextArea
              placeholder="e.g. google.com, bing.com (comma separated)"
              value={newAllowedHost}
              onChange={handleAddtoAllowedHostChange}
              onKeyDown={handleKeyDown}
            />
          </label>
          <Button
            className="h-fit py-2 px-4 border-2 border-solid border-transparent"
            buttonType={ButtonType.Primary}
            onClick={handleAddWhitelistDomain}
          >
            Add
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          <div className="block max-h-[125px] overflow-auto scroll-auto">
            {!allowedHosts.length && (
              <p className="text-gray-500">No whitelisted domains</p>
            )}
            {allowedHosts.map((domain) => (
              <div key={domain} className="flex items-center gap-2">
                <Icon
                  type={IconType.Close}
                  className="hover:text-neutral-400 cursor-pointer"
                  onClick={() => handleRemoveAllowedHost(domain)}
                />
                <span>{domain}</span>
              </div>
            ))}
          </div>
        </div>
      </PanelBody>
    </div>
  );
};
