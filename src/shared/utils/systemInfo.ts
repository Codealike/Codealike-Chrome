// Interface for the collected system information.
 
export interface SystemSummary {
    availableMemoryGB: string;
    chromeVersion: string;
    cpuArchitecture: string;
    cpuCores: number;
    cpuType: string;
    extensionVersion: string;
    language: string;
    osType: string;
    osVersion: string;
    timestamp: string;
    totalMemoryGB: string;
    usedMemoryGB: string;
    userAgent: string;
}

/**
 * Extracts OS type and a basic version from navigator.platform/appVersion fallback.
 * This is used when userAgentData is not available or fails.
 */
function getOsInfoFromLegacyNavigator(): Partial<SystemSummary> {
    const osInfo: Partial<SystemSummary> = { // Initialize all expected properties with defaults
        cpuArchitecture: 'N/A',
        osType: 'N/A',
        osVersion: 'N/A',
    };
    const platform = navigator.platform || 'N/A';

    if (platform.toLowerCase().includes('win')) {
        osInfo.osType = 'Windows';
        osInfo.osVersion = navigator.appVersion.match(/Windows NT ([\d.]+)/)?.[1] || 'N/A';
    } else if (platform.toLowerCase().includes('mac')) {
        osInfo.osType = 'macOS';
        osInfo.osVersion = navigator.appVersion.match(/Mac OS X ([\d_.]+)/)?.[1]?.replace(/_/g, '.') || 'N/A';
    } else if (platform.toLowerCase().includes('linux')) {
        osInfo.osType = 'Linux';
    }
    return osInfo;
}

/**
 * Collects OS type, version, and architecture using navigator APIs.
 * This function handles the primary logic, delegating fallback to a smaller function.
 * @returns An object containing OS info. All properties guaranteed to be string, not undefined.
 */
async function getOsInfo(): Promise<Partial<SystemSummary>> {
    // Assert navigator to 'any' or a custom type that includes userAgentData
    const nav: any = navigator;

    if (nav.userAgentData) {
        try {
            const uaData = await nav.userAgentData.getHighEntropyValues(["platformVersion", "architecture"]);
            return {
                cpuArchitecture: uaData.architecture || 'N/A',
                osType: uaData.platform || 'N/A',
                osVersion: uaData.platformVersion || 'N/A',
            };
        } catch (e) {
            console.warn("Failed to get high-entropy user agent data, falling back:", e);
            return getOsInfoFromLegacyNavigator(); // This now returns guaranteed strings
        }
    } else {
        return getOsInfoFromLegacyNavigator(); // This now returns guaranteed strings
    }
}

/**
 * Collects CPU information using chrome.system.cpu API.
 * @returns An object containing CPU info. All properties guaranteed to be string/number, not undefined.
 */
async function getCpuDetails(): Promise<Partial<SystemSummary>> {
    const cpuDetails: Partial<SystemSummary> = { // Initialize all expected properties with defaults
        cpuArchitecture: 'N/A',
        cpuCores: 0,
        cpuType: 'N/A',
    };
    try {
        const cpuInfo = await chrome.system.cpu.getInfo();
        cpuDetails.cpuArchitecture = cpuInfo.archName || 'N/A';
        cpuDetails.cpuCores = cpuInfo.numOfProcessors || 0;
        cpuDetails.cpuType = cpuInfo.modelName || 'N/A';
    } catch (e) {
        console.warn("Could not get CPU info:", e);
    }
    return cpuDetails;
}

/**
 * Collects Memory information using chrome.system.memory API.
 * @returns An object containing Memory info (total, available, and calculated used). All properties guaranteed to be string, not undefined.
 */
async function getMemoryDetails(): Promise<Partial<SystemSummary>> {
    const memDetails: Partial<SystemSummary> = { // Initialize all expected properties with defaults
        availableMemoryGB: 'N/A',
        totalMemoryGB: 'N/A',
        usedMemoryGB: 'N/A',
    };
    try {
        const memoryInfo = await chrome.system.memory.getInfo();
        const totalGB = (memoryInfo.capacity / (1024 * 1024 * 1024)).toFixed(2);
        const availableGB = (memoryInfo.availableCapacity / (1024 * 1024 * 1024)).toFixed(2);

        memDetails.availableMemoryGB = `${availableGB} GB`;
        memDetails.totalMemoryGB = `${totalGB} GB`;

        const total = parseFloat(totalGB);
        const available = parseFloat(availableGB);
        if (!isNaN(total) && !isNaN(available)) {
            memDetails.usedMemoryGB = (total - available).toFixed(2) + ' GB';
        } else {
            memDetails.usedMemoryGB = 'N/A'; // Explicitly set to 'N/A' if calculation fails
        }

    } catch (e) {
        console.warn("Could not get Memory info:", e);
    }
    return memDetails;
}

// Collects basic browser/extension information.

function getBaseBrowserInfo(): Partial<SystemSummary> {
    return {
        chromeVersion: navigator.appVersion.match(/Chrome\/(.*?)\s/)?.[1] || 'N/A',
        extensionVersion: chrome.runtime.getManifest().version || 'N/A', // Add N/A fallback for manifest version as well for robustness
        language: navigator.language || 'N/A',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent || 'N/A',
    };
}



function finalizeSystemSummary(
    baseInfo: Partial<SystemSummary>,
    osInfo: Partial<SystemSummary>,
    cpuDetails: Partial<SystemSummary>,
    memoryDetails: Partial<SystemSummary>
): SystemSummary {

    return {
        availableMemoryGB: memoryDetails.availableMemoryGB as string,
        chromeVersion: baseInfo.chromeVersion as string,
        //cpuArchitecture: Prioritize userAgentData.architecture if available, else cpuInfo.archName
        cpuArchitecture: (osInfo.cpuArchitecture || cpuDetails.cpuArchitecture) as string,
        cpuCores: cpuDetails.cpuCores as number,
        cpuType: cpuDetails.cpuType as string,
        extensionVersion: baseInfo.extensionVersion as string,
        language: baseInfo.language as string,
        osType: osInfo.osType as string,
        osVersion: osInfo.osVersion as string,
        timestamp: baseInfo.timestamp as string,
        totalMemoryGB: memoryDetails.totalMemoryGB as string,
        usedMemoryGB: memoryDetails.usedMemoryGB as string,
        userAgent: baseInfo.userAgent as string,
    };
}


// Collects various system and browser information.
export async function getSystemSummary(): Promise<SystemSummary> {
    const [
        baseSummary,
        osInfo,
        cpuDetails,
        memoryDetails
    ] = await Promise.all([
        getBaseBrowserInfo(),
        getOsInfo(),
        getCpuDetails(),
        getMemoryDetails()
    ]);

    return finalizeSystemSummary(baseSummary, osInfo, cpuDetails, memoryDetails);
}

// Formats the SystemSummary object into a human-readable string.
export function formatSystemSummary(summary: SystemSummary): string {
    return `--- System Information ---
Available Memory: ${summary.availableMemoryGB}
Chrome Version: ${summary.chromeVersion}
CPU Architecture: ${summary.cpuArchitecture}
CPU Cores: ${summary.cpuCores}
CPU Type: ${summary.cpuType}
Codealike Extension Version: ${summary.extensionVersion}
Language: ${summary.language}
OS Type: ${summary.osType}
OS Version: ${summary.osVersion}
Timestamp: ${summary.timestamp}
Total Memory: ${summary.totalMemoryGB}
Used Memory: ${summary.usedMemoryGB}
User Agent: ${summary.userAgent}
--- End System Information ---\n\n`;
}