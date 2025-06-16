import * as React from "react"
import { Panel, PanelBody, PanelHeader } from "../../../blocks/Panel"
import { usePopupContext } from "../../hooks/PopupContext"
import { Checkbox } from '../../../blocks/Input';
import { Button, ButtonType } from "../../../blocks/Button";
import { getSystemSummary, formatSystemSummary, SystemSummary } from '../../../shared/utils/systemInfo';

// Define LogEntry interface (can be imported from a shared types file if you have one)
interface LogEntry {
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
    message: string;
    context ? : object;
}
export const Logger: React.FC = () => {
    const { settings, updateSettings } = usePopupContext();
    const [isEnableLoggingChecked, setIsEnableLoggingChecked] = React.useState<boolean>(settings.enableLogging);
    const [_logs, setLogs] = React.useState < LogEntry[] > ([]);
    const [_isLoading, setIsLoading] = React.useState<boolean>(true); // For initial loading state
    
    // Function to fetch and display recent logs
    const fetchAndDisplayRecentLogs = async () => {
        setIsLoading(true);
        try {
            // Send a message to the background script to get logs
            // Ensure Logger is defined before calling its methods
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                const fetchedLogs: LogEntry[] = await chrome.runtime.sendMessage({
                    action: "getLogs"
                });
                setLogs(fetchedLogs);
            } else {
                console.error("Chrome runtime or Logger not available in popup context.");
                setLogs([]);
            }
        } catch (error) {
            console.error("Error fetching logs:", error);
            setLogs([]);
        } finally {
            setIsLoading(false);
        }
    };

    // useEffect hook to run on component mount (equivalent to DOMContentLoaded)
    React.useEffect(() => {
        fetchAndDisplayRecentLogs();
    }, []); // Empty dependency array means it runs once on mount

    const handleEnableLogger = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsEnableLoggingChecked(e.target.checked);
        updateSettings({
          enableLogging: e.target.checked,
        });
      },
      [setIsEnableLoggingChecked, updateSettings]
    );

    const handleDownloadLogs = async () => {
      let systemInfoString = '';
       try {
            const summary: SystemSummary = await getSystemSummary();
            systemInfoString = formatSystemSummary(summary);
            console.log("Collected System Summary:", summary);
        } catch (error) {
            console.error("Failed to collect system summary:", error);
            systemInfoString = "--- System Information (Failed to collect) ---\n\n";
        }

        // Fetch logs directly from the background script
        const logsToDownload: LogEntry[] = await chrome.runtime.sendMessage({
            action: "getLogs"
        });

        if (logsToDownload.length === 0) {
            alert("No logs available to download!");
            return;
        }

        // Format logs into a plain text string
        const formattedLogs = logsToDownload.map(log => {
            let contextStr = '';
            if (log.context && Object.keys(log.context).length > 0) {
                try {
                    contextStr = ` - Context: ${JSON.stringify(log.context)}`;
                } catch (e) {
                    contextStr = ` - Context: [Serialization Error]`;
                }
            }
            return `${log.timestamp} [${log.level}] ${log.message}${contextStr}`;
        }).join('\n');
        const fullLogContent = systemInfoString + formattedLogs;

        const blob = new Blob([fullLogContent], {
            type: 'text/plain'
        });
        const url = URL.createObjectURL(blob); // This will now work in the popup context

        const filename = `codealike_extension_logs_${new Date().toISOString().replace(/:/g, '-').replace(/\./g, '_')}.txt`;

        chrome.downloads.download({
            filename: filename,
            saveAs: true, // Prompts the user to choose a save location
            url: url,
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                console.error("Download failed:", chrome.runtime.lastError.message);
                alert("Failed to initiate log download. Please check console for details.");
            } else {
                console.log(`Download initiated with ID: ${downloadId}`);
            }
            URL.revokeObjectURL(url); // Clean up the object URL
        });
    };

    const handleClearLogs = async () => {
        if (confirm("Are you sure you want to clear all logs?")) {
            // Send a message to the background script to clear logs
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                await chrome.runtime.sendMessage({
                    action: "clearLogs"
                });
                alert("Logs cleared!");
                fetchAndDisplayRecentLogs(); // Refresh log display
            }
        }
    };


  return (
    <Panel>
      <PanelHeader>Debug Logs</PanelHeader>
      <PanelBody>
        <div className="flex gap-6 pb-2">
            <div className="flex">
                <label className="flex items-center cursor-pointer">
                      <Checkbox
                        className="mr-2"
                        checked={isEnableLoggingChecked}
                        onChange={handleEnableLogger}
                      />
                      <span>Enable Logging</span>
                    </label>
            </div>
            {isEnableLoggingChecked && 
                <div className="flex">
                    <Button
                        className="h-fit py-2 px-4 border-2 border-solid border-transparent"
                        buttonType={ButtonType.Primary}
                        onClick={handleDownloadLogs}
                    >
                        Download Logs
                    </Button>
                    <Button
                        className="h-fit py-2 ml-2 px-4 border-2 border-solid border-transparent"
                        buttonType={ButtonType.Secondary}
                        onClick={handleClearLogs}
                    >
                    Clear Logs
                    </Button>
            </div>
          }
          
        </div>
      </PanelBody>
    </Panel>
  )
}