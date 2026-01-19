import styled, { css } from "styled-components";
import { Link } from "react-router-dom";
import Avatar from "../../ui/Avatar";
import { StatusBadge } from "../../ui/StatusBadge";
import StreakInfo from "../../ui/StreakInfo";
import { ACTIVITY_STATUS } from "./usePlayersActivity";
import { IoGameController } from "react-icons/io5";
import { HiOutlineInformationCircle } from "react-icons/hi2";

/* ----------------------------------------
   PlayerActivityCardMobile Styles
   
   Mobile-optimized player card for activity list
   Replaces hover tooltips with tap handler
----------------------------------------- */

const Card = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.2rem 1rem;
    border-radius: var(--border-radius-sm);
    transition: background-color 0.15s ease;
    cursor: pointer;

    &:active {
        background-color: var(--tertiary-background-color);
    }

    ${(props) =>
        props.$isOffline &&
        css`
            opacity: 0.7;
            filter: grayscale(40%);
        `}
`;

const PlayerLink = styled(Link)`
    text-decoration: none;
    color: inherit;
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
    min-width: 0;
`;

const PlayerInfo = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
`;

const PlayerName = styled.span`
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--primary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
`;

const StatusRow = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
`;

const PlayingBadge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-size: 1.1rem;
    font-weight: 600;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);

    svg {
        font-size: 1.2rem;
    }
`;

const OfflineTime = styled.span`
    font-size: 1.2rem;
    color: var(--secondary-text-color);
    font-style: italic;
`;

const InfoButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.6rem;
    height: 3.6rem;
    background: var(--tertiary-background-color);
    border: 1px solid var(--secondary-border-color);
    border-radius: 50%;
    color: var(--secondary-text-color);
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;

    svg {
        font-size: 2rem;
    }

    &:active {
        background: var(--quaternary-background-color);
        transform: scale(0.95);
        color: var(--primary-text-color);
    }
`;

const BountyIndicator = styled.span`
    font-size: 1.3rem;
    color: var(--color-yellow-600);
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.3rem;
`;

/* ----------------------------------------
   PlayerActivityCardMobile Component
   
   Mobile player card that opens bottom sheet on tap
   
   Props:
   - player: Object with player data from usePlayersActivity
   - onTap: () => void - Callback when info button is tapped
----------------------------------------- */
function PlayerActivityCardMobile({ player, onTap }) {
    const {
        player_id,
        player_name,
        player_avatar,
        activityStatus,
        isInMatch,
        matchGamemode,
        totalBounty,
        bounty1on1,
        bounty2on2,
        primaryStatus,
        statuses1on1,
        statuses2on2,
        last_seen,
        streak,
        streak1on1,
        streak2on2,
    } = player;

    const isOffline =
        activityStatus === ACTIVITY_STATUS.OFFLINE ||
        activityStatus === ACTIVITY_STATUS.INACTIVE;

    const hasBounty = totalBounty > 0;
    const hasStatus = primaryStatus && !isInMatch;
    const hasDetails =
        hasBounty ||
        Math.abs(streak1on1 || 0) >= 3 ||
        Math.abs(streak2on2 || 0) >= 3 ||
        (statuses1on1?.length || 0) > 0 ||
        (statuses2on2?.length || 0) > 0;

    // Determine online indicator status for Avatar
    let onlineIndicatorStatus = "offline";
    if (activityStatus === ACTIVITY_STATUS.IN_MATCH) {
        onlineIndicatorStatus = "inMatch";
    } else if (activityStatus === ACTIVITY_STATUS.ACTIVE) {
        onlineIndicatorStatus = "active";
    } else if (activityStatus === ACTIVITY_STATUS.IDLE) {
        onlineIndicatorStatus = "idle";
    }

    // Format gamemode for display
    const formatGamemode = (gamemode) => {
        switch (gamemode) {
            case "1on1":
                return "1on1";
            case "2on2":
                return "2on2";
            case "2on1":
                return "2on1";
            case "team":
                return "Team";
            default:
                return gamemode;
        }
    };

    // Format time ago for offline players
    const formatTimeAgo = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return "just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 30) return `${diffDays}d ago`;
        return `${Math.floor(diffDays / 30)}mo ago`;
    };

    const handleInfoTap = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onTap?.();
    };

    return (
        <Card $isOffline={isOffline}>
            <PlayerLink to={`/user/${player_name}/profile`}>
                <Avatar
                    player={{
                        id: player_id,
                        name: player_name,
                        avatar: player_avatar,
                    }}
                    $size="small"
                    $cursor="pointer"
                    showStatusEffects={!isOffline}
                    showStatus={!isOffline}
                    $onlineStatus={onlineIndicatorStatus}
                    bountyData={hasBounty ? { bounty1on1, bounty2on2 } : null}
                />

                <PlayerInfo>
                    <PlayerName>{player_name}</PlayerName>

                    <StatusRow>
                        {/* Playing badge - when in match */}
                        {isInMatch && (
                            <PlayingBadge>
                                <IoGameController />
                                {formatGamemode(matchGamemode)}
                            </PlayingBadge>
                        )}

                        {/* Status badge - when not in match and has status */}
                        {!isOffline && hasStatus && (
                            <StatusBadge
                                status={primaryStatus}
                                size="small"
                                showLabel={true}
                            />
                        )}

                        {/* Streak indicator - icon only */}
                        {!isOffline && !isInMatch && (
                            <StreakInfo
                                streak={streak}
                                streak1on1={streak1on1}
                                streak2on2={streak2on2}
                                size="small"
                                showLabel={false}
                                showTooltip={false}
                            />
                        )}

                        {/* Bounty indicator */}
                        {!isOffline && hasBounty && !isInMatch && (
                            <BountyIndicator>
                                💰+{totalBounty}
                            </BountyIndicator>
                        )}

                        {/* Offline time - when offline */}
                        {isOffline && last_seen && (
                            <OfflineTime>
                                {formatTimeAgo(last_seen)}
                            </OfflineTime>
                        )}
                    </StatusRow>
                </PlayerInfo>
            </PlayerLink>

            {/* Info button - only show if player has details */}
            {hasDetails && (
                <InfoButton onClick={handleInfoTap} aria-label="Player details">
                    <HiOutlineInformationCircle />
                </InfoButton>
            )}
        </Card>
    );
}

export default PlayerActivityCardMobile;
