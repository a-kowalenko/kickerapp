import styled, { keyframes, css } from "styled-components";
import Avatar from "./Avatar";
import { StatusBadge, SimpleStreakBadge } from "./StatusBadge";
import { HiOutlineFire } from "react-icons/hi2";
import { TbTarget, TbSnowflake } from "react-icons/tb";
import {
    BountyTooltip,
    StreakTooltip,
    StatusTooltip,
    useBountyTooltip,
} from "./BountyTooltip";

/* ----------------------------------------
   Size Configuration
----------------------------------------- */
const sizeConfig = {
    xs: {
        padding: "0.3rem 0.5rem",
        gap: "0.4rem",
        borderRadius: "0.5rem",
        avatarSize: "xsmall",
        nameSize: "1rem",
        bountySize: "0.9rem",
        bountyIconSize: "1rem",
        labelSize: "0.6rem",
        streakSize: "0.75rem",
        targetSize: "1rem",
    },
    small: {
        padding: "0.4rem 0.8rem",
        gap: "1.2rem",
        borderRadius: "0.6rem",
        avatarSize: "small",
        nameSize: "1.4rem",
        bountySize: "1.4rem",
        bountyIconSize: "1.4rem",
        labelSize: "1rem",
        streakSize: "1.4rem",
        targetSize: "1.2rem",
    },
    medium: {
        padding: "1rem",
        gap: "1rem",
        borderRadius: "1rem",
        avatarSize: "medium",
        nameSize: "1.4rem",
        bountySize: "1.2rem",
        bountyIconSize: "1.4rem",
        labelSize: "0.7rem",
        streakSize: "0.85rem",
        targetSize: "1.5rem",
    },
    large: {
        padding: "1.5rem",
        gap: "1.5rem",
        borderRadius: "1.2rem",
        avatarSize: "large",
        nameSize: "1.6rem",
        bountySize: "1.5rem",
        bountyIconSize: "1.8rem",
        labelSize: "0.8rem",
        streakSize: "1rem",
        targetSize: "2rem",
    },
};

/* ----------------------------------------
   Animations
----------------------------------------- */
const glowPulseXs = keyframes`
    0%, 100% { box-shadow: 0 0 3px rgba(239, 68, 68, 0.3); }
    50% { box-shadow: 0 0 6px rgba(185, 28, 28, 0.4); }
`;

const glowPulseSmall = keyframes`
    0%, 100% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.3); }
    50% { box-shadow: 0 0 10px rgba(185, 28, 28, 0.4); }
`;

const glowPulseMedium = keyframes`
    0%, 100% {
        box-shadow: 0 0 10px rgba(239, 68, 68, 0.25),
                    0 0 20px rgba(185, 28, 28, 0.15);
    }
    50% {
        box-shadow: 0 0 15px rgba(239, 68, 68, 0.4),
                    0 0 30px rgba(185, 28, 28, 0.25);
    }
`;

const glowPulseLarge = keyframes`
    0%, 100% {
        box-shadow: 0 0 15px rgba(239, 68, 68, 0.25),
                    0 0 30px rgba(185, 28, 28, 0.15);
    }
    50% {
        box-shadow: 0 0 20px rgba(239, 68, 68, 0.4),
                    0 0 40px rgba(185, 28, 28, 0.25);
    }
`;

/* Cold Glow Animations (for losing streaks) */
const coldGlowPulseXs = keyframes`
    0%, 100% { box-shadow: 0 0 3px rgba(59, 130, 246, 0.3); }
    50% { box-shadow: 0 0 6px rgba(29, 78, 216, 0.4); }
`;

const coldGlowPulseSmall = keyframes`
    0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.3); }
    50% { box-shadow: 0 0 10px rgba(29, 78, 216, 0.4); }
`;

const coldGlowPulseMedium = keyframes`
    0%, 100% {
        box-shadow: 0 0 10px rgba(59, 130, 246, 0.25),
                    0 0 20px rgba(29, 78, 216, 0.15);
    }
    50% {
        box-shadow: 0 0 15px rgba(59, 130, 246, 0.4),
                    0 0 30px rgba(29, 78, 216, 0.25);
    }
`;

const coldGlowPulseLarge = keyframes`
    0%, 100% {
        box-shadow: 0 0 15px rgba(59, 130, 246, 0.25),
                    0 0 30px rgba(29, 78, 216, 0.15);
    }
    50% {
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.4),
                    0 0 40px rgba(29, 78, 216, 0.25);
    }
`;

