import styled, { css } from "styled-components";
import { Link } from "react-router-dom";
import Avatar from "../../ui/Avatar";
import { StatusBadge } from "../../ui/StatusBadge";
import {
    BountyTooltip,
    StatusTooltip,
    useBountyTooltip,
} from "../../ui/BountyTooltip";
import { ACTIVITY_STATUS } from "./usePlayersActivity";
import { IoGameController } from "react-icons/io5";

/* ----------------------------------------
   Styled Components
----------------------------------------- */
const Card = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 1rem 0.8rem;
    border-radius: var(--border-radius-sm);
    transition: background-color 0.15s ease;
    cursor: pointer;

    &:hover {
        background-color: var(--secondary-background-color);
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
    gap: 0.8rem;
    flex: 1;
    min-width: 0;
`;

const PlayerInfo = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    min-width: 0;
`;

const PlayerName = styled.span`
    font-size: 1.6rem;
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
    gap: 0.4rem;
    flex-wrap: wrap;
`;

const PlayingBadge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);

    svg {
        font-size: 0.85rem;
    }
`;

const StatusBadgeWrapper = styled.span`
    display: inline-flex;
    cursor: pointer;
    transition: transform 0.15s ease;

    &:hover {
        transform: scale(1.05);
    }
`;

const Divider = styled.div`
    width: 1px;
    height: 36px;
    background: linear-gradient(
        180deg,
        transparent 0%,
        var(--secondary-text-color) 20%,
        var(--secondary-text-color) 80%,
        transparent 100%
    );
    opacity: 0.3;
    flex-shrink: 0;
`;

const BountySection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    flex-shrink: 0;
    cursor: pointer;
    transition: transform 0.2s ease;

    &:hover {
        transform: scale(1.08);
    }
`;

const BountyValue = styled.div`
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 1.5rem;
    font-weight: 700;
    color: #ef4444;
`;

const BountyLabel = styled.span`
    font-size: 1rem;
    color: var(--secondary-text-color);
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const OfflineTime = styled.span`
    font-size: 1.2rem;
    color: var(--secondary-text-color);
    font-style: italic;
`;

/* ----------------------------------------
   PlayerActivityCard Component
   
   Compact player card for the activity sidebar
   Shows avatar with online indicator, name, and status info
   
   Props:
   - player: Object with player data from usePlayersActivity
   - showBounty: boolean - Show bounty badge
   - showStatus: boolean - Show status badge
----------------------------------------- */
export function PlayerActivityCard({
    player,
    showBounty = true,
    showStatus = true,
}) {
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
    } = player;

    // Bounty tooltip
    const {
        isHovered: isBountyHovered,
        tooltipPos: bountyTooltipPos,
        handleMouseEnter: handleBountyMouseEnter,
        handleMouseLeave: handleBountyMouseLeave,
        triggerRef: bountyTriggerRef,
    } = useBountyTooltip(120);

    // Status tooltip
    const {
        isHovered: isStatusHovered,
        tooltipPos: statusTooltipPos,
        handleMouseEnter: handleStatusMouseEnter,
        handleMouseLeave: handleStatusMouseLeave,
        triggerRef: statusTriggerRef,
    } = useBountyTooltip(160);

    const isOffline =
        activityStatus === ACTIVITY_STATUS.OFFLINE ||
        activityStatus === ACTIVITY_STATUS.INACTIVE;

    const hasBounty = totalBounty > 0;
    const hasStatus = primaryStatus && !isInMatch;
    const hasStatusTooltipData =
        statuses1on1?.length > 0 || statuses2on2?.length > 0;

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
                                Playing {formatGamemode(matchGamemode)}
                            </PlayingBadge>
                        )}

                        {/* Status badge - when not in match and has status */}
                        {!isOffline && showStatus && hasStatus && (
                            <StatusBadgeWrapper
                                ref={
                                    hasStatusTooltipData
                                        ? statusTriggerRef
                                        : null
                                }
                                onMouseEnter={
                                    hasStatusTooltipData
                                        ? handleStatusMouseEnter
                                        : undefined
                                }
                                onMouseLeave={
                                    hasStatusTooltipData
                                        ? handleStatusMouseLeave
                                        : undefined
                                }
                            >
                                <StatusBadge
                                    status={primaryStatus}
                                    size="small"
                                    showLabel={true}
                                />
                            </StatusBadgeWrapper>
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

            {/* Bounty Section - on the right with divider */}
            {showBounty && hasBounty && !isInMatch && (
                <>
                    <Divider />
                    <BountySection
                        ref={bountyTriggerRef}
                        onMouseEnter={handleBountyMouseEnter}
                        onMouseLeave={handleBountyMouseLeave}
                    >
                        <BountyLabel>Bounty</BountyLabel>
                        <BountyValue>💰+{totalBounty}</BountyValue>
                    </BountySection>
                </>
            )}

            {/* Tooltips */}
            {hasBounty && (
                <BountyTooltip
                    isVisible={isBountyHovered}
                    position={bountyTooltipPos}
                    bounty1on1={bounty1on1}
                    bounty2on2={bounty2on2}
                />
            )}

            {hasStatusTooltipData && (
                <StatusTooltip
                    isVisible={isStatusHovered}
                    position={statusTooltipPos}
                    statuses1on1={statuses1on1}
                    statuses2on2={statuses2on2}
                />
            )}
        </Card>
    );
}

export default PlayerActivityCard;
