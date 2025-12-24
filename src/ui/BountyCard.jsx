import styled, { keyframes, css } from "styled-components";
import Avatar from "./Avatar";
import { StatusBadge, SimpleStreakBadge } from "./StatusBadge";
import { HiOutlineFire, HiOutlineCurrencyDollar } from "react-icons/hi2";
import { TbTarget } from "react-icons/tb";

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
    0%, 100% { box-shadow: 0 0 3px rgba(255, 100, 50, 0.3); }
    50% { box-shadow: 0 0 6px rgba(255, 100, 50, 0.5); }
`;

const glowPulseSmall = keyframes`
    0%, 100% { box-shadow: 0 0 5px rgba(255, 100, 50, 0.3); }
    50% { box-shadow: 0 0 10px rgba(255, 100, 50, 0.5); }
`;

const glowPulseMedium = keyframes`
    0%, 100% {
        box-shadow: 0 0 10px rgba(255, 100, 50, 0.3),
                    0 0 20px rgba(255, 100, 50, 0.2);
    }
    50% {
        box-shadow: 0 0 15px rgba(255, 100, 50, 0.5),
                    0 0 30px rgba(255, 100, 50, 0.3);
    }
`;

const glowPulseLarge = keyframes`
    0%, 100% {
        box-shadow: 0 0 15px rgba(255, 100, 50, 0.3),
                    0 0 30px rgba(255, 100, 50, 0.2);
    }
    50% {
        box-shadow: 0 0 20px rgba(255, 100, 50, 0.5),
                    0 0 40px rgba(255, 100, 50, 0.3);
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
    font-weight: 700;
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
    align-items: flex-end;
    align-self: flex-start;
    gap: ${(props) => (props.$size === "xs" ? "0.1rem" : "0.3rem")};
    flex-shrink: 0;
`;

const BountyValue = styled.div`
    display: flex;
    align-items: center;
    gap: 0.2rem;
    font-size: ${(props) =>
        sizeConfig[props.$size]?.bountySize || sizeConfig.medium.bountySize};
    font-weight: 700;
    color: #ff6432;

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

    svg {
        color: #ff6432;
        font-size: 1.4em;
    }
`;

const TargetIcon = styled(TbTarget)`
    font-size: ${(props) =>
        sizeConfig[props.$size]?.targetSize || sizeConfig.medium.targetSize};
    color: var(--secondary-text-color);
    opacity: 0.5;
    flex-shrink: 0;
    display: ${(props) => (props.$size === "xs" ? "none" : "block")};
`;

/* ----------------------------------------
   BountyCard Component
   
   Zeigt einen Spieler mit aktivem Kopfgeld
   
   Props:
   - player: { id, name, avatar }
   - bounty: number - Kopfgeld-Wert in MMR
   - streak: number - Aktuelle Siegesserie
   - status: string - Primärer Status (z.B. 'onFire')
   - gamemode: string - '1on1' oder '2on2'
   - size: 'xs' | 'small' | 'medium' | 'large'
   - onClick: function - Callback bei Klick
   - showGamemode: boolean - Zeige Gamemode in Streak Info
   - showStatusBadge: boolean - Zeige Status Badge
   - showTargetIcon: boolean - Zeige Target Icon
   - showLabel: boolean - Zeige "MMR Kopfgeld" Label
----------------------------------------- */
export function BountyCard({
    player,
    bounty = 0,
    streak = 0,
    status,
    gamemode,
    size = "medium",
    onClick,
    showGamemode = true,
    showStatusBadge = true,
    showTargetIcon = true,
    showLabel = true,
}) {
    const isHighBounty = bounty >= 30;
    const hasBounty = bounty > 0;
    const hasStreak = streak >= 3;
    const avatarSize = sizeConfig[size]?.avatarSize || "medium";

    // For xs size, simplify the display
    const isXs = size === "xs";
    const isSmall = size === "small";

    return (
        <Card
            $size={size}
            $highBounty={isHighBounty}
            $clickable={!!onClick}
            onClick={onClick}
        >
            <Avatar
                player={player}
                $size={avatarSize}
                $status={hasBounty ? "hotStreak" : status}
                $cursor={onClick ? "pointer" : "default"}
            />

            <PlayerInfo $size={size}>
                <PlayerName $size={size}>
                    {player?.name || "Unbekannt"}
                </PlayerName>

                {/* Status Row - shown for medium and large */}
                {!isXs && !isSmall && showStatusBadge && (
                    <StatusRow>
                        {status && (
                            <StatusBadge
                                status={status}
                                size="small"
                                showLabel
                            />
                        )}
                        <SimpleStreakBadge streak={streak} />
                    </StatusRow>
                )}

                {/* Streak Info - shown for small sizes inline */}
                {(isXs || isSmall) && (hasBounty || hasStreak) && (
                    <StreakInfo $size={size}>
                        {hasStreak && (
                            <>
                                <HiOutlineFire />
                                {streak}
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
                    <StreakInfo $size={size}>
                        <HiOutlineFire />
                        {streak} Siege in Folge ({gamemode})
                    </StreakInfo>
                )}
            </PlayerInfo>

            {/* Bounty Section - always shown if bounty > 0 */}
            {hasBounty && (
                <>
                    {/* // horizontal separator */}
                    <hr
                        style={{
                            border: "none",
                            borderLeft: "1px solid var(--secondary-text-color)",
                            height: "40px",
                        }}
                    />
                    <BountySection $size={size}>
                        <BountyValue $size={size}>💰+{bounty}</BountyValue>
                        {showLabel && (
                            <BountyLabel $size={size}>Bounty</BountyLabel>
                        )}
                    </BountySection>
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
            {players.map((data) => (
                <BountyCard
                    key={`${data.player_id}-${data.gamemode}`}
                    player={{
                        id: data.player_id,
                        name: data.player_name,
                        avatar: data.player_avatar,
                    }}
                    bounty={data.current_bounty}
                    streak={data.current_streak}
                    status={data.primary_status}
                    gamemode={data.gamemode}
                    size={size}
                    onClick={
                        onPlayerClick
                            ? () => onPlayerClick(data.player_id)
                            : undefined
                    }
                />
            ))}
        </ListContainer>
    );
}

export default BountyCard;
