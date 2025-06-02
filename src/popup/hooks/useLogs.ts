import * as React from "react";
import { getLogs } from "../../background/tables/logs";
import { LogMessage } from "../../shared/db/types";

export const useLogs = () => {
  const [logs, setLogs] = React.useState<LogMessage[] | []>();

  React.useEffect(() => {
    (async function (){
      const dbLogs = await getLogs()
      setLogs(dbLogs);
    })();
  }, []);

  return [logs, setLogs] as const;
}