const getGlowAnimation = (size) => {
    switch (size) {
        case "xs":
            return glowPulseXs;
        case "small":
            return glowPulseSmall;
        case "large":
            return glowPulseLarge;
        default:
            return glowPulseMedium;
    }
};

const getColdGlowAnimation = (size) => {
    switch (size) {
        case "xs":
            return coldGlowPulseXs;
        case "small":
            return coldGlowPulseSmall;
        case "large":
            return coldGlowPulseLarge;
        default:
            return coldGlowPulseMedium;
    }
};

/* ----------------------------------------
   Styled Components
----------------------------------------- */
const Card = styled.div`
    display: flex;
    align-items: center;
    gap: ${(props) => sizeConfig[props.$size]?.gap || sizeConfig.medium.gap};
    padding: ${(props) =>
        sizeConfig[props.$size]?.padding || sizeConfig.medium.padding};
    background: var(--secondary-bg-color);
    border-radius: ${(props) =>
        sizeConfig[props.$size]?.borderRadius ||
        sizeConfig.medium.borderRadius};
    border: 1px solid transparent;
    transition: all 0.2s ease;
    cursor: ${(props) => (props.$clickable ? "pointer" : "default")};

    ${(props) =>
        props.$highBounty &&
        css`
            animation: ${getGlowAnimation(props.$size)} 2s ease-in-out infinite;
            border-color: rgba(255, 100, 50, 0.5);
        `}

    ${(props) =>
        props.$coldStreak &&
        !props.$highBounty &&
        css`
            animation: ${getColdGlowAnimation(props.$size)} 2s ease-in-out
                infinite;
            border-color: rgba(100, 180, 255, 0.5);
        `}

    ${(props) =>
        props.$clickable &&
        css`
            &:hover {
                /* transform: translateY(-2px); */
                border-color: var(--primary-color);
            }
        `}
`;

const PlayerInfo = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: ${(props) => (props.$size === "xs" ? "0.1rem" : "0.3rem")};
    min-width: 0;
`;

const PlayerName = styled.span`
    display: flex;
    font-weight: 700;
    gap: 0.8rem;
    font-size: ${(props) =>
        sizeConfig[props.$size]?.nameSize || sizeConfig.medium.nameSize};
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

const BountySection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    align-self: flex-start;
    gap: ${(props) => (props.$size === "xs" ? "0.1rem" : "0.3rem")};
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
    gap: 0.5rem;
    font-size: ${(props) =>
        sizeConfig[props.$size]?.bountySize || sizeConfig.medium.bountySize};
    font-weight: 700;
    color: #ef4444;

    svg {
        font-size: ${(props) =>
            sizeConfig[props.$size]?.bountyIconSize ||
            sizeConfig.medium.bountyIconSize};
    }
`;

const BountyLabel = styled.span`
    font-size: ${(props) =>
        sizeConfig[props.$size]?.labelSize || sizeConfig.medium.labelSize};
    color: var(--secondary-text-color);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: ${(props) => (props.$size === "xs" ? "none" : "block")};
`;

const StreakInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: ${(props) =>
        sizeConfig[props.$size]?.streakSize || sizeConfig.medium.streakSize};
    color: var(--secondary-text-color);
    cursor: ${(props) => (props.$hoverable ? "pointer" : "default")};
    transition: transform 0.2s ease;

    ${(props) =>
        props.$hoverable &&
        css`
            &:hover {
                transform: scale(1.08);
            }
        `}

    svg {
        color: ${(props) => (props.$cold ? "#3B82F6" : "#EF4444")};
        font-size: 1.4em;
    }
`;

const StatusBadgeWrapper = styled.span`
    display: inline-flex;
    cursor: ${(props) => (props.$hoverable ? "pointer" : "default")};
    transition: transform 0.2s ease;

    ${(props) =>
        props.$hoverable &&
        css`
            &:hover {
                transform: scale(1.05);
            }
        `}
`;

const TargetIcon = styled(TbTarget)`
    font-size: ${(props) =>
        sizeConfig[props.$size]?.targetSize || sizeConfig.medium.targetSize};
    color: var(--secondary-text-color);
    opacity: 0.5;
    flex-shrink: 0;
    display: ${(props) => (props.$size === "xs" ? "none" : "block")};
`;

