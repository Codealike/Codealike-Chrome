import * as React from "react"
import { Panel, PanelBody, PanelHeader } from "../../../blocks/Panel"
import { usePopupContext } from "../../hooks/PopupContext"
import { LogMessage } from "../../../shared/db/types";
import { formatEpoch } from "../../../shared/utils/dates-helper";
import { Input } from "../../../blocks/Input";
import { LogFilterTypes } from "./type";
import { Button, ButtonType } from "../../../blocks/Button";
import { handleLogTableCleanUp } from "../../../shared/db/helper";

export const LogViewer: React.FC = () => {
  const { logs } = usePopupContext();
  const [state, setState] = React.useState<{
    cutOffDate: number | string
    filteredLogs: LogMessage[]
    filters: LogFilterTypes
    isChecked: boolean,
    status: boolean,
    statusText: string,
  }>({
    cutOffDate: '',
    filteredLogs: [],
    filters: LogFilterTypes.WEBSITE,
    isChecked: true,
    status: false,
    statusText: '',
  })


  const getFilteredLogs = React.useCallback((appliedFilter?: LogFilterTypes) => {
    let filtered = logs?.slice(-100).reverse()

    if (appliedFilter === LogFilterTypes.WEBSITE) {
      filtered = filtered?.filter(log => log.message.includes('Visited'))
    }

    if (appliedFilter === LogFilterTypes.OTHER) {
      filtered = filtered?.filter(log => !log.message.includes('Visited'))
    }

    return filtered;
  }, [logs]);

  React.useEffect(() => {
    (async function () {
      const updatedLogs = getFilteredLogs(state.filters)

      setState((prev) => ({
        ...prev,
        filteredLogs: updatedLogs as LogMessage[]
      }))

    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFilters = React.useCallback((filter: LogFilterTypes) => {
    const updatedLogs = getFilteredLogs(filter);

    setState((prev) => ({
      ...prev,
      filteredLogs: updatedLogs as LogMessage[],
      filters: filter,
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCutOffDate = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setState((prev) => ({
        ...prev,
        cutOffDate: Number(e.target.value),
      }));
    },
    [],
  );

  const handleClearLogData = React.useCallback(() => {
    const days = Number(state.cutOffDate);
    if (days < 0) {
      setState((prev) => ({
        ...prev,
        status: true,
        statusText: 'Cut Off Date cannot be lower than 0'
      }));
      return;
    }

    // Call the cleanup function
    handleLogTableCleanUp(days)
    .then((res) => {
      // Update state
      setState((prev) => ({
        ...prev,
        status: true,
        statusText: res as string
      }));
    })

  }, [state]);

  const { filteredLogs, filters, cutOffDate, status, statusText } = state;
  return (
    <Panel>
      <PanelHeader>Log Viewer</PanelHeader>
      <PanelBody>
        <div className="flex gap-6 pb-2">
            <div className="flex">
                <Input type="radio" name="filter" id="allFilter"
                    className="mt-0.5 rounded-full text-blue-600" 
                    checked={filters === LogFilterTypes.ALL} 
                    onChange={() => toggleFilters(LogFilterTypes.ALL)}
                />
                <label htmlFor="allFilter" className="text-sm ml-1 text-gray-500 ms-2 dark:text-gray-400">All</label>
            </div>

            <div className="flex">
                <Input type="radio" name="filter" id="visitedFilter" 
                    className="mt-0.5 rounded-full text-blue-600"
                    checked={filters === LogFilterTypes.WEBSITE}
                    onChange={() => toggleFilters(LogFilterTypes.WEBSITE)}
                />
                <label htmlFor="visitedFilter" className="text-sm ml-1 text-gray-500 ms-2 dark:text-gray-400">Visited</label>
            </div>

            <div className="flex">
                <Input type="radio" name="filter" id="otherFilter" 
                    className="mt-0.5 rounded-full text-blue-600"
                    checked={filters === LogFilterTypes.OTHER}
                    onChange={() => toggleFilters(LogFilterTypes.OTHER)}
                />
                <label htmlFor="otherFilter" className="text-sm ml-1 text-gray-500 ms-2 dark:text-gray-400">Other</label>
            </div>
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto ">
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-3 break-words whitespace-normal font-bold">
              Time
            </div>
            <div className="col-span-9 break-words whitespace-normal font-bold">
              Message
            </div>
          </div>
          {
            filteredLogs.map((log) => (
              <div key={log.id} className="grid grid-cols-12 gap-2">
                <div className="col-span-3 break-words whitespace-normal">
                  {formatEpoch(log.timestamp)}
                </div>
                <div className="col-span-9 break-words whitespace-normal">
                  {log.message}
                </div>
              </div>
            ))
          }
        </div>

        <div className="flex justify-between items-end gap-2 pt-4 pb-2">
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
            onClick={handleClearLogData}
          >
            Clear
          </Button>
        </div>
        <p className="text-gray-400">After clicking the Clear button, only the log data from your indexed db will be cleared.</p>
        <div className="flex justify-between items-end gap-2">
          {status
            && (<p className="text-yellow-600">{statusText}</p>)
          }
        </div>
      </PanelBody>
    </Panel>
  )
}