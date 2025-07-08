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
 * Fallback to get OS info from userAgent string parsing.
 * Handles Windows, macOS, Linux.
 */
function getOsInfoFromLegacyNavigator(): Partial<SystemSummary> {
    const osInfo: Partial<SystemSummary> = {
        cpuArchitecture: "N/A",
        osType: "N/A",
        osVersion: "N/A",
    };

    const userAgent = navigator.userAgent || "";
    const platform = navigator.platform || "";

    if (/Windows NT (\d+\.\d+)/.test(userAgent)) {
        osInfo.osType = "Windows";
        osInfo.osVersion = userAgent.match(/Windows NT (\d+\.\d+)/)?.[1] ?? "N/A";
    } else if (/Mac OS X (\d+(?:[_.]\d+)+)/.test(userAgent)) {
        osInfo.osType = "macOS";
        osInfo.osVersion =
            userAgent.match(/Mac OS X (\d+(?:[_.]\d+)+)/)?.[1]?.replace(/_/g, ".") ?? "N/A";
    } else if (/Linux/.test(platform) || /Linux/.test(userAgent)) {
        osInfo.osType = "Linux";
        osInfo.osVersion = "N/A";
    } else {
        osInfo.osType = platform || "Unknown";
    }

    osInfo.cpuArchitecture = "N/A"; // No reliable fallback for architecture here

    return osInfo;
}

interface UserAgentData {
    getHighEntropyValues(
        hints: string[]
    ): Promise<{ platformVersion?: string; architecture?: string; platform?: string }>;
    platform?: string;
    brands?: Array<{ brand: string; version: string }>;
}

interface NavigatorWithUAData extends Navigator {
    userAgentData?: UserAgentData;
}

async function getOsInfo(): Promise<Partial<SystemSummary>> {
    const nav = navigator as NavigatorWithUAData;

    if (nav.userAgentData) {
        try {
            const uaData = await nav.userAgentData.getHighEntropyValues([
                "platformVersion",
                "architecture",
                "platform",
            ]);
            return {
                cpuArchitecture: uaData.architecture ?? "N/A",
                osType: uaData.platform ?? "N/A",
                osVersion: uaData.platformVersion ?? "N/A",
            };
        } catch (e) {
            console.warn("Failed to get high-entropy user agent data, falling back:", e);
            return getOsInfoFromLegacyNavigator();
        }
    } else {
        return getOsInfoFromLegacyNavigator();
    }
}

async function getCpuDetails(): Promise<Partial<SystemSummary>> {
    const cpuDetails: Partial<SystemSummary> = {
        cpuArchitecture: "N/A",
        cpuCores: 0,
        cpuType: "N/A",
    };
    try {
        if (chrome?.system?.cpu?.getInfo) {
            const cpuInfo = await chrome.system.cpu.getInfo();
            cpuDetails.cpuArchitecture = cpuInfo.archName || "N/A";
            cpuDetails.cpuCores = cpuInfo.numOfProcessors || 0;
            cpuDetails.cpuType = cpuInfo.modelName || "N/A";
        }
    } catch (e) {
        console.warn("Could not get CPU info:", e);
    }
    return cpuDetails;
}

async function getMemoryDetails(): Promise<Partial<SystemSummary>> {
    const memDetails: Partial<SystemSummary> = {
        availableMemoryGB: "N/A",
        totalMemoryGB: "N/A",
        usedMemoryGB: "N/A",
    };
    try {
        if (chrome?.system?.memory?.getInfo) {
            const memoryInfo = await chrome.system.memory.getInfo();
            const totalGB = (memoryInfo.capacity / (1024 ** 3)).toFixed(2);
            const availableGB = (memoryInfo.availableCapacity / (1024 ** 3)).toFixed(2);

            memDetails.availableMemoryGB = `${availableGB} GB`;
            memDetails.totalMemoryGB = `${totalGB} GB`;

            const total = parseFloat(totalGB);
            const available = parseFloat(availableGB);
            memDetails.usedMemoryGB = !isNaN(total) && !isNaN(available)
                ? `${(total - available).toFixed(2)} GB`
                : "N/A";
        }
    } catch (e) {
        console.warn("Could not get Memory info:", e);
    }
    return memDetails;
}

function getBaseBrowserInfo(): Partial<SystemSummary> {
    return {
        chromeVersion: navigator.userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/)?.[1] || "N/A",
        extensionVersion: chrome.runtime.getManifest()?.version || "N/A",
        language: navigator.language || "N/A",
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent || "N/A",
    };
}

function getOrDefault<T>(...values: (T | undefined)[]): T {
    for (const v of values) {
        if (v !== undefined && v !== null) return v;
    }
    throw new Error("No value provided.");
}

function finalizeSystemSummary(
    baseInfo: Partial<SystemSummary>,
    osInfo: Partial<SystemSummary>,
    cpuDetails: Partial<SystemSummary>,
    memoryDetails: Partial<SystemSummary>
): SystemSummary {
    return {
        availableMemoryGB: getOrDefault(memoryDetails.availableMemoryGB, "N/A"),
        chromeVersion: getOrDefault(baseInfo.chromeVersion, "N/A"),
        cpuArchitecture: getOrDefault(osInfo.cpuArchitecture, cpuDetails.cpuArchitecture, "N/A"),
        cpuCores: getOrDefault(cpuDetails.cpuCores, 0),
        cpuType: getOrDefault(cpuDetails.cpuType, "N/A"),
        extensionVersion: getOrDefault(baseInfo.extensionVersion, "N/A"),
        language: getOrDefault(baseInfo.language, "N/A"),
        osType: getOrDefault(osInfo.osType, "N/A"),
        osVersion: getOrDefault(osInfo.osVersion, "N/A"),
        timestamp: getOrDefault(baseInfo.timestamp, new Date().toISOString()),
        totalMemoryGB: getOrDefault(memoryDetails.totalMemoryGB, "N/A"),
        usedMemoryGB: getOrDefault(memoryDetails.usedMemoryGB, "N/A"),
        userAgent: getOrDefault(baseInfo.userAgent, "N/A"),
    };
}

export async function getSystemSummary(): Promise<SystemSummary> {
    const [baseSummary, osInfo, cpuDetails, memoryDetails] = await Promise.all([
        Promise.resolve(getBaseBrowserInfo()), // already synchronous
        getOsInfo(),
        getCpuDetails(),
        getMemoryDetails(),
    ]);

    return finalizeSystemSummary(baseSummary, osInfo, cpuDetails, memoryDetails);
}

export function formatSystemSummary(summary: SystemSummary): string {
    return `--- System Information ---
Available Memory: ${summary.availableMemoryGB}
Chrome Version: ${summary.chromeVersion}
CPU Architecture: ${summary.cpuArchitecture}
CPU Cores: ${summary.cpuCores}
CPU Type: ${summary.cpuType}
Extension Version: ${summary.extensionVersion}
Language: ${summary.language}
OS Type: ${summary.osType}
OS Version: ${summary.osVersion}
Timestamp: ${summary.timestamp}
Total Memory: ${summary.totalMemoryGB}
Used Memory: ${summary.usedMemoryGB}
User Agent: ${summary.userAgent}
--- End System Information ---\n\n`;
}