import * as React from 'react';
import {FC} from 'react';

import {IgnoredDomainSetting} from '../components/IgnoredDomainsSetting/IgnoredDomainSetting';
import {UserTokenSetting} from "../components/UserTokenSetting/UserTokenSetting";

export const PreferencesPage: FC = () => {
    return (
        <div className="flex flex-col">
            <UserTokenSetting/>
            <IgnoredDomainSetting/>
        </div>
    );
};
