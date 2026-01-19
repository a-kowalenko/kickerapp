import styled, { keyframes } from "styled-components";
import { formatDistanceToNow } from "date-fns";
import {
    HiOutlineChatBubbleLeftRight,
    HiOutlineChatBubbleOvalLeft,
    HiOutlineUserGroup,
    HiOutlineFire,
} from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Avatar from "../../ui/Avatar";
import CountBadge from "../../ui/CountBadge";
import { DEFAULT_AVATAR } from "../../utils/constants";
import { useKicker } from "../../contexts/KickerContext";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";
import KickerSwitchConfirmModal from "./KickerSwitchConfirmModal";
import useWindowWidth from "../../hooks/useWindowWidth";

const highlightPulse = keyframes`
    0% {
        background-color: var(--primary-button-color-light);
    }
    100% {
        background-color: transparent;
    }
`;

const ItemContainer = styled.div`
    display: flex;
    gap: 1.2rem;
    padding: 1.2rem 1.4rem;
    cursor: pointer;
    transition:
        background-color 0.15s ease,
        transform 0.1s ease;
    border-left: 3px solid
        ${(props) => (props.$isUnread ? "var(--color-red-700)" : "transparent")};
    background-color: ${(props) =>
        props.$isUnread ? "rgba(239, 68, 68, 0.05)" : "transparent"};

    &:hover {
        background-color: var(--tertiary-background-color);
    }

    &:active {
        transform: scale(0.98);
        background-color: var(--quaternary-background-color);
    }

    &:not(:last-child) {
        border-bottom: 1px solid var(--primary-border-color);
    }

    &.highlight {
        animation: ${highlightPulse} 2s ease-out;
    }
`;

const AvatarWrapper = styled.div`
    flex-shrink: 0;
    position: relative;
`;

const TypeBadge = styled.span`
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 1.8rem;
    height: 1.8rem;
    border-radius: 50%;
    background-color: var(--primary-background-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    border: 1px solid var(--primary-border-color);

    & svg {
        width: 1.2rem;
        height: 1.2rem;
        color: var(--secondary-text-color);
    }
`;

const ContentWrapper = styled.div`
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
`;

const SenderName = styled.span`
    font-weight: 600;
    font-size: 1.4rem;
    color: var(--primary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const TimeAgo = styled.span`
    font-size: 1.2rem;
    color: var(--tertiary-text-color);
    white-space: nowrap;
    flex-shrink: 0;
`;

const ContentPreview = styled.p`
    font-size: 1.3rem;
    color: var(--secondary-text-color);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-word;
`;

const MetaInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 1.2rem;
    color: var(--tertiary-text-color);
`;

const KickerName = styled.span`
    &::after {
        content: "•";
        margin-left: 0.6rem;
    }
`;

