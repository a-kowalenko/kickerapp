import {
    HiOutlineClipboardDocument,
    HiOutlineKey,
    HiOutlineShare,
    HiOutlineMoon,
    HiOutlineSun,
    HiOutlineSpeakerWave,
    HiOutlineSpeakerXMark,
    HiOutlineComputerDesktop,
    HiOutlineDevicePhoneMobile,
    HiOutlineDeviceTablet,
    HiOutlineGlobeAlt,
    HiOutlineXMark,
    HiOutlineArrowRightOnRectangle,
    HiOutlineLink,
    HiOutlineCalendarDays,
} from "react-icons/hi2";
import { useKickerInfo } from "../hooks/useKickerInfo";
import { useOwnPlayer } from "../hooks/useOwnPlayer";
import { useUser } from "../features/authentication/useUser";
import Input from "../ui/Input";
import styled from "styled-components";
import ButtonIcon from "../ui/ButtonIcon";
import toast from "react-hot-toast";
import Heading from "../ui/Heading";
import SpinnerMini from "../ui/SpinnerMini";
import Spinner from "../ui/Spinner";
import Button from "../ui/Button";
import SwitchButton from "../ui/SwitchButton";
import { media } from "../utils/constants";
import TabView from "../ui/TabView";
import SeasonManagement from "../features/seasons/SeasonManagement";
import SeasonSelector from "../features/seasons/SeasonSelector";
import NotificationSettings from "../features/settings/NotificationSettings";
import StatusDisplaySettings from "../features/settings/StatusDisplaySettings";
import UserPermissionsManager from "../features/settings/UserPermissionsManager";
import KickerSettings from "../features/settings/KickerSettings";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useDarkMode } from "../contexts/DarkModeContext";
import { useSound } from "../contexts/SoundContext";
import {
    useActiveSessions,
    useTerminateSession,
    useTerminateOtherSessions,
} from "../features/authentication/useActiveSessions";
import { UAParser } from "ua-parser-js";

const StyledSettings = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
`;

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2.4rem;

    ${media.tablet} {
        padding: 0 2.4rem;
    }
`;

const Section = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
`;

const SectionHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.2rem;
    flex-wrap: wrap;
`;

const SectionTitle = styled.h3`
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--primary-text-color);
    display: flex;
    align-items: center;
    gap: 0.8rem;
`;

const SessionCount = styled.span`
    font-size: 1.3rem;
    font-weight: 400;
    color: var(--secondary-text-color);
`;

const SettingCard = styled.div`
    display: flex;
    align-items: center;
    gap: 1.6rem;
    padding: 1.6rem;
    background-color: var(--secondary-background-color);
    border-radius: var(--border-radius-md);
    border: 1px solid var(--primary-border-color);

    ${media.mobile} {
        flex-direction: column;
        align-items: stretch;
    }
`;

const SettingIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4.8rem;
    height: 4.8rem;
    border-radius: 50%;
    background-color: var(--secondary-background-color);
    color: var(--primary-button-color);
    flex-shrink: 0;

    & svg {
        font-size: 2.4rem;
    }
`;

const SettingContent = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 0;
`;

const SettingTitle = styled.span`
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--primary-text-color);
`;

const SettingDescription = styled.span`
    font-size: 1.2rem;
    color: var(--secondary-text-color);
`;

const SettingActions = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-shrink: 0;

    ${media.mobile} {
        justify-content: flex-end;
    }
`;

const TokenInputWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;

    & input {
        font-family: monospace;
        font-size: 1.2rem;
    }

    ${media.mobile} {
        width: 100%;

        & input {
            flex: 1;
        }
    }
`;

const AppearanceRow = styled.div`
    display: flex;
    gap: 1.2rem;

    ${media.mobile} {
        flex-direction: column;
    }
`;

const AppearanceCard = styled.div`
    flex: 1;
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding: 1.4rem;
    background-color: var(--secondary-background-color);
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--primary-border-color);
`;

const AppearanceIcon = styled.div`
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

const AppearanceContent = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
`;

const AppearanceTitle = styled.span`
    font-size: 1.3rem;
    font-weight: 500;
    color: var(--primary-text-color);
`;

const AppearanceDescription = styled.span`
    font-size: 1.1rem;
    color: var(--secondary-text-color);
`;

const SessionsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
`;

const SessionCard = styled.div`
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding: 1.2rem;
    background-color: var(--secondary-background-color);
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--primary-border-color);
    transition: all 0.15s ease;

    ${(props) =>
        props.$isCurrentSession &&
        `
        border-color: var(--primary-button-color);
        background-color: var(--tertiary-background-color);
    `}

    ${media.mobile} {
        flex-direction: column;
        align-items: stretch;
    }
`;

const SessionIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    background-color: var(--tertiary-background-color);
    color: var(--primary-text-color);
    flex-shrink: 0;

    & svg {
        font-size: 2rem;
    }
`;

const SessionInfo = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 0;
`;

const SessionMain = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-wrap: wrap;
`;

const SessionName = styled.span`
    font-size: 1.3rem;
    font-weight: 500;
    color: var(--primary-text-color);
`;

const CurrentBadge = styled.span`
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-green-700);
    background-color: var(--color-green-100);
    padding: 0.2rem 0.6rem;
    border-radius: var(--border-radius-sm);
`;

const SessionDetails = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem 1.2rem;
    font-size: 1.1rem;
    color: var(--secondary-text-color);
`;

const SessionDetail = styled.span`
    display: flex;
    align-items: center;
    gap: 0.4rem;

    & svg {
        font-size: 1.2rem;
    }
`;

const SessionActions = styled.div`
    flex-shrink: 0;

    ${media.mobile} {
        display: flex;
        justify-content: flex-end;
    }
`;

const TerminateButton = styled.button`
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

const LoadingContainer = styled.div`
    display: flex;
    justify-content: center;
    padding: 2rem;
`;

const EmptyText = styled.p`
    font-size: 1.3rem;
    color: var(--secondary-text-color);
    text-align: center;
    padding: 1.6rem;
`;

// Helper function to parse user agent and get device info
function parseUserAgent(userAgent) {
    if (!userAgent) {
        return {
            browser: "Unknown Browser",
            browserVersion: "",
            os: "Unknown OS",
            osVersion: "",
            device: "desktop",
            deviceModel: "",
        };
    }

    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    return {
        browser: result.browser.name || "Unknown Browser",
        browserVersion: result.browser.version || "",
        os: result.os.name || "Unknown OS",
        osVersion: result.os.version || "",
        device: result.device.type || "desktop",
        deviceModel: result.device.model || "",
        deviceVendor: result.device.vendor || "",
    };
}

// Helper to get device icon based on device type
function getDeviceIcon(deviceType) {
    switch (deviceType) {
        case "mobile":
            return <HiOutlineDevicePhoneMobile />;
        case "tablet":
            return <HiOutlineDeviceTablet />;
        default:
            return <HiOutlineComputerDesktop />;
    }
}

// Helper to format relative time
function formatRelativeTime(date) {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return then.toLocaleDateString();
}

