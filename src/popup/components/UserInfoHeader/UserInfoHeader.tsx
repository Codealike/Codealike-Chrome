import * as React from "react";
import { getProfile } from "../../../shared/api/client";
import { ProfileResponse } from "./type";
import { usePopupContext } from "../../hooks/PopupContext";
import { ConnectionStatus } from "../../../shared/db/types";

export const UserInfoHeader: React.FC = () => {
  const { settings, updateSettings } = usePopupContext();
  const [state, setState] = React.useState<{
    identity: string | undefined;
  }>({
    identity: settings.username,
  });

  const getUserProfile = React.useCallback(() => {
    getProfile(settings.userToken as string)
      .then((res: ProfileResponse) => {
        setState((prev) => ({
          ...prev,
          identity: res.Identity
        }));
        updateSettings({
          username: res.Identity
        })
      });
  }, [settings, updateSettings]);

  React.useEffect(() => {
    (async function () {
      const { username, connectionStatus } = settings

      if (username) {
        setState((prev) => ({
          ...prev,
          identity: username
        }));
      }

      if (connectionStatus === ConnectionStatus.Connected && !username) {
        getUserProfile();
      }

      if (connectionStatus === ConnectionStatus.Disconnected && username) {
        setState((prev) => ({
          ...prev,
          identity: ''
        }));
        updateSettings({
          username: ''
        })
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const { identity } = state;
  return (
  <>
    <div className="flex items-center">
      <span className="font-semibold px-2">Codealike</span>
    </div>

    {
      identity 
        ? (<span className="ml-auto text-green-600">{identity}</span>) 
        : (<span className="ml-auto text-red-600">User not connected</span>)
    }
  </>
  )
};