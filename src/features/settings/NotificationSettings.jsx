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
    align-items: center;
    gap: 1.2rem;
    padding: 1.2rem;
    background-color: var(--secondary-background-color);
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--primary-border-color);

    ${(props) =>
        props.$isCurrentDevice &&
        `
        border-color: var(--primary-button-color);
        background-color: var(--tertiary-background-color);
    `}

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
    color: var(--primary-text-color);
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
    color: var(--primary-text-color);
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
        background-color: var(--color-red-100);
        border-color: var(--color-red-700);
        color: var(--color-red-700);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    & svg {
        font-size: 1.4rem;
    }
`;

function parseDeviceInfo(deviceInfoJson) {
    try {
        const info = JSON.parse(deviceInfoJson || "{}");
        return {
            deviceType: info.deviceType || "desktop",
            os: info.os || "Unknown",
            browser: info.browser || "Unknown",
            timestamp: info.timestamp || null,
        };
    } catch {
        return {
            deviceType: "desktop",
            os: "Unknown",
            browser: "Unknown",
            timestamp: null,
        };
    }
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
        isEnabled,
        isLoading,
        isRequesting,
        isSendingTest,
        notificationStatus,
        enableNotifications,
        disableNotifications,
        deleteSubscriptionById,
        updatePreferences,
        sendTestNotification,
    } = useFCMToken(user?.id);

    const isIOS = notificationStatus.isIOS;
    const isPWAInstalled = notificationStatus.isPWA;
    const needsPWAForIOS = isIOS && !isPWAInstalled;

    // Notification permission is blocked - but NOT on iOS (iOS has weird behavior)
    const isBlocked =
        !isIOS &&
        notificationStatus.supported &&
        notificationStatus.permission === "denied";

    // Get current preferences from current device subscription
    const currentPrefs = currentDeviceSubscription || {
        notify_all_chat: true,
        notify_mentions: true,
        notify_team_invites: true,
    };

    // Build summary text
    const buildSummaryText = () => {
        if (!isEnabled) return null;

        const activePrefs = [];
        if (currentPrefs.notify_all_chat) activePrefs.push("All chat messages");
        if (currentPrefs.notify_mentions) activePrefs.push("Mentions");
        if (currentPrefs.notify_team_invites)
            activePrefs.push("Team invitations");

        if (activePrefs.length === 0) {
            return "No notification types enabled for this device.";
        }

        return `Receiving push notifications for: ${activePrefs.join(", ")}`;
    };

    const handlePreferenceChange = (prefKey, value) => {
        if (!currentDeviceSubscription) return;

        updatePreferences({
            subscriptionId: currentDeviceSubscription.id,
            notifyAllChat: prefKey === "notify_all_chat" ? value : undefined,
            notifyMentions: prefKey === "notify_mentions" ? value : undefined,
            notifyTeamInvites:
                prefKey === "notify_team_invites" ? value : undefined,
        });
    };

    const handleSendTest = () => {
        if (!currentDeviceSubscription) return;
        sendTestNotification(currentDeviceSubscription.id);
    };

    const summaryText = buildSummaryText();

    return (
        <Container>
            <Section>
                <SectionTitle>Push Notifications</SectionTitle>

                {/* Live Summary */}
                {summaryText && <SummaryText>{summaryText}</SummaryText>}

                {/* Status Card */}
                <StatusCard>
                    <StatusIcon $enabled={isEnabled}>
                        {isEnabled ? <HiBell /> : <HiBellSlash />}
                    </StatusIcon>
                    <StatusContent>
                        <StatusTitle>
                            {isEnabled
                                ? "Notifications enabled"
                                : "Notifications disabled"}
                        </StatusTitle>
                        <StatusDescription>
                            {isEnabled
                                ? "You will receive push notifications based on your preferences below."
                                : "Enable notifications to stay updated on mentions, chat messages, and team invites."}
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

                {/* Master Toggle Switch */}
                {!notificationStatus.supported ? (
                    <InfoCard>
                        <InfoText>
                            Push notifications are not supported on this
                            browser/device.
                        </InfoText>
                    </InfoCard>
                ) : (
                    <ToggleRow>
                        {isLoading || isRequesting ? (
                            <SpinnerMini />
                        ) : (
                            <SwitchButton
                                label={isEnabled ? "Enabled" : "Disabled"}
                                value={isEnabled}
                                onChange={(newValue) => {
                                    if (newValue) {
                                        enableNotifications();
                                    } else {
                                        disableNotifications();
                                    }
                                }}
                                disabled={
                                    isLoading ||
                                    isRequesting ||
                                    isBlocked ||
                                    needsPWAForIOS
                                }
                            />
                        )}
                    </ToggleRow>
                )}
            </Section>

            {/* Notification Preferences */}
            {notificationStatus.supported && (
                <Section>
                    <SectionTitle>Notification Types</SectionTitle>
                    <PreferencesSection $disabled={!isEnabled}>
                        {/* All Chat Messages */}
                        <PreferenceItem>
                            <PreferenceIcon>
                                <HiChatBubbleLeftRight />
                            </PreferenceIcon>
                            <PreferenceContent>
                                <PreferenceTitle>
                                    All Chat Messages
                                </PreferenceTitle>
                                <PreferenceDescription>
                                    Get notified for every new chat message in
                                    your kicker
                                </PreferenceDescription>
                            </PreferenceContent>
                            <PreferenceToggle>
                                <SwitchButton
                                    value={currentPrefs.notify_all_chat}
                                    onChange={(val) =>
                                        handlePreferenceChange(
                                            "notify_all_chat",
                                            val
                                        )
                                    }
                                    disabled={!isEnabled || isLoading}
                                />
                            </PreferenceToggle>
                        </PreferenceItem>

                        {/* Mentions */}
                        <PreferenceItem>
                            <PreferenceIcon>
                                <HiAtSymbol />
                            </PreferenceIcon>
                            <PreferenceContent>
                                <PreferenceTitle>Mentions</PreferenceTitle>
                                <PreferenceDescription>
                                    Get notified when someone mentions you with
                                    @name or @everyone
                                </PreferenceDescription>
                            </PreferenceContent>
                            <PreferenceToggle>
                                <SwitchButton
                                    value={currentPrefs.notify_mentions}
                                    onChange={(val) =>
                                        handlePreferenceChange(
                                            "notify_mentions",
                                            val
                                        )
                                    }
                                    disabled={!isEnabled || isLoading}
                                />
                            </PreferenceToggle>
                        </PreferenceItem>

                        {/* Team Invitations */}
                        <PreferenceItem>
                            <PreferenceIcon>
                                <HiUserGroup />
                            </PreferenceIcon>
                            <PreferenceContent>
                                <PreferenceTitle>
                                    Team Invitations
                                </PreferenceTitle>
                                <PreferenceDescription>
                                    Get notified when you receive a team
                                    invitation
                                </PreferenceDescription>
                            </PreferenceContent>
                            <PreferenceToggle>
                                <SwitchButton
                                    value={currentPrefs.notify_team_invites}
                                    onChange={(val) =>
                                        handlePreferenceChange(
                                            "notify_team_invites",
                                            val
                                        )
                                    }
                                    disabled={!isEnabled || isLoading}
                                />
                            </PreferenceToggle>
                        </PreferenceItem>
                    </PreferencesSection>
                </Section>
            )}

            {/* Registered Devices */}
            {isEnabled && subscriptions?.length > 0 && (
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

                            return (
                                <DeviceCard
                                    key={subscription.id}
                                    $isCurrentDevice={isCurrentDevice}
                                >
                                    <DeviceIcon>
                                        {deviceInfo.deviceType === "desktop" ? (
                                            <HiComputerDesktop />
                                        ) : (
                                            <HiDevicePhoneMobile />
                                        )}
                                    </DeviceIcon>
                                    <DeviceInfo>
                                        <DeviceName>
                                            {deviceInfo.os} -{" "}
                                            {deviceInfo.browser}
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
                                    </DeviceInfo>
                                    <DeviceActions>
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
                                </DeviceCard>
                            );
                        })}
                    </DevicesList>

                    {/* Test Notification Button */}
                    {currentDeviceSubscription && (
                        <Button
                            $variation="secondary"
                            onClick={handleSendTest}
                            disabled={isSendingTest || isLoading}
                        >
                            {isSendingTest ? (
                                <SpinnerMini />
                            ) : (
                                "Send Test Notification"
                            )}
                        </Button>
                    )}
                </Section>
            )}
        </Container>
    );
}

export default NotificationSettings;