function GeneralSettings() {
    const { data: kickerData, isLoading: isLoadingKickerData } =
        useKickerInfo();
    const { data: ownPlayer } = useOwnPlayer();
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    const { isSound, toggleSound } = useSound();
    const {
        sessions,
        isLoading: isLoadingSessions,
        currentSessionId,
        sessionCount,
    } = useActiveSessions();
    const { terminateSession, isTerminating } = useTerminateSession();
    const { terminateOtherSessions, isTerminatingAll } =
        useTerminateOtherSessions();

    // Generate invite link with player ID
    function getInviteLink() {
        const token = kickerData?.access_token;
        if (!token) return "";
        const baseUrl = `${window.location.origin}/invite/${token}`;
        return ownPlayer?.id ? `${baseUrl}?from=${ownPlayer.id}` : baseUrl;
    }

    function handleCopyLink() {
        const link = getInviteLink();
        if (!link) {
            toast.error("No invite link available");
            return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(link).then(
                () => toast.success("Invite link copied"),
                () => toast.error("Failed to copy")
            );
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = link;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand("copy");
                toast.success("Invite link copied");
            } catch (err) {
                toast.error("Failed to copy");
            }
            document.body.removeChild(textArea);
        }
    }

    function handleCopy() {
        const text = kickerData?.access_token;
        if (!text) {
            toast.error("No access token available");
            return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(
                () => toast.success("Access Token copied"),
                () => toast.error("Failed to copy")
            );
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand("copy");
                toast.success("Access Token copied");
            } catch (err) {
                toast.error("Failed to copy");
            }
            document.body.removeChild(textArea);
        }
    }

    async function handleShare() {
        const link = getInviteLink();
        if (!link) {
            toast.error("No invite link available");
            return;
        }

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${kickerData?.name || "Kicker"} – Invitation`,
                    text: `Hey! You're invited to join our kicker "${kickerData?.name}". Click the link below to become part of the team!\n\n${link}`,
                });
            } catch (err) {
                if (err.name !== "AbortError") {
                    toast.error("Failed to share");
                }
            }
        } else {
            handleCopyLink();
        }
    }

    function handleTerminateSession(sessionId) {
        if (sessionId === currentSessionId) {
            toast.error("Cannot terminate current session");
            return;
        }
        terminateSession(sessionId);
    }

    function handleTerminateOtherSessions() {
        if (sessionCount <= 1) {
            toast.error("No other sessions to terminate");
            return;
        }
        terminateOtherSessions();
    }

    return (
        <Container>
            {/* Appearance Section */}
            <Section>
                <SectionTitle>Appearance</SectionTitle>
                <AppearanceRow>
                    <AppearanceCard>
                        <AppearanceIcon>
                            {isDarkMode ? <HiOutlineMoon /> : <HiOutlineSun />}
                        </AppearanceIcon>
                        <AppearanceContent>
                            <AppearanceTitle>Theme</AppearanceTitle>
                            <AppearanceDescription>
                                {isDarkMode ? "Dark mode" : "Light mode"}
                            </AppearanceDescription>
                        </AppearanceContent>
                        <SwitchButton
                            value={isDarkMode}
                            onChange={toggleDarkMode}
                        />
                    </AppearanceCard>
                    <AppearanceCard>
                        <AppearanceIcon>
                            {isSound ? (
                                <HiOutlineSpeakerWave />
                            ) : (
                                <HiOutlineSpeakerXMark />
                            )}
                        </AppearanceIcon>
                        <AppearanceContent>
                            <AppearanceTitle>Sound</AppearanceTitle>
                            <AppearanceDescription>
                                {isSound ? "Sound on" : "Sound off"}
                            </AppearanceDescription>
                        </AppearanceContent>
                        <SwitchButton value={isSound} onChange={toggleSound} />
                    </AppearanceCard>
                </AppearanceRow>
            </Section>

            {/* Season Section */}
            <Section>
                <SectionTitle>Season</SectionTitle>
                <SettingCard>
                    <SettingIcon>
                        <HiOutlineCalendarDays />
                    </SettingIcon>
                    <SettingContent>
                        <SettingTitle>Season Filter</SettingTitle>
                        <SettingDescription>
                            Choose which season to display data for
                        </SettingDescription>
                        <SeasonSelector />
                    </SettingContent>
                </SettingCard>
            </Section>

            {/* Access Token Section */}
            <Section>
                <SectionTitle>Invite Players</SectionTitle>
                <SettingCard>
                    <SettingIcon>
                        <HiOutlineKey />
                    </SettingIcon>
                    <SettingContent>
                        <SettingTitle>Invite Link</SettingTitle>
                        <SettingDescription>
                            Share this link with players to let them join your
                            kicker
                        </SettingDescription>
                        {isLoadingKickerData ? (
                            <SpinnerMini />
                        ) : (
                            <TokenInputWrapper>
                                <Input
                                    value={getInviteLink()}
                                    readOnly={true}
                                />
                                <SettingActions>
                                    <ButtonIcon
                                        onClick={handleCopyLink}
                                        title="Copy invite link"
                                    >
                                        <HiOutlineLink />
                                    </ButtonIcon>
                                    <ButtonIcon
                                        onClick={handleCopy}
                                        title="Copy token only"
                                    >
                                        <HiOutlineClipboardDocument />
                                    </ButtonIcon>
                                    {navigator.share && (
                                        <ButtonIcon
                                            onClick={handleShare}
                                            title="Share invite"
                                        >
                                            <HiOutlineShare />
                                        </ButtonIcon>
                                    )}
                                </SettingActions>
                            </TokenInputWrapper>
                        )}
                    </SettingContent>
                </SettingCard>
            </Section>

            {/* Active Sessions Section */}
            <Section>
                <SectionHeader>
                    <SectionTitle>
                        Active Sessions
                        {!isLoadingSessions && (
                            <SessionCount>({sessionCount})</SessionCount>
                        )}
                    </SectionTitle>
                    {sessionCount > 1 && (
                        <Button
                            $size="small"
                            $variation="danger"
                            onClick={handleTerminateOtherSessions}
                            disabled={isTerminatingAll}
                        >
                            <HiOutlineArrowRightOnRectangle />
                            {isTerminatingAll ? (
                                <SpinnerMini />
                            ) : (
                                "Sign out everywhere else"
                            )}
                        </Button>
                    )}
                </SectionHeader>

                {isLoadingSessions ? (
                    <LoadingContainer>
                        <Spinner />
                    </LoadingContainer>
                ) : sessions?.length === 0 ? (
                    <EmptyText>No active sessions found</EmptyText>
                ) : (
                    <SessionsList>
                        {sessions?.map((session) => {
                            const isCurrentSession =
                                session.session_id === currentSessionId;
                            const parsed = parseUserAgent(session.user_agent);
                            const browserInfo = parsed.browserVersion
                                ? `${parsed.browser} ${
                                      parsed.browserVersion.split(".")[0]
                                  }`
                                : parsed.browser;
                            const osInfo = parsed.osVersion
                                ? `${parsed.os} ${parsed.osVersion}`
                                : parsed.os;

                            return (
                                <SessionCard
                                    key={session.session_id}
                                    $isCurrentSession={isCurrentSession}
                                >
                                    <SessionIcon>
                                        {getDeviceIcon(parsed.device)}
                                    </SessionIcon>
                                    <SessionInfo>
                                        <SessionMain>
                                            <SessionName>
                                                {browserInfo} on {osInfo}
                                            </SessionName>
                                            {isCurrentSession && (
                                                <CurrentBadge>
                                                    This device
                                                </CurrentBadge>
                                            )}
                                        </SessionMain>
                                        <SessionDetails>
                                            {parsed.deviceModel && (
                                                <SessionDetail>
                                                    {parsed.deviceVendor}{" "}
                                                    {parsed.deviceModel}
                                                </SessionDetail>
                                            )}
                                            {session.ip && (
                                                <SessionDetail>
                                                    <HiOutlineGlobeAlt />
                                                    {session.ip}
                                                </SessionDetail>
                                            )}
                                            <SessionDetail>
                                                Last active:{" "}
                                                {formatRelativeTime(
                                                    session.updated_at
                                                )}
                                            </SessionDetail>
                                        </SessionDetails>
                                    </SessionInfo>
                                    <SessionActions>
                                        {!isCurrentSession && (
                                            <TerminateButton
                                                onClick={() =>
                                                    handleTerminateSession(
                                                        session.session_id
                                                    )
                                                }
                                                disabled={isTerminating}
                                                title="Terminate session"
                                            >
                                                {isTerminating ? (
                                                    <SpinnerMini />
                                                ) : (
                                                    <HiOutlineXMark />
                                                )}
                                            </TerminateButton>
                                        )}
                                    </SessionActions>
                                </SessionCard>
                            );
                        })}
                    </SessionsList>
                )}
            </Section>
        </Container>
    );
}

