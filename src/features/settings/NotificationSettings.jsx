import { useState } from "react";
import styled from "styled-components";
import {
    HiBell,
    HiBellSlash,
    HiDevicePhoneMobile,
    HiChatBubbleLeftRight,
    HiAtSymbol,
    HiUserGroup,
    HiComputerDesktop,
    HiTrash,
    HiBellAlert,
    HiChevronDown,
    HiChevronUp,
} from "react-icons/hi2";
import { useFCMToken } from "../../hooks/useFCMToken";
import { useUser } from "../../features/authentication/useUser";
import SwitchButton from "../../ui/SwitchButton";
import SpinnerMini from "../../ui/SpinnerMini";
import Button from "../../ui/Button";
import { media } from "../../utils/constants";

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
`;

const Section = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
`;

const SectionTitle = styled.h3`
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--primary-text-color);
`;

const StatusCard = styled.div`
    display: flex;
    align-items: center;
    gap: 1.6rem;
    padding: 1.6rem;
    background-color: var(--tertiary-background-color);
    border-radius: var(--border-radius-md);
    border: 1px solid var(--primary-border-color);
`;

const StatusIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4.8rem;
    height: 4.8rem;
    border-radius: 50%;
    background-color: ${(props) =>
        props.$enabled
            ? "var(--color-green-100)"
            : "var(--secondary-background-color)"};
    color: ${(props) =>
        props.$enabled
            ? "var(--color-green-700)"
            : "var(--tertiary-text-color)"};

    & svg {
        font-size: 2.4rem;
    }
`;

const StatusContent = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
`;

const StatusTitle = styled.span`
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--primary-text-color);
`;

const StatusDescription = styled.span`
    font-size: 1.2rem;
    color: var(--secondary-text-color);
`;

const WarningCard = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 1.2rem;
    padding: 1.2rem;
    background-color: rgba(234, 179, 8, 0.1);
    border-radius: var(--border-radius-sm);
    border: 1px solid rgba(234, 179, 8, 0.3);

    & svg {
        font-size: 2rem;
        color: var(--color-yellow-700);
        flex-shrink: 0;
        margin-top: 0.2rem;
    }
`;

const WarningText = styled.span`
    font-size: 1.3rem;
    color: var(--secondary-text-color);
    line-height: 1.5;
`;

const InfoCard = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    padding: 1.2rem;
    background-color: var(--tertiary-background-color);
    border-radius: var(--border-radius-sm);
`;

const InfoText = styled.span`
    font-size: 1.2rem;
    color: var(--secondary-text-color);
    line-height: 1.5;
`;

const ToggleRow = styled.div`
    display: flex;
    align-items: center;
    gap: 1.2rem;
    margin-top: 0.8rem;
`;

const SummaryText = styled.div`
    font-size: 1.3rem;
    color: var(--secondary-text-color);
    padding: 1rem 1.4rem;
    background-color: var(--tertiary-background-color);
    border-radius: var(--border-radius-sm);
    border-left: 3px solid var(--primary-button-color);
`;

const PreferencesSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    padding-left: 1.6rem;
    border-left: 2px solid var(--primary-border-color);
    margin-left: 0.8rem;
    opacity: ${(props) => (props.$disabled ? 0.5 : 1)};
    pointer-events: ${(props) => (props.$disabled ? "none" : "auto")};
`;

const PreferenceItem = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 1.2rem;
    padding: 1.2rem;
    background-color: var(--secondary-background-color);
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--primary-border-color);

    ${media.mobile} {
        flex-direction: column;
    }
`;

const PreferenceIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.6rem;
    height: 3.6rem;
    border-radius: 50%;
    background-color: var(--tertiary-background-color);
    color: var(--primary-button-color);
    flex-shrink: 0;

    & svg {
        font-size: 1.8rem;
    }
`;

const PreferenceContent = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 0;
`;

const PreferenceTitle = styled.span`
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--primary-text-color);
`;

const PreferenceDescription = styled.span`
    font-size: 1.2rem;
    color: var(--secondary-text-color);
`;

const PreferenceToggle = styled.div`
    flex-shrink: 0;

    ${media.mobile} {
        align-self: flex-end;
    }
`;

