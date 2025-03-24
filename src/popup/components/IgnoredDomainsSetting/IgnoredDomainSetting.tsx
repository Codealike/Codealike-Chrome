import * as React from 'react';

import { Button, ButtonType } from '../../../blocks/Button';
import { Icon, IconType } from '../../../blocks/Icon';
import { TextArea } from '../../../blocks/Input';
import { PanelBody } from '../../../blocks/Panel';
import { assertDomainIsValid } from '../../../shared/utils/domains';
import { usePopupContext } from '../../hooks/PopupContext';

export const IgnoredDomainSetting: React.FC = () => {
  const { settings, updateSettings } = usePopupContext();
  const [ignoredDomains, setIgnoredDomains] = React.useState<string[]>(
    settings.ignoredHosts
  );
  const [domainToIgnore, setDomainToIgnore] = React.useState<string>('');

  const handleAddIgnoredDomain = React.useCallback(() => {
    try {
      const ignoredHostsList = domainToIgnore.split(',')
      for (const host of ignoredHostsList) {
        assertDomainIsValid(host.trim());
        setIgnoredDomains((prev) => {
          const newIgnoredHostList = Array.from(
            new Set([...prev, host.trim()])
          );
  
          updateSettings({
            ignoredHosts: newIgnoredHostList,
          });
  
          return newIgnoredHostList;
        });
      }

      setDomainToIgnore('');
    } catch (_) {
      //
    }
  }, [domainToIgnore, updateSettings]);

  const handleRemoveIgnoredDomain = React.useCallback(
    (domain: string) => {
      setIgnoredDomains((prev) => {
        const newIgnoredHostList = prev.filter((d) => d !== domain);

        updateSettings({
          ignoredHosts: newIgnoredHostList,
        });

        return newIgnoredHostList;
      });
    },
    [setIgnoredDomains, updateSettings]
  );

  const handleDomainToIgnoreChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setDomainToIgnore(e.target.value);
    },
    []
  );

  const handleKeyDown = ((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if(event.key === 'Enter') {
      event.preventDefault();
      handleAddIgnoredDomain()
    }
  })

  return (
    <div className="p-2">
      <PanelBody className="flex flex-col gap-2">
        <p>You can hide unwanted websites to keep dashboards clean.</p>
        <div className="flex justify-between items-end gap-2">
          <label className="flex flex-col gap-1 w-full">
            Domain
            <TextArea
              placeholder="e.g. google.com, bing.com (comma separated)"
              value={domainToIgnore}
              onChange={handleDomainToIgnoreChange}
              onKeyDown={handleKeyDown}
            />
          </label>
          <Button
            className="h-fit py-2 px-4 border-2 border-solid border-transparent"
            buttonType={ButtonType.Primary}
            onClick={handleAddIgnoredDomain}
          >
            Add
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          <div className="block max-h-[125px] overflow-auto scroll-auto">
            {!ignoredDomains.length && (
              <p className="text-gray-500">No blacklisted domains</p>
            )}
            {ignoredDomains.map((domain) => (
              <div key={domain} className="flex items-center gap-2">
                <Icon
                  type={IconType.Close}
                  className="hover:text-neutral-400 cursor-pointer"
                  onClick={() => handleRemoveIgnoredDomain(domain)}
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