function Settings() {
    const location = useLocation();
    const navigate = useNavigate();
    const { data: kickerData } = useKickerInfo();
    const { user } = useUser();
    const isAdmin = kickerData?.admin === user?.id;

    // Redirect to general tab if no specific tab is selected
    useEffect(() => {
        if (location.pathname === "/settings") {
            navigate("/settings/general", { replace: true });
        }
    }, [location.pathname, navigate]);

    const tabs = [
        {
            path: "/settings/general",
            label: "General",
            component: <GeneralSettings />,
        },
        {
            path: "/settings/notifications",
            label: "Notifications",
            component: <NotificationSettings />,
        },
        {
            path: "/settings/seasons",
            label: "Seasons",
            component: <SeasonManagement />,
        },
    ];

    // Add admin-only tabs
    if (isAdmin) {
        tabs.push({
            path: "/settings/admin",
            label: "Admin",
            component: <KickerSettings />,
        });
        tabs.push({
            path: "/settings/status-display",
            label: "Status Display",
            component: <StatusDisplaySettings />,
        });
        tabs.push({
            path: "/settings/permissions",
            label: "Permissions",
            component: <UserPermissionsManager />,
        });
    }

    return (
        <StyledSettings>
            <Heading as="h1" type="page" hasBackBtn={true}>
                Settings
            </Heading>
            <TabView tabs={tabs} />
        </StyledSettings>
    );
}

export default Settings;
