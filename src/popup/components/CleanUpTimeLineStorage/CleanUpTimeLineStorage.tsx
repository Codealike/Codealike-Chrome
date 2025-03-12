import * as React from "react";
import { Panel, PanelBody, PanelHeader } from "../../../blocks/Panel";
import { Button, ButtonType } from "../../../blocks/Button";
import { handleClearTimeLineData } from "../../../shared/db/helper";

export const CleanUpTimeLineStorage: React.FC = () => {
  const [state, setState] = React.useState<{
    status: boolean,
    statusText: string,
  }>({
    status: false,
    statusText: '',
  });

  const handleClearData = (() => {
    handleClearTimeLineData()
      .then((res) => {
      setState({
        status: true,
        statusText: res
      })
    })
  });

  const { status, statusText } = state;
  return (
    <Panel>
      <PanelHeader>Clean Up Old Timeline Data</PanelHeader>
      <PanelBody className="flex flex-col gap-2">
        <p>Timeline records older than 60 days will be removed from the database.</p>
        <div className="flex justify-between items-center gap-2">
          <div className="flex-1">
            {status 
              && (<p className="text-yellow-600">{statusText}</p>)
            }
          </div>
          <Button 
            className="py-2 px-4 border-2 border-solid border-transparent"
            buttonType={ButtonType.Primary}
            onClick={handleClearData}
          >
            Clear
          </Button>
        </div>
      </PanelBody>
    </Panel>
  )
}