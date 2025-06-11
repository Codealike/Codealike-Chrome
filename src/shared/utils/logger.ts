const LOG_STORAGE_KEY = 'extension_logs';
const MAX_LOG_ENTRIES = 1000;

// Defines the structure of a single log entry.
interface LogEntry {
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
    message: string;
    context ? : object; 
}

/**
 * @param level - The log level ('INFO', 'WARN', 'ERROR', 'DEBUG').
 * @param message - The log message.
 * @param context - Optional context object to store with the log.
 */
async function addLog(level: LogEntry['level'], message: string, context ? : object): Promise < void > {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      context,
      level,
      message,
      timestamp,
    };

    try {
        const result = await chrome.storage.local.get(LOG_STORAGE_KEY);
        let logs: LogEntry[] = result[LOG_STORAGE_KEY] || [];

        logs.push(logEntry);

        if (logs.length > MAX_LOG_ENTRIES) {
            logs = logs.slice(logs.length - MAX_LOG_ENTRIES);
        }

        await chrome.storage.local.set({
            [LOG_STORAGE_KEY]: logs
        });
        console.log(`[${level}] ${message}`); // console.log for immediate visibility
    } catch (error) {
        console.error("Error adding log to storage:", error);
    }
}

/**
 * Retrieves all stored logs from chrome.storage.local.
 * @returns A promise that resolves with an array of log entries.
 */
async function getLogs(): Promise < LogEntry[] > {
    try {
        const result = await chrome.storage.local.get(LOG_STORAGE_KEY);
        return result[LOG_STORAGE_KEY] || [];
    } catch (error) {
        console.error("Error retrieving logs from storage:", error);
        return [];
    }
}

/**
 * Clears all stored logs from chrome.storage.local.
 */
async function clearLogs(): Promise < void > {
    try {
        await chrome.storage.local.remove(LOG_STORAGE_KEY);
        console.log("Logs cleared from storage.");
    } catch (error) {
        console.error("Error clearing logs from storage:", error);
    }
}

/**
 * Formats logs into a readable string and initiates a download.
 * @param filename - The desired filename for the downloaded log file (e.g., "extension_logs.txt").
 */
async function downloadLogs(filename = 'extension_logs.txt'): Promise < void > {
    try {
        const logs = await getLogs();
        if (logs.length === 0) {
            console.warn("No logs to download.");
            alert("No logs available to download!"); // Inform the user
            return;
        }

        // Format logs into a plain text string
        const formattedLogs = logs.map(log => {
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

        const blob = new Blob([formattedLogs], {
            type: 'text/plain'
        });
        const url = URL.createObjectURL(blob);

        chrome.downloads.download({
            filename: filename,
            saveAs: true,
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

    } catch (error) {
        console.error("Error preparing or initiating log download:", error);
        alert("An error occurred while preparing logs for download.");
    }
}

/**
 * Logger interface to define the public API.
 */
interface LoggerAPI {
    info(message: string, context ? : object): Promise < void > ;
    warn(message: string, context ? : object): Promise < void > ;
    error(message: string, context ? : object): Promise < void > ;
    debug(message: string, context ? : object): Promise < void > ;
    get(): Promise < LogEntry[] > ;
    clear(): Promise < void > ;
    download(filename ? : string): Promise < void > ;
}

export const Logger: LoggerAPI = {
    clear: clearLogs,
    debug: (message, context) => addLog('DEBUG', message, context),
    download: downloadLogs,
    error: (message, context) => addLog('ERROR', message, context),
    get: getLogs,
    info: (message, context) => addLog('INFO', message, context),
    warn: (message, context) => addLog('WARN', message, context),
};

// For environments where `Logger` needs to be globally accessible (e.g., background service worker)
// In a typical modern TypeScript setup, you'd prefer to import `Logger` directly.
// This global assignment is mostly for compatibility with direct script inclusion in manifest.json,
// or if you're using a bundler that outputs to a single file.
declare global {
    interface Window {
        Logger: LoggerAPI;
    }
    let Logger: LoggerAPI;
}

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL('').startsWith('chrome-extension://')) {
    // This check helps ensure we're in a Chrome extension environment
    if (typeof self !== 'undefined' && self.ServiceWorker) {
        // This is a service worker (Manifest V3 background script)
        self.Logger = Logger;
    } else if (typeof window !== 'undefined') {
        // This is a traditional background page (Manifest V2) or other script context
        window.Logger = Logger;
    }
}