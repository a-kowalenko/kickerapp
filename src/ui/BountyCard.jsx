import styled, { keyframes } from "styled-components";
import Avatar from "./Avatar";
import { StatusBadge, SimpleStreakBadge } from "./StatusBadge";
import { HiOutlineFire, HiOutlineCurrencyDollar } from "react-icons/hi2";
import { TbTarget } from "react-icons/tb";

/* ----------------------------------------
   Animations
----------------------------------------- */
const glowPulse = keyframes`
    0%, 100% {
        box-shadow: 0 0 10px rgba(255, 100, 50, 0.3),
                    0 0 20px rgba(255, 100, 50, 0.2);
    }
    50% {
        box-shadow: 0 0 15px rgba(255, 100, 50, 0.5),
                    0 0 30px rgba(255, 100, 50, 0.3);
    }
`;

/* ----------------------------------------
   Styled Components
----------------------------------------- */
const Card = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--secondary-bg-color);
    border-radius: 1rem;
    border: 1px solid var(--primary-border-color);
    transition: all 0.2s ease;

    ${(props) =>
        props.$highBounty &&
        `
        animation: ${glowPulse} 2s ease-in-out infinite;
        border-color: rgba(255, 100, 50, 0.5);
    `}

    &:hover {
        transform: translateY(-2px);
        border-color: var(--primary-color);
    }
`;

const PlayerInfo = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
`;

const PlayerName = styled.span`
    font-weight: 600;
    font-size: 1rem;
    color: var(--primary-text-color);
`;

const StatusRow = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
`;

const BountySection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.3rem;
`;

const BountyValue = styled.div`
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 1.2rem;
    font-weight: 700;
    color: #ff6432;

    svg {
        font-size: 1.4rem;
    }
`;

const BountyLabel = styled.span`
    font-size: 0.7rem;
    color: var(--secondary-text-color);
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const StreakInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    color: var(--secondary-text-color);

    svg {
        color: #ff6432;
    }
`;

const TargetIcon = styled(TbTarget)`
    font-size: 1.5rem;
    color: var(--secondary-text-color);
    opacity: 0.5;
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
   - onClick: function - Callback bei Klick
----------------------------------------- */
export function BountyCard({
    player,
    bounty,
    streak,
    status,
    gamemode,
    onClick,
}) {
    const isHighBounty = bounty >= 30;

    return (
        <Card $highBounty={isHighBounty} onClick={onClick}>
            <Avatar
                player={player}
                $size="medium"
                $status={status}
                $cursor={onClick ? "pointer" : "none"}
            />

            <PlayerInfo>
                <PlayerName>{player?.name || "Unbekannt"}</PlayerName>
                <StatusRow>
                    {status && (
                        <StatusBadge status={status} size="small" showLabel />
                    )}
                    <SimpleStreakBadge streak={streak} />
                </StatusRow>
                {gamemode && (
                    <StreakInfo>
                        <HiOutlineFire />
                        {streak} Siege in Folge ({gamemode})
                    </StreakInfo>
                )}
            </PlayerInfo>

            <BountySection>
                <BountyValue>
                    <HiOutlineCurrencyDollar />+{bounty}
                </BountyValue>
                <BountyLabel>MMR Kopfgeld</BountyLabel>
            </BountySection>

            <TargetIcon />
        </Card>
    );
}

/* ----------------------------------------
   BountyList Component
   
   Liste von Spielern mit Kopfgeldern
   
   Props:
   - players: Array von Bounty-Daten
   - onPlayerClick: function(playerId) - Callback bei Klick
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