const MatchInfo = styled.span`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

/**
 * Format match info string from match_info JSONB
 */
function formatMatchInfo(matchInfo) {
    if (!matchInfo) return null;

    const {
        player1_name,
        player2_name,
        player3_name,
        player4_name,
        scoreTeam1,
        scoreTeam2,
    } = matchInfo;

    // 2v2 match
    if (player3_name && player4_name) {
        return `${player1_name} & ${player3_name} vs ${player2_name} & ${player4_name} (${scoreTeam1}:${scoreTeam2})`;
    }

    // 1v1 match
    if (player1_name && player2_name) {
        return `${player1_name} vs ${player2_name} (${scoreTeam1}:${scoreTeam2})`;
    }

    return null;
}

/**
 * Strip mention formatting from content preview
 * Converts @[Name](123) to @Name
 */
function cleanContentPreview(content) {
    if (!content) return "";
    return content.replace(/@\[([^\]]+)\]\(\d+\)/g, "@$1");
}

function NotificationItem({ notification, onMarkAsRead, onClose }) {
    const navigate = useNavigate();
    const { currentKicker, setCurrentKicker } = useKicker();
    const { isDesktop } = useWindowWidth();
    const [autoSwitchKicker, setAutoSwitchKicker] = useLocalStorageState(
        false,
        "autoSwitchKickerOnNotification",
    );
    const [showSwitchModal, setShowSwitchModal] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);

    const {
        id,
        type,
        source_id,
        match_id,
        kicker_id,
        kicker_name,
        sender_player_name,
        sender_avatar,
        content_preview,
        is_read,
        created_at,
        match_info,
    } = notification;

    const timeAgo = formatDistanceToNow(new Date(created_at), {
        addSuffix: true,
    });

    const matchInfoString = formatMatchInfo(match_info);
    const cleanedPreview = cleanContentPreview(content_preview);

    // Check if notification is from a different kicker
    const isDifferentKicker =
        kicker_id && currentKicker && kicker_id !== currentKicker;

    function getNavigationUrl() {
        if (type === "comment" && match_id) {
            return `/matches/${match_id}?scrollTo=comment-${source_id}`;
        } else if (type === "chat") {
            // On mobile (when MobileBottomNav is shown), navigate to /chat page
            // On desktop, navigate to /home with chat tab
            const basePath = isDesktop ? "/home" : "/chat";
            return `${basePath}?tab=chat&scrollTo=message-${source_id}&_t=${Date.now()}`;
        } else if (type === "team_invite") {
            return "/teams/my";
        } else if (type === "fatality" && match_id) {
            return `/matches/${match_id}`;
        }
        return null;
    }

    function performNavigation(url) {
        if (url) {
            navigate(url);
        }
    }

    function switchKickerAndNavigate(url) {
        setCurrentKicker(kicker_id);
        performNavigation(url);
    }

    function handleClick() {
        // Mark as read first
        if (!is_read) {
            onMarkAsRead(id);
        }

        const url = getNavigationUrl();

        // Check if we need to switch kicker
        if (isDifferentKicker) {
            if (autoSwitchKicker) {
                // User chose "don't ask again" - switch automatically
                onClose?.();
                switchKickerAndNavigate(url);
            } else {
                // Show confirmation modal - DON'T close dropdown yet
                setPendingNavigation(url);
                setShowSwitchModal(true);
            }
        } else {
            // Same kicker or no kicker context - navigate directly
            onClose?.();
            performNavigation(url);
        }
    }

    function handleConfirmSwitch() {
        const url = pendingNavigation;
        setShowSwitchModal(false);
        setPendingNavigation(null);
        switchKickerAndNavigate(url);
        onClose?.();
    }

    function handleCancelSwitch() {
        setShowSwitchModal(false);
        setPendingNavigation(null);
    }

    function handleDontAskAgain() {
        // Set both state and localStorage directly to ensure it persists
        // even if component unmounts before useEffect runs
        setAutoSwitchKicker(true);
        localStorage.setItem(
            "autoSwitchKickerOnNotification",
            JSON.stringify(true),
        );
    }

    return (
        <ItemContainer $isUnread={!is_read} onClick={handleClick}>
            <AvatarWrapper>
                <Avatar
                    src={sender_avatar || DEFAULT_AVATAR}
                    alt={sender_player_name}
                    size="medium"
                />
                <TypeBadge>
                    {type === "comment" ? (
                        <HiOutlineChatBubbleOvalLeft />
                    ) : type === "team_invite" ? (
                        <HiOutlineUserGroup />
                    ) : type === "fatality" ? (
                        <HiOutlineFire />
                    ) : (
                        <HiOutlineChatBubbleLeftRight />
                    )}
                </TypeBadge>
            </AvatarWrapper>

            <ContentWrapper>
                <Header>
                    <SenderName>{sender_player_name}</SenderName>
                    <TimeAgo>{timeAgo}</TimeAgo>
                    {!is_read && <CountBadge dot size="sm" />}
                </Header>

                <ContentPreview>{cleanedPreview}</ContentPreview>

                <MetaInfo>
                    <KickerName>{kicker_name}</KickerName>
                    {matchInfoString && (
                        <MatchInfo>{matchInfoString}</MatchInfo>
                    )}
                    {type === "chat" && <span>Chat</span>}
                    {type === "team_invite" && <span>Team Invite</span>}
                    {type === "fatality" && <span>Fatality</span>}
                </MetaInfo>
            </ContentWrapper>

            {showSwitchModal && (
                <KickerSwitchConfirmModal
                    kickerName={kicker_name}
                    onConfirm={handleConfirmSwitch}
                    onCancel={handleCancelSwitch}
                    onDontAskAgain={handleDontAskAgain}
                />
            )}
        </ItemContainer>
    );
}

export default NotificationItem;
