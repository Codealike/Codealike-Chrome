import { Preferences,LogEntry } from '../../shared/db/types';
import { getSettings } from '../../shared/preferences';

const LOG_STORAGE_KEY = 'codealike_extension_logs';
const MAX_LOG_ENTRIES = 1000;

// Defines the structure of a single log entry.

interface LoggerAPI {
    info(source: string, message: string, context ? : object): Promise < void > ;
    warn(source: string, message: string, context ? : object): Promise < void > ;
    error(source: string, message: string, context ? : object): Promise < void > ;
    debug(source: string, message: string, context ? : object): Promise < void > ;
    get(): Promise < LogEntry[] > ;
    clear(): Promise < void > ;
}

// In-memory cache for preferences
let _cachedPreferences: Preferences | null = null;
let _cacheTimestamp: number | null = null;
const CACHE_EXPIRATION_MS = 5 * 1000; // 5 seconds in milliseconds 

 async function _getPreferences(): Promise<Preferences> {
    const now = Date.now();

    // Check if cache exists and is not expired
    if (_cachedPreferences && _cacheTimestamp && (now - _cacheTimestamp < CACHE_EXPIRATION_MS)) {
        console.log("Returning settings from cache.");
        return _cachedPreferences;
    }

    console.log("Cache expired or not present, fetching settings from storage.");
    try {
        const fetchedPreferences = await getSettings();
        _cachedPreferences = fetchedPreferences;
        _cacheTimestamp = now; // Update timestamp when new data is fetched
        return fetchedPreferences;
    } catch (error) {
        console.log("Failed to fetch preferences from storage. Returning potentially stale cache or defaults.", error);
        // In case of error, return cached preferences if they exist, even if expired
        // This provides a fallback for resilience, but cacheTimestamp is still updated.
        if (_cachedPreferences) {
            return _cachedPreferences;
        }
        // If no cache and error, getSettingsFromStorage handles returning defaults.
         throw error; // Re-throw if getSettingsFromStorage propagates error
    } 
}

/**
 * @param level - The log level ('INFO', 'WARN', 'ERROR', 'DEBUG').
 * @param message - The log message.
 * @param context - Optional context object to store with the log.
 */
async function addLog(level: LogEntry['level'],  source: string, message: string, context ? : object): Promise < void > {
    const preferences: Preferences = await getSettings();
    if(preferences.enableLogging!==true){
        return ;
    }
    
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      context,
      level,
      message,
      source,
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
        console.log(`${timestamp} [${level}] ${message}`); // console.log for immediate visibility
    } catch (error) {
        console.error("Error adding log to storage:", error);
    }
}

// Retrieves all stored logs from chrome.storage.local.
async function getLogs(): Promise < LogEntry[] > {
    try {
        const result = await chrome.storage.local.get(LOG_STORAGE_KEY);
        return result[LOG_STORAGE_KEY] || [];
    } catch (error) {
        console.error("Error retrieving logs from storage:", error);
        return [];
    }
}

// Clears all stored logs from chrome.storage.local.
async function clearLogs(): Promise < void > {
    try {
        const result1 = await chrome.storage.local.get(LOG_STORAGE_KEY);
        console.log("Before clear logs ", result1)
        await chrome.storage.local.set({
            [LOG_STORAGE_KEY]: []
        });
        await chrome.storage.local.remove(LOG_STORAGE_KEY);
        console.log("Logs cleared from storage.");
    } catch (error) {
        console.error("Error clearing logs from storage:", error);
    }
}



export const Logger: LoggerAPI = {
    clear: clearLogs,
    debug: (source, message, context) => addLog('DEBUG', source, message, context),
    error: (source, message, context) => addLog('ERROR', source, message, context),
    get: getLogs,
    info: (source, message, context) => addLog('INFO', source, message, context),
    warn: (source, message, context) => addLog('WARN', source, message, context),
};

// For environments where `Logger` needs to be globally accessible (e.g., background service worker)
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
        // This is a traditional background page (Manifest V2) 
        window.Logger = Logger;
    }
}