const Divider = styled.div`
    width: 1px;
    height: ${(props) =>
        props.$size === "xs"
            ? "24px"
            : props.$size === "small"
            ? "36px"
            : "40px"};
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

/* ----------------------------------------
   BountyCard Component
   
   Zeigt einen Spieler mit aktivem Kopfgeld
   
   Props:
   - player: { id, name, avatar }
   - bounty: number - Kopfgeld-Wert (total oder für einen Gamemode)
   - bounty1on1: number - Kopfgeld für 1on1 (für Tooltip)
   - bounty2on2: number - Kopfgeld für 2on2 (für Tooltip)
   - streak: number - Aktuelle Siegesserie (beste/angezeigte)
   - streak1on1: number - Streak für 1on1 (für Tooltip)
   - streak2on2: number - Streak für 2on2 (für Tooltip)
   - status: string - Primärer Status (z.B. 'onFire')
   - gamemode: string - '1on1' oder '2on2'
   - size: 'xs' | 'small' | 'medium' | 'large'
   - onClick: function - Callback bei Klick
   - showGamemode: boolean - Zeige Gamemode in Streak Info
   - showStatusBadge: boolean - Zeige Status Badge
   - showTargetIcon: boolean - Zeige Target Icon
   - showLabel: boolean - Zeige "MMR Kopfgeld" Label
   - showBountyTooltip: boolean - Zeige Tooltip bei Hover auf Bounty
   - showStreakTooltip: boolean - Zeige Tooltip bei Hover auf Streak
   - showStatusTooltip: boolean - Zeige Tooltip bei Hover auf Status Badge
   - statuses1on1: string[] - Aktive Status für 1on1 (für StatusTooltip)
   - statuses2on2: string[] - Aktive Status für 2on2 (für StatusTooltip)
----------------------------------------- */
export function BountyCard({
    player,
    bounty = 0,
    bounty1on1 = 0,
    bounty2on2 = 0,
    streak = 0,
    streak1on1 = 0,
    streak2on2 = 0,
    status,
    statuses1on1 = [],
    statuses2on2 = [],
    gamemode,
    size = "medium",
    onClick,
    showGamemode = true,
    showStatusBadge = true,
    showTargetIcon = true,
    showLabel = true,
    showBountyTooltip = true,
    showStreakTooltip = true,
    showStatusTooltip = false,
}) {
    // Bounty tooltip hook
    const {
        isHovered: isBountyHovered,
        tooltipPos: bountyTooltipPos,
        handleMouseEnter: handleBountyMouseEnter,
        handleMouseLeave: handleBountyMouseLeave,
        triggerRef: bountyTriggerRef,
    } = useBountyTooltip(140);

    // Streak tooltip hook
    const {
        isHovered: isStreakHovered,
        tooltipPos: streakTooltipPos,
        handleMouseEnter: handleStreakMouseEnter,
        handleMouseLeave: handleStreakMouseLeave,
        triggerRef: streakTriggerRef,
    } = useBountyTooltip(140);

    // Status tooltip hook
    const {
        isHovered: isStatusHovered,
        tooltipPos: statusTooltipPos,
        handleMouseEnter: handleStatusMouseEnter,
        handleMouseLeave: handleStatusMouseLeave,
        triggerRef: statusTriggerRef,
    } = useBountyTooltip(180);

    const isHighBounty = bounty >= 30;
    const hasBounty = bounty > 0;
    const hasStreak = Math.abs(streak) >= 3;
    const isColdStreak = streak <= -5; // Glow animation for losing streaks of 5+
    const avatarSize = sizeConfig[size]?.avatarSize || "medium";

    // For xs size, simplify the display
    const isXs = size === "xs";
    const isSmall = size === "small";

    // Determine tooltip bounty values
    // If specific values aren't provided, use bounty with gamemode
    const tooltipBounty1on1 = bounty1on1 || (gamemode === "1on1" ? bounty : 0);
    const tooltipBounty2on2 = bounty2on2 || (gamemode === "2on2" ? bounty : 0);
    const hasBountyTooltipData = tooltipBounty1on1 > 0 || tooltipBounty2on2 > 0;

    // Determine tooltip streak values
    // If specific values aren't provided, use streak with gamemode
    const tooltipStreak1on1 = streak1on1 || (gamemode === "1on1" ? streak : 0);
    const tooltipStreak2on2 = streak2on2 || (gamemode === "2on2" ? streak : 0);
    const hasStreakTooltipData =
        Math.abs(tooltipStreak1on1) >= 3 || Math.abs(tooltipStreak2on2) >= 3;

    // Determine if status tooltip should be shown
    const hasStatusTooltipData =
        statuses1on1.length > 0 || statuses2on2.length > 0;

    return (
        <Card
            $size={size}
            $highBounty={isHighBounty}
            $coldStreak={isColdStreak}
            $clickable={!!onClick}
            onClick={onClick}
        >
            <Avatar
                player={player}
                $size={avatarSize}
                showStatus={true}
                // $status={status}
                $cursor={onClick ? "pointer" : "default"}
            />

            <PlayerInfo $size={size}>
                <PlayerName $size={size}>
                    {(() => {
                        const name = player?.name || "Unbekannt";
                        return name.length > 8
                            ? name.slice(0, 7) + "..."
                            : name;
                    })()}
                    {/* StatusBadge with tooltip for xs/small sizes */}
                    {(isXs || isSmall) && status && (
                        <StatusBadgeWrapper
                            $hoverable={
                                showStatusTooltip && hasStatusTooltipData
                            }
                            ref={
                                showStatusTooltip && hasStatusTooltipData
                                    ? statusTriggerRef
                                    : null
                            }
                            onMouseEnter={
                                showStatusTooltip && hasStatusTooltipData
                                    ? handleStatusMouseEnter
                                    : undefined
                            }
                            onMouseLeave={
                                showStatusTooltip && hasStatusTooltipData
                                    ? handleStatusMouseLeave
                                    : undefined
                            }
                        >
                            <StatusBadge
                                status={status}
                                size="small"
                                showLabel
                            />
                        </StatusBadgeWrapper>
                    )}
                    {/* StatusBadge without tooltip for medium/large (shown in StatusRow) */}
                    {!isXs && !isSmall && status && (
                        <StatusBadge status={status} size="small" showLabel />
                    )}
                </PlayerName>

                {/* Status Row - shown for medium and large */}
                {!isXs && !isSmall && showStatusBadge && (
                    <StatusRow>
                        {status && (
                            <StatusBadgeWrapper
                                $hoverable={
                                    showStatusTooltip && hasStatusTooltipData
                                }
                                ref={
                                    showStatusTooltip && hasStatusTooltipData
                                        ? statusTriggerRef
                                        : null
                                }
                                onMouseEnter={
                                    showStatusTooltip && hasStatusTooltipData
                                        ? handleStatusMouseEnter
                                        : undefined
                                }
                                onMouseLeave={
                                    showStatusTooltip && hasStatusTooltipData
                                        ? handleStatusMouseLeave
                                        : undefined
                                }
                            >
                                <StatusBadge
                                    status={status}
                                    size="small"
                                    showLabel
                                />
                            </StatusBadgeWrapper>
                        )}
                        <SimpleStreakBadge streak={streak} />
                    </StatusRow>
                )}

                {/* Streak Info - shown for small sizes inline */}
                {(isXs || isSmall) && (hasBounty || hasStreak) && (
                    <StreakInfo
                        $size={size}
                        $cold={streak < 0}
                        $hoverable={
                            showStreakTooltip &&
                            hasStreakTooltipData &&
                            hasStreak
                        }
                        ref={
                            showStreakTooltip &&
                            hasStreakTooltipData &&
                            hasStreak
                                ? streakTriggerRef
                                : null
                        }
                        onMouseEnter={
                            showStreakTooltip &&
                            hasStreakTooltipData &&
                            hasStreak
                                ? handleStreakMouseEnter
                                : undefined
                        }
                        onMouseLeave={
                            showStreakTooltip &&
                            hasStreakTooltipData &&
                            hasStreak
                                ? handleStreakMouseLeave
                                : undefined
                        }
                    >
                        {hasStreak && (
                            <>
                                {streak > 0 ? (
                                    <HiOutlineFire />
                                ) : (
                                    <TbSnowflake />
                                )}
                                {Math.abs(streak)} {streak > 0 ? "Win" : "Loss"}{" "}
                                Streak
                            </>
                        )}
                        {hasBounty && !hasStreak && (
                            <>
                                <TbTarget style={{ color: "#ff6432" }} />
                            </>
                        )}
                    </StreakInfo>
                )}

                {/* Full streak info with gamemode - medium/large only */}
                {!isXs && !isSmall && gamemode && showGamemode && hasStreak && (
                    <StreakInfo
                        $size={size}
                        $cold={streak < 0}
                        $hoverable={showStreakTooltip && hasStreakTooltipData}
                        ref={
                            showStreakTooltip && hasStreakTooltipData
                                ? streakTriggerRef
                                : null
                        }
                        onMouseEnter={
                            showStreakTooltip && hasStreakTooltipData
                                ? handleStreakMouseEnter
                                : undefined
                        }
                        onMouseLeave={
                            showStreakTooltip && hasStreakTooltipData
                                ? handleStreakMouseLeave
                                : undefined
                        }
                    >
                        {streak > 0 ? <HiOutlineFire /> : <TbSnowflake />}
                        {Math.abs(streak)}{" "}
                        {streak > 0 ? "Siege" : "Niederlagen"} in Folge (
                        {gamemode})
                    </StreakInfo>
                )}
            </PlayerInfo>

            {/* Streak Tooltip */}
            {showStreakTooltip && hasStreakTooltipData && (
                <StreakTooltip
                    isVisible={isStreakHovered}
                    position={streakTooltipPos}
                    streak1on1={tooltipStreak1on1}
                    streak2on2={tooltipStreak2on2}
                />
            )}

            {/* Status Tooltip */}
            {showStatusTooltip && hasStatusTooltipData && (
                <StatusTooltip
                    isVisible={isStatusHovered}
                    position={statusTooltipPos}
                    statuses1on1={statuses1on1}
                    statuses2on2={statuses2on2}
                    streak1on1={tooltipStreak1on1}
                    streak2on2={tooltipStreak2on2}
                />
            )}

            {/* Bounty Section - always shown if bounty > 0 */}
            {hasBounty && (
                <>
                    {/* // horizontal separator */}
                    <Divider $size={size} />
                    <BountySection
                        $size={size}
                        ref={
                            showBountyTooltip && hasBountyTooltipData
                                ? bountyTriggerRef
                                : null
                        }
                        onMouseEnter={
                            showBountyTooltip && hasBountyTooltipData
                                ? handleBountyMouseEnter
                                : undefined
                        }
                        onMouseLeave={
                            showBountyTooltip && hasBountyTooltipData
                                ? handleBountyMouseLeave
                                : undefined
                        }
                    >
                        {showLabel && (
                            <BountyLabel $size={size}>Bounty</BountyLabel>
                        )}
                        <BountyValue $size={size}>💰+{bounty}</BountyValue>
                    </BountySection>

                    {showBountyTooltip && hasBountyTooltipData && (
                        <BountyTooltip
                            isVisible={isBountyHovered}
                            position={bountyTooltipPos}
                            bounty1on1={tooltipBounty1on1}
                            bounty2on2={tooltipBounty2on2}
                        />
                    )}
                </>
            )}

            {showTargetIcon && <TargetIcon $size={size} />}
        </Card>
    );
}

/* ----------------------------------------
   BountyList Component
   
   Liste von Spielern mit Kopfgeldern
   
   Props:
   - players: Array von Bounty-Daten
   - onPlayerClick: function(playerId) - Callback bei Klick
   - size: 'xs' | 'small' | 'medium' | 'large'
----------------------------------------- */
const ListContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
`;

