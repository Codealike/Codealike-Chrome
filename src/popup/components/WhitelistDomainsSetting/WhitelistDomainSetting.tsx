import * as React from 'react';
import { twMerge } from 'tailwind-merge';

import { Button, ButtonType } from '../../../blocks/Button';
import { Icon, IconType } from '../../../blocks/Icon';
import { Input } from '../../../blocks/Input';
import { PanelBody } from '../../../blocks/Panel';
import { assertDomainIsValid } from '../../../shared/utils/domains';
import { usePopupContext } from '../../hooks/PopupContext';

export const WhitelistDomainSetting: React.FC = () => {
  const { settings, updateSettings } = usePopupContext();
  const [ allowedHosts, setAllowedHosts] = React.useState<string[]>(
    settings.allowedHosts ?? []
  );
  const [ newAllowedHost, setNewAllowedHost] = React.useState<string>('');
  const [isAllowedHostsListExpanded, setAllowedHostListExpanded] =
    React.useState<boolean>(false);

  const handleAddWhitelistDomain = React.useCallback(() => {
    try {
      assertDomainIsValid(newAllowedHost);
      setAllowedHosts((prev) => {
        const newAllowedHostList = Array.from(
          new Set([...prev, newAllowedHost])
        );

        updateSettings({
          allowedHosts: newAllowedHostList,
        });

        return newAllowedHostList;
      });

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
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewAllowedHost(e.target.value);
    },
    []
  );

  const handleAllowHostsListExpanded = React.useCallback(() => {
    setAllowedHostListExpanded((prev) => !prev);
  }, [setAllowedHostListExpanded]);

  return (
    <div className="p-2">
      <PanelBody className="flex flex-col gap-2">
        <p>You can add only the domains you wish to track.</p>
        <div className="flex justify-between items-end gap-2">
          <label className="flex flex-col gap-1 w-full">
            Domain
            <Input
              placeholder="e.g. google.com"
              value={newAllowedHost}
              onChange={handleAddtoAllowedHostChange}
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
          <a
            href="#"
            className="text-blue-500"
            onClick={handleAllowHostsListExpanded}
          >
            View all whitelisted domains
          </a>
          <div className={twMerge('hidden', isAllowedHostsListExpanded && 'block')}>
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
