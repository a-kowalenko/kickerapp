/**
 * Collects detailed device information from the user agent.
 * Used for push notification subscriptions to identify devices.
 *
 * @returns {string} JSON string with device info
 */
export function getDeviceInfo() {
    const ua = navigator.userAgent;
    let deviceType = "desktop";
    let os = "Unknown";
    let osVersion = "";
    let browser = "Unknown";
    let browserVersion = "";
    let deviceModel = "";

    // Detect OS and version
    if (/iPhone/.test(ua)) {
        deviceType = "ios";
        os = "iOS";
        deviceModel = "iPhone";
        const match = ua.match(/iPhone OS (\d+[._]\d+)/);
        if (match) osVersion = match[1].replace("_", ".");
    } else if (/iPad/.test(ua)) {
        deviceType = "ios";
        os = "iPadOS";
        deviceModel = "iPad";
        const match = ua.match(/CPU OS (\d+[._]\d+)/);
        if (match) osVersion = match[1].replace("_", ".");
    } else if (/iPod/.test(ua)) {
        deviceType = "ios";
        os = "iOS";
        deviceModel = "iPod";
        const match = ua.match(/iPhone OS (\d+[._]\d+)/);
        if (match) osVersion = match[1].replace("_", ".");
    } else if (/Android/.test(ua)) {
        deviceType = "android";
        os = "Android";
        const versionMatch = ua.match(/Android (\d+(\.\d+)?)/);
        if (versionMatch) osVersion = versionMatch[1];
        // Try to get device model
        const modelMatch = ua.match(/;\s*([^;)]+)\s*Build/);
        if (modelMatch) deviceModel = modelMatch[1].trim();
    } else if (/Windows NT/.test(ua)) {
        os = "Windows";
        const match = ua.match(/Windows NT (\d+\.\d+)/);
        if (match) {
            const ntVersion = match[1];
            // Map NT version to Windows version
            const versionMap = {
                "10.0": "10/11",
                6.3: "8.1",
                6.2: "8",
                6.1: "7",
            };
            osVersion = versionMap[ntVersion] || ntVersion;
        }
    } else if (/Mac OS X/.test(ua)) {
        os = "macOS";
        const match = ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
        if (match) osVersion = match[1].replace(/_/g, ".");
    } else if (/Linux/.test(ua)) {
        os = "Linux";
    } else if (/CrOS/.test(ua)) {
        os = "Chrome OS";
    }

    // Detect browser and version
    if (/Edg\//.test(ua)) {
        browser = "Edge";
        const match = ua.match(/Edg\/(\d+(\.\d+)?)/);
        if (match) browserVersion = match[1];
    } else if (/OPR\//.test(ua) || /Opera/.test(ua)) {
        browser = "Opera";
        const match = ua.match(/(?:OPR|Opera)\/(\d+(\.\d+)?)/);
        if (match) browserVersion = match[1];
    } else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) {
        browser = "Chrome";
        const match = ua.match(/Chrome\/(\d+(\.\d+)?)/);
        if (match) browserVersion = match[1];
    } else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) {
        browser = "Safari";
        const match = ua.match(/Version\/(\d+(\.\d+)?)/);
        if (match) browserVersion = match[1];
    } else if (/Firefox\//.test(ua)) {
        browser = "Firefox";
        const match = ua.match(/Firefox\/(\d+(\.\d+)?)/);
        if (match) browserVersion = match[1];
    } else if (/MSIE|Trident/.test(ua)) {
        browser = "Internet Explorer";
        const match = ua.match(/(?:MSIE |rv:)(\d+(\.\d+)?)/);
        if (match) browserVersion = match[1];
    } else if (/SamsungBrowser/.test(ua)) {
        browser = "Samsung Internet";
        const match = ua.match(/SamsungBrowser\/(\d+(\.\d+)?)/);
        if (match) browserVersion = match[1];
    }

    return JSON.stringify({
        deviceType,
        os,
        osVersion,
        browser,
        browserVersion,
        deviceModel,
        timestamp: new Date().toISOString(),
    });
}