const ListTitle = styled.h3`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--primary-text-color);
    margin-bottom: 0.5rem;

    svg {
        color: #ff6432;
    }
`;

const EmptyState = styled.div`
    text-align: center;
    padding: 2rem;
    color: var(--secondary-text-color);
    font-size: 0.9rem;
`;

export function BountyList({
    players = [],
    onPlayerClick,
    title = "Kopfgelder",
    showTitle = true,
    size = "medium",
}) {
    if (players.length === 0) {
        return (
            <ListContainer>
                {showTitle && (
                    <ListTitle>
                        <TbTarget />
                        {title}
                    </ListTitle>
                )}
                <EmptyState>
                    Keine aktiven Kopfgelder.
                    <br />
                    Starte eine Siegesserie um ein Kopfgeld zu sammeln!
                </EmptyState>
            </ListContainer>
        );
    }

    return (
        <ListContainer>
            {showTitle && (
                <ListTitle>
                    <TbTarget />
                    {title} ({players.length})
                </ListTitle>
            )}
            {players.map((data) => {
                return (
                    <BountyCard
                        key={`${data.player_id}-${data.gamemode}`}
                        player={{
                            id: data.player_id,
                            name: data.player_name,
                            avatar: data.player_avatar,
                        }}
                        bounty={data.current_bounty}
                        streak={data.current_streak}
                        // status={data.primary_status}
                        gamemode={data.gamemode}
                        size={size}
                        onClick={
                            onPlayerClick
                                ? () => onPlayerClick(data.player_id)
                                : undefined
                        }
                    />
                );
            })}
        </ListContainer>
    );
}

export default BountyCard;