const DevicesList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
`;

const DeviceCard = styled.div`
    display: flex;
    flex-direction: column;
    background-color: var(--secondary-background-color);
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--primary-border-color);
    overflow: hidden;
    opacity: ${(props) => (props.$disabled ? 0.6 : 1)};
    transition: opacity 0.15s ease;

    ${(props) =>
        props.$isCurrentDevice &&
        !props.$disabled &&
        `
        border-color: var(--primary-button-color);
        background-color: var(--tertiary-background-color);
    `}
`;

const DeviceHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding: 1.2rem;
    cursor: pointer;
    transition: background-color 0.15s ease;

    &:hover {
        background-color: var(--tertiary-background-color);
    }

    ${media.mobile} {
        flex-direction: column;
        align-items: flex-start;
    }
`;

const DeviceIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.6rem;
    height: 3.6rem;
    border-radius: 50%;
    background-color: var(--tertiary-background-color);
    color: ${(props) =>
        props.$disabled
            ? "var(--tertiary-text-color)"
            : "var(--primary-text-color)"};
    flex-shrink: 0;

    & svg {
        font-size: 1.8rem;
    }
`;

const DeviceInfo = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
`;

const DeviceName = styled.span`
    font-size: 1.3rem;
    font-weight: 500;
    color: ${(props) =>
        props.$disabled
            ? "var(--tertiary-text-color)"
            : "var(--primary-text-color)"};
`;

const DeviceDetails = styled.span`
    font-size: 1.1rem;
    color: var(--secondary-text-color);
`;

const CurrentDeviceBadge = styled.span`
    font-size: 1rem;
    color: var(--primary-button-color);
    font-weight: 600;
`;

const DeviceActions = styled.div`
    display: flex;
    gap: 0.8rem;
    flex-shrink: 0;

    ${media.mobile} {
        width: 100%;
        justify-content: flex-end;
    }
`;

const IconButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.2rem;
    height: 3.2rem;
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--primary-border-color);
    background-color: var(--secondary-background-color);
    color: var(--secondary-text-color);
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover:not(:disabled) {
        background-color: ${(props) =>
            props.$variant === "test"
                ? "var(--color-blue-100)"
                : "var(--color-red-100)"};
        border-color: ${(props) =>
            props.$variant === "test"
                ? "var(--color-blue-700)"
                : "var(--color-red-700)"};
        color: ${(props) =>
            props.$variant === "test"
                ? "var(--color-blue-700)"
                : "var(--color-red-700)"};
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    & svg {
        font-size: 1.4rem;
    }
`;

const TestAllButton = styled(Button)`
    margin-top: 0.4rem;
`;

const ExpandIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--secondary-text-color);
    transition: transform 0.2s ease;

    & svg {
        font-size: 1.6rem;
    }
`;

const DevicePreferences = styled.div`
    display: ${(props) => (props.$expanded ? "flex" : "none")};
    flex-direction: column;
    gap: 0.8rem;
    padding: 1.2rem;
    padding-top: 0;
    border-top: 1px solid var(--primary-border-color);
    margin-top: 0;
    padding-top: 1.2rem;
`;

const DevicePreferenceItem = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.6rem 0;
`;

const DevicePreferenceLabel = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    color: var(--secondary-text-color);
    font-size: 1.2rem;

    & svg {
        font-size: 1.4rem;
    }
`;

const PreferenceSummary = styled.div`
    display: flex;
    gap: 0.6rem;
    margin-top: 0.4rem;
    flex-wrap: wrap;
`;

const PreferenceBadge = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 1rem;
    padding: 0.2rem 0.6rem;
    border-radius: 1rem;
    background-color: ${(props) =>
        props.$active
            ? "var(--color-green-100)"
            : "var(--secondary-background-color)"};
    color: ${(props) =>
        props.$active
            ? "var(--color-green-700)"
            : "var(--tertiary-text-color)"};
    border: 1px solid
        ${(props) =>
            props.$active
                ? "var(--color-green-700)"
                : "var(--primary-border-color)"};

    & svg {
        font-size: 1rem;
    }
`;

function parseDeviceInfo(deviceInfoJson) {
    try {
        const info = JSON.parse(deviceInfoJson || "{}");
        return {
            deviceType: info.deviceType || "desktop",
            os: info.os || "Unknown",
            osVersion: info.osVersion || "",
            browser: info.browser || "Unknown",
            browserVersion: info.browserVersion || "",
            deviceModel: info.deviceModel || "",
            timestamp: info.timestamp || null,
        };
    } catch {
        return {
            deviceType: "desktop",
            os: "Unknown",
            osVersion: "",
            browser: "Unknown",
            browserVersion: "",
            deviceModel: "",
            timestamp: null,
        };
    }
}

function formatDeviceName(deviceInfo) {
    const parts = [];

    // Device model if available (e.g., "iPhone", "Samsung Galaxy S21")
    if (deviceInfo.deviceModel) {
        parts.push(deviceInfo.deviceModel);
    }

    // OS with version (e.g., "iOS 17.2", "Windows 10/11", "Android 14")
    let osStr = deviceInfo.os;
    if (deviceInfo.osVersion) {
        osStr += ` ${deviceInfo.osVersion}`;
    }
    parts.push(osStr);

    // Browser with version (e.g., "Chrome 120", "Safari 17.2")
    let browserStr = deviceInfo.browser;
    if (deviceInfo.browserVersion) {
        // Only show major version for cleaner display
        const majorVersion = deviceInfo.browserVersion.split(".")[0];
        browserStr += ` ${majorVersion}`;
    }
    parts.push(browserStr);

    return parts.join(" • ");
}

function formatDate(dateString) {
    if (!dateString) return "";
    try {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch {
        return "";
    }
}

function NotificationSettings() {
    const { user } = useUser();
    const {
        subscriptions,
        currentDeviceSubscription,
        globalNotificationsEnabled,
        hasDevices,
        isLoading,
        isRequesting,
        isSendingTest,
        isSendingToAll,
        testingSubscriptionId,
        notificationStatus,
        enableNotifications,
        setGlobalNotificationsEnabled,
        setDeviceEnabled,
        deleteSubscriptionById,
        updatePreferences,
        sendTestNotification,
        sendTestToAllDevices,
    } = useFCMToken(user?.id);

    // Track which device cards are expanded
    const [expandedDevices, setExpandedDevices] = useState({});

    const isIOS = notificationStatus.isIOS;
    const isPWAInstalled = notificationStatus.isPWA;
    const needsPWAForIOS = isIOS && !isPWAInstalled;

    // Notification permission is blocked - but NOT on iOS (iOS has weird behavior)
    const isBlocked =
        !isIOS &&
        notificationStatus.supported &&
        notificationStatus.permission === "denied";

    const toggleDeviceExpanded = (subscriptionId) => {
        setExpandedDevices((prev) => ({
            ...prev,
            [subscriptionId]: !prev[subscriptionId],
        }));
    };

    const handlePreferenceChange = (subscriptionId, prefKey, value) => {
        updatePreferences({
            subscriptionId,
            notifyAllChat: prefKey === "notify_all_chat" ? value : undefined,
            notifyMentions: prefKey === "notify_mentions" ? value : undefined,
            notifyTeamInvites:
                prefKey === "notify_team_invites" ? value : undefined,
        });
    };

    // Are notifications effectively enabled? (has devices AND global toggle on)
    const isEffectivelyEnabled = hasDevices && globalNotificationsEnabled;

    return (
        <Container>
            <Section>
                <SectionTitle>Push Notifications</SectionTitle>

                {/* Status Card */}
                <StatusCard>
                    <StatusIcon $enabled={isEffectivelyEnabled}>
                        {isEffectivelyEnabled ? <HiBell /> : <HiBellSlash />}
                    </StatusIcon>
                    <StatusContent>
                        <StatusTitle>
                            {!hasDevices
                                ? "No devices registered"
                                : globalNotificationsEnabled
                                ? "Notifications enabled"
                                : "Notifications paused"}
                        </StatusTitle>
                        <StatusDescription>
                            {!hasDevices
                                ? "Add this device to receive push notifications."
                                : globalNotificationsEnabled
                                ? "You will receive push notifications based on your device settings below."
                                : "Notifications are paused for all devices. Toggle on to resume."}
                        </StatusDescription>
                    </StatusContent>
                </StatusCard>

                {/* iOS PWA Warning */}
                {needsPWAForIOS && (
                    <WarningCard>
                        <HiDevicePhoneMobile />
                        <WarningText>
                            <strong>iOS Users:</strong> Push notifications on
                            iOS require the app to be installed on your home
                            screen. Tap the share button in Safari, then
                            &quot;Add to Home Screen&quot; to enable
                            notifications.
                        </WarningText>
                    </WarningCard>
                )}

                {/* Blocked Warning */}
                {isBlocked && (
                    <WarningCard>
                        <HiBellSlash />
                        <WarningText>
                            <strong>Notifications blocked:</strong> You have
                            previously blocked notifications for this site.
                            Please go to your browser settings to allow
                            notifications, then try again.
                        </WarningText>
                    </WarningCard>
                )}

                {/* Global Master Toggle - only show when there are devices */}
                {hasDevices && notificationStatus.supported && (
                    <ToggleRow>
                        {isLoading ? (
                            <SpinnerMini />
                        ) : (
                            <SwitchButton
                                label={
                                    globalNotificationsEnabled
                                        ? "All notifications enabled"
                                        : "All notifications paused"
                                }
                                value={globalNotificationsEnabled}
                                onChange={(newValue) => {
                                    setGlobalNotificationsEnabled(newValue);
                                }}
                                disabled={isLoading}
                            />
                        )}
                    </ToggleRow>
                )}

                {/* Add Device Button - only show when current device is NOT registered */}
                {notificationStatus.supported &&
                    !needsPWAForIOS &&
                    !isBlocked &&
                    !currentDeviceSubscription && (
                        <Button
                            $variation="secondary"
                            onClick={enableNotifications}
                            disabled={isLoading || isRequesting}
                        >
                            {isRequesting ? (
                                <>
                                    <SpinnerMini /> Registering...
                                </>
                            ) : hasDevices ? (
                                "Add This Device"
                            ) : (
                                "Enable Notifications"
                            )}
                        </Button>
                    )}
            </Section>

            {/* Registered Devices */}
            {hasDevices && subscriptions?.length > 0 && (
                <Section>
                    <SectionTitle>Registered Devices</SectionTitle>
                    <DevicesList>
                        {subscriptions.map((subscription) => {
                            const deviceInfo = parseDeviceInfo(
                                subscription.device_info
                            );
                            const isCurrentDevice =
                                currentDeviceSubscription?.id ===
                                subscription.id;
                            const isTestingThisDevice =
                                testingSubscriptionId === subscription.id;
                            const isDeviceEnabled =
                                subscription.enabled !== false;

                            const isExpanded =
                                expandedDevices[subscription.id] || false;

                            return (
                                <DeviceCard
                                    key={subscription.id}
                                    $isCurrentDevice={isCurrentDevice}
                                    $disabled={!isDeviceEnabled}
                                >
                                    <DeviceHeader
                                        onClick={() =>
                                            toggleDeviceExpanded(
                                                subscription.id
                                            )
                                        }
                                    >
                                        <DeviceIcon
                                            $disabled={!isDeviceEnabled}
                                        >
                                            {deviceInfo.deviceType ===
                                            "desktop" ? (
                                                <HiComputerDesktop />
                                            ) : (
                                                <HiDevicePhoneMobile />
                                            )}
                                        </DeviceIcon>
                                        <DeviceInfo>
                                            <DeviceName
                                                $disabled={!isDeviceEnabled}
                                            >
                                                {formatDeviceName(deviceInfo)}
                                                {!isDeviceEnabled &&
                                                    " (paused)"}
                                            </DeviceName>
                                            <DeviceDetails>
                                                Registered{" "}
                                                {formatDate(
                                                    subscription.created_at
                                                )}
                                            </DeviceDetails>
                                            {isCurrentDevice && (
                                                <CurrentDeviceBadge>
                                                    Current device
                                                </CurrentDeviceBadge>
                                            )}
                                            {!isExpanded && isDeviceEnabled && (
                                                <PreferenceSummary>
                                                    <PreferenceBadge
                                                        $active={
                                                            subscription.notify_all_chat
                                                        }
                                                    >
                                                        <HiChatBubbleLeftRight />
                                                        Chat
                                                    </PreferenceBadge>
                                                    <PreferenceBadge
                                                        $active={
                                                            subscription.notify_mentions
                                                        }
                                                    >
                                                        <HiAtSymbol />
                                                        Mentions
                                                    </PreferenceBadge>
                                                    <PreferenceBadge
                                                        $active={
                                                            subscription.notify_team_invites
                                                        }
                                                    >
                                                        <HiUserGroup />
                                                        Teams
                                                    </PreferenceBadge>
                                                </PreferenceSummary>
                                            )}
                                        </DeviceInfo>
                                        <DeviceActions
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <IconButton
                                                $variant="test"
                                                onClick={() =>
                                                    sendTestNotification(
                                                        subscription.id
                                                    )
                                                }
                                                disabled={
                                                    isLoading ||
                                                    isSendingTest ||
                                                    isSendingToAll ||
                                                    !isDeviceEnabled
                                                }
                                                title="Send test notification to this device"
                                            >
                                                {isTestingThisDevice ? (
                                                    <SpinnerMini />
                                                ) : (
                                                    <HiBellAlert />
                                                )}
                                            </IconButton>
                                            <IconButton
                                                onClick={() =>
                                                    deleteSubscriptionById(
                                                        subscription.id
                                                    )
                                                }
                                                disabled={isLoading}
                                                title="Remove device"
                                            >
                                                <HiTrash />
                                            </IconButton>
                                        </DeviceActions>
                                        <ExpandIcon>
                                            {isExpanded ? (
                                                <HiChevronUp />
                                            ) : (
                                                <HiChevronDown />
                                            )}
                                        </ExpandIcon>
                                    </DeviceHeader>

                                    <DevicePreferences $expanded={isExpanded}>
                                        {/* Device Master Toggle */}
                                        <DevicePreferenceItem
                                            style={{
                                                borderBottom:
                                                    "1px solid var(--primary-border-color)",
                                                paddingBottom: "1rem",
                                                marginBottom: "0.4rem",
                                            }}
                                        >
                                            <DevicePreferenceLabel
                                                style={{ fontWeight: 600 }}
                                            >
                                                <HiBell />
                                                Enable notifications
                                            </DevicePreferenceLabel>
                                            <SwitchButton
                                                value={isDeviceEnabled}
                                                onChange={(val) =>
                                                    setDeviceEnabled({
                                                        subscriptionId:
                                                            subscription.id,
                                                        enabled: val,
                                                    })
                                                }
                                                disabled={isLoading}
                                            />
                                        </DevicePreferenceItem>

                                        <DevicePreferenceItem>
                                            <DevicePreferenceLabel>
                                                <HiChatBubbleLeftRight />
                                                All Chat Messages
                                            </DevicePreferenceLabel>
                                            <SwitchButton
                                                value={
                                                    subscription.notify_all_chat
                                                }
                                                onChange={(val) =>
                                                    handlePreferenceChange(
                                                        subscription.id,
                                                        "notify_all_chat",
                                                        val
                                                    )
                                                }
                                                disabled={
                                                    isLoading ||
                                                    !isDeviceEnabled
                                                }
                                            />
                                        </DevicePreferenceItem>
                                        <DevicePreferenceItem>
                                            <DevicePreferenceLabel>
                                                <HiAtSymbol />
                                                Mentions (@name, @everyone)
                                            </DevicePreferenceLabel>
                                            <SwitchButton
                                                value={
                                                    subscription.notify_mentions
                                                }
                                                onChange={(val) =>
                                                    handlePreferenceChange(
                                                        subscription.id,
                                                        "notify_mentions",
                                                        val
                                                    )
                                                }
                                                disabled={
                                                    isLoading ||
                                                    !isDeviceEnabled
                                                }
                                            />
                                        </DevicePreferenceItem>
                                        <DevicePreferenceItem>
                                            <DevicePreferenceLabel>
                                                <HiUserGroup />
                                                Team Invitations
                                            </DevicePreferenceLabel>
                                            <SwitchButton
                                                value={
                                                    subscription.notify_team_invites
                                                }
                                                onChange={(val) =>
                                                    handlePreferenceChange(
                                                        subscription.id,
                                                        "notify_team_invites",
                                                        val
                                                    )
                                                }
                                                disabled={
                                                    isLoading ||
                                                    !isDeviceEnabled
                                                }
                                            />
                                        </DevicePreferenceItem>
                                    </DevicePreferences>
                                </DeviceCard>
                            );
                        })}
                    </DevicesList>

                    {/* Send Test to All Devices Button */}
                    {subscriptions.length > 1 && (
                        <TestAllButton
                            $variation="secondary"
                            onClick={sendTestToAllDevices}
                            disabled={
                                isSendingTest || isSendingToAll || isLoading
                            }
                        >
                            {isSendingToAll ? (
                                <>
                                    <SpinnerMini /> Sending...
                                </>
                            ) : (
                                `Send Test to All ${subscriptions.length} Devices`
                            )}
                        </TestAllButton>
                    )}
                </Section>
            )}
        </Container>
    );
}

export default NotificationSettings;
