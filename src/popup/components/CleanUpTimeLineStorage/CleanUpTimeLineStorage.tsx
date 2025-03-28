import * as React from "react";
import { Panel, PanelBody, PanelHeader } from "../../../blocks/Panel";
import { Button, ButtonType } from "../../../blocks/Button";
import { handleClearTimeLineData } from "../../../shared/db/helper";
import { Input } from "../../../blocks/Input";

export const CleanUpTimeLineStorage: React.FC = () => {
  const [state, setState] = React.useState<{
    cutOffDate: string
    status: boolean,
    statusText: string,
  }>({
    cutOffDate: '',
    status: false,
    statusText: '',
  });

  const handleClearData = React.useCallback(() => {
    const days = Number(state.cutOffDate);
    if (days < 1) {
      setState((prev) => ({
        ...prev,
        status: true,
        statusText: 'Cut Off Date cannot be lower than 1'
      }));
      return;
    }

    handleClearTimeLineData(days)
      .then((res) => {
      setState((prev) => ({
        ...prev,
        status: true,
        statusText: res,
      }));
    })
  }, [state]);

  const handleCutOffDate = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setState((prev) => ({
        ...prev,
        cutOffDate: e.target.value,
      }));
    },
    [],
  );

  const { cutOffDate, status, statusText } = state;
  return (
    <Panel>
      <PanelHeader>Clean Up Old Timeline Data</PanelHeader>
      <PanelBody className="flex flex-col gap-2">
        <p>Enter the number of days you wish to retain your data. Data older than this period will be removed.</p>
        <div className="flex justify-between items-end gap-2">
          <label className="flex flex-col gap-1 w-full">
            <Input
              placeholder="e.g. 10"
              value={cutOffDate}
              onChange={handleCutOffDate}
              type="number"
              min={1}
            />
          </label>
          <Button
            className="h-fit py-2 px-4 border-2 border-solid border-transparent"
            buttonType={ButtonType.Primary}
            onClick={handleClearData}
          >
            Clear
          </Button>
        </div>
        <p className="text-gray-400">After clicking the Clear button, only the timeline data from your local storage will be cleared. The synced data will remain in the server.</p>
        <div className="flex justify-between items-end gap-2">
          {status
            && (<p className="text-yellow-600">{statusText}</p>)
          }
        </div>
      </PanelBody>
    </Panel>
  )
}