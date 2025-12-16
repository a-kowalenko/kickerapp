import styled from "styled-components";
import { HiBell, HiBellSlash, HiDevicePhoneMobile } from "react-icons/hi2";
import { useFCMToken } from "../../hooks/useFCMToken";
import { useUser } from "../../features/authentication/useUser";
import Button from "../../ui/Button";
import SpinnerMini from "../../ui/SpinnerMini";

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

const InfoTitle = styled.span`
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--primary-text-color);
`;

const InfoText = styled.span`
    font-size: 1.2rem;
    color: var(--secondary-text-color);
    line-height: 1.5;
`;

const ButtonRow = styled.div`
    display: flex;
    gap: 1.2rem;
    margin-top: 0.8rem;
`;

function NotificationSettings() {
    const { user } = useUser();
    const {
        isEnabled,
        isLoading,
        isRequesting,
        notificationStatus,
        enableNotifications,
        disableNotifications,
    } = useFCMToken(user?.id);

    const isIOS = notificationStatus.isIOS;
    const isPWAInstalled = notificationStatus.isPWA;
    const needsPWAForIOS = isIOS && !isPWAInstalled;

    // Notification permission is blocked - but NOT on iOS (iOS has weird behavior)
    // On iOS, "denied" can appear even when never asked, so we ignore it
    const isBlocked =
        !isIOS &&
        notificationStatus.supported &&
        notificationStatus.permission === "denied";

    return (
        <Container>
            <Section>
                <SectionTitle>Push Notifications</SectionTitle>

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
                                ? "You will receive push notifications when mentioned in comments or chat messages."
                                : "Enable notifications to be notified when someone mentions you."}
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

                {/* Action Buttons */}
                {!notificationStatus.supported ? (
                    <InfoCard>
                        <InfoText>
                            Push notifications are not supported on this
                            browser/device.
                        </InfoText>
                    </InfoCard>
                ) : (
                    <ButtonRow>
                        {!isEnabled ? (
                            <Button
                                onClick={enableNotifications}
                                disabled={
                                    isLoading ||
                                    isRequesting ||
                                    isBlocked ||
                                    needsPWAForIOS
                                }
                            >
                                {isRequesting ? (
                                    <SpinnerMini />
                                ) : (
                                    "Enable Notifications"
                                )}
                            </Button>
                        ) : (
                            <Button
                                $variation="danger"
                                onClick={disableNotifications}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <SpinnerMini />
                                ) : (
                                    "Disable Notifications"
                                )}
                            </Button>
                        )}
                    </ButtonRow>
                )}
            </Section>

            {/* Info Section */}
            <Section>
                <SectionTitle>How it works</SectionTitle>
                <InfoCard>
                    <InfoTitle>@Mentions</InfoTitle>
                    <InfoText>
                        When someone mentions you with @YourName in a comment or
                        chat message, you&apos;ll receive a push notification on
                        all your subscribed devices.
                    </InfoText>
                </InfoCard>
                <InfoCard>
                    <InfoTitle>@everyone</InfoTitle>
                    <InfoText>
                        When someone uses @everyone, all players in the kicker
                        will receive a notification. Use this for important
                        announcements!
                    </InfoText>
                </InfoCard>
                <InfoCard>
                    <InfoTitle>Click to navigate</InfoTitle>
                    <InfoText>
                        Clicking on a notification will open the app and take
                        you directly to the relevant comment or chat message.
                    </InfoText>
                </InfoCard>
            </Section>

            {/* Debug Section - Remove after fixing */}
            <Section>
                <SectionTitle>Debug Info</SectionTitle>
                <InfoCard>
                    <InfoText>
                        supported: {String(notificationStatus.supported)}
                        <br />
                        permission: {notificationStatus.permission}
                        <br />
                        isIOS: {String(notificationStatus.isIOS)}
                        <br />
                        isPWA: {String(notificationStatus.isPWA)}
                        <br />
                        isEnabled: {String(isEnabled)}
                        <br />
                        isBlocked: {String(isBlocked)}
                        <br />
                        needsPWAForIOS: {String(needsPWAForIOS)}
                        <br />
                        Notification in window:{" "}
                        {String("Notification" in window)}
                        <br />
                        Raw permission:{" "}
                        {"Notification" in window
                            ? Notification.permission
                            : "N/A"}
                    </InfoText>
                </InfoCard>
            </Section>
        </Container>
    );
}

export default NotificationSettings;
