import { Button, ButtonType } from '../../../blocks/Button';
import { Icon, IconType } from '../../../blocks/Icon';
import { Input } from '../../../blocks/Input';
import { Panel, PanelBody, PanelHeader } from '../../../blocks/Panel';
import { ConnectionStatus } from '../../../shared/db/types';
import { getSettings } from '../../../shared/preferences';
import { authorize } from '../../api';
import { usePopupContext } from '../../hooks/PopupContext';
import * as React from 'react';

const StatusIcons: { [key in ConnectionStatus]: IconType } = {
  [ConnectionStatus.Disconnected]: IconType.Cross,
  [ConnectionStatus.Connecting]: IconType.Network,
  [ConnectionStatus.Connected]: IconType.Check,
};
const StatusColors: { [key in ConnectionStatus]: string } = {
  [ConnectionStatus.Disconnected]: 'text-red-600',
  [ConnectionStatus.Connecting]: 'text-yellow-600',
  [ConnectionStatus.Connected]: 'text-green-600',
};

// eslint-disable-next-line max-lines-per-function
export const UserTokenSetting: React.FC = () => {
  const { settings, updateSettings } = usePopupContext();
  const [state, setState] = React.useState<{
    connectionStatus: ConnectionStatus;
    status: string;
    userToken: string | undefined;
  }>({
    connectionStatus: settings.connectionStatus,
    status: 'Codealike is not connected',
    userToken: settings.userToken,
  });

  const handleUserToken = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setState({
        ...state,
        userToken: e.target.value,
      });
    },
    [state],
  );

  const authorizeUserToken = React.useCallback(() => {
    const { userToken, connectionStatus } = state;
    updateSettings({
      connectionStatus,
      userToken,
    });

    setState({
      ...state,
      connectionStatus: ConnectionStatus.Connecting,
      status: 'Codealike is connecting...',
    });

    authorize(userToken as string)
      .then(() => {
        setState({
          ...state,
          connectionStatus: ConnectionStatus.Connected,
          status: 'Codealike is connected',
        });
      })
      .catch(() => {
        setState({
          ...state,
          connectionStatus: ConnectionStatus.Disconnected,
          status: 'Codealike is disconnected',
        });
        console.log('codealike not connected due to invalid token');
      });
  }, [state, updateSettings]);

  React.useEffect(() => {
    (async function () {
      authorizeUserToken();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { userToken, connectionStatus, status } = state;
  return (
    <Panel>
      <PanelHeader>Set user token</PanelHeader>
      <PanelBody className="flex flex-col gap-2">
        <p>Your Codealike API token</p>
        <div className="flex justify-between items-end gap-2">
          <label className="flex flex-col gap-1 w-full">
            <Input
              placeholder="e.g. user token"
              value={userToken}
              onChange={handleUserToken}
            />
          </label>
          <Button
            className="h-fit py-2 px-4 border-2 border-solid border-transparent"
            buttonType={ButtonType.Primary}
            onClick={authorizeUserToken}
          >
            Save
          </Button>
        </div>
        <div className="flex justify-between items-end gap-2">
          <span className={StatusColors[connectionStatus]}>
            <Icon type={StatusIcons[connectionStatus]} />
            {status}
          </span>
        </div>
      </PanelBody>
    </Panel>
  );
};
