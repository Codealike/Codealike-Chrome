import * as React from 'react';
import {FC} from 'react';

import { Panel, PanelBody, PanelHeader } from './../../blocks/Panel';
import { Input } from './../../blocks/Input';


import {IgnoredDomainSetting} from '../components/IgnoredDomainsSetting/IgnoredDomainSetting';
import { WhitelistDomainSetting } from '../components/WhitelistDomainsSetting/WhitelistDomainSetting';
import {UserTokenSetting} from "../components/UserTokenSetting/UserTokenSetting";

export const PreferencesPage: FC = () => {
    const [isWhitelistShown, hideWhitelist] = React.useState<boolean>(true);

    const toggle = React.useCallback(() => {
        hideWhitelist((prev) => !prev);
      }, [hideWhitelist]);

    return (
        <div className="flex flex-col">
            <UserTokenSetting/>
            <Panel>
                 <PanelHeader>Domain Management</PanelHeader>
                <div className="flex gap-x-2">
                    <div className="flex">
                        <Input type="radio" name="rdnDomain" id="rdnWhitelist"
                            className="mt-0.5 rounded-full text-blue-600" 
                            checked={isWhitelistShown} 
                            onChange={toggle}
                        />
                        <label htmlFor="rdnWhitelist" className="text-sm ml-1 text-gray-500 ms-2 dark:text-gray-400">Whitelist</label>
                    </div>

                    <div className="flex">
                        <Input type="radio" name="rdnDomain" id="rdnBlacklist" 
                            className="mt-0.5 rounded-full text-blue-600"
                            checked={!isWhitelistShown}
                            onChange={toggle}
                        />
                        <label htmlFor="rdnBlacklist" className="text-sm ml-1 text-gray-500 ms-2 dark:text-gray-400">Blacklist</label>
                    </div>
                </div>

                 <PanelBody>
                    {(isWhitelistShown ? <WhitelistDomainSetting />: <IgnoredDomainSetting />)}
                 </PanelBody>
            </Panel>
        </div>
    );
};
