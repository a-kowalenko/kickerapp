import styled from "styled-components";
import Avatar from "../../ui/Avatar";
import { ACTIVITY_STATUS } from "./usePlayersActivity";

/* ----------------------------------------
   PlayerDetailSheet Styles
   
   Content component for MobileTooltipSheet
   Shows combined player details: bounty, status, streak
----------------------------------------- */

const PlayerHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 1.2rem;
    margin-bottom: 1.6rem;
`;

const PlayerInfo = styled.div`
    flex: 1;
    min-width: 0;
`;

const PlayerName = styled.h4`
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--primary-text-color);
    margin: 0 0 0.4rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const PlayerStatus = styled.span`
    font-size: 1.3rem;
    color: ${(props) =>
        props.$status === "online"
            ? "#22c55e"
            : props.$status === "inMatch"
              ? "#22c55e"
              : props.$status === "idle"
                ? "#eab308"
                : "var(--secondary-text-color)"};
    font-weight: 500;
`;

const Section = styled.div`
    padding: 1.2rem 0;
    border-top: 1px solid var(--secondary-border-color);

    &:first-of-type {
        border-top: none;
        padding-top: 0;
    }
`;

const SectionTitle = styled.div`
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--secondary-text-color);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.8rem;
`;

const SectionIcon = styled.span`
    font-size: 1.4rem;
`;

const Row = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.6rem 0;
    font-size: 1.4rem;
`;

const RowLabel = styled.span`
    color: var(--secondary-text-color);
`;

const BountyValue = styled.span`
    font-weight: 600;
    color: var(--color-yellow-600);
    font-size: 1.5rem;
`;

const StreakValue = styled.span`
    font-weight: 600;
    font-size: 1.5rem;
    color: ${(props) => (props.$cold ? "#3B82F6" : "#EF4444")};
    display: flex;
    align-items: center;
    gap: 0.4rem;
`;

const StatusList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
`;

const StatusItem = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.4rem 0;
`;

const StatusIcon = styled.span`
    font-size: 1.5rem;
`;

const StatusLabel = styled.span`
    font-size: 1.4rem;
    color: var(--primary-text-color);
    font-weight: 500;
`;

const GamemodeTag = styled.span`
    font-size: 1.1rem;
    color: var(--secondary-text-color);
    background: var(--tertiary-background-color);
    padding: 0.2rem 0.6rem;
    border-radius: 0.4rem;
    margin-left: auto;
`;

const EmptyText = styled.span`
    color: var(--secondary-text-color);
    font-size: 1.3rem;
    font-style: italic;
`;

const TotalBounty = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    padding: 1rem;
    background: linear-gradient(
        135deg,
        rgba(234, 179, 8, 0.1),
        rgba(234, 179, 8, 0.05)
    );
    border-radius: var(--border-radius-md);
    margin-bottom: 1rem;
`;

const TotalLabel = styled.span`
    font-size: 1.4rem;
    color: var(--secondary-text-color);
`;

const TotalValue = styled.span`
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-yellow-600);
`;

// Maps both camelCase and snake_case keys to icons
const STATUS_ICONS_MAP = {
    warmingUp: "✨",
    hotStreak: "🔥",
    onFire: "🔥",
    legendary: "👑",
    cold: "❄️",
    iceCold: "🥶",
    frozen: "🧊",
    humiliated: "😢",
    dominator: "💪",
    giantSlayer: "⚔️",
    comeback: "🚀",
    underdog: "🐺",
    warming_up: "✨",
    hot_streak: "🔥",
    on_fire: "🔥",
    ice_cold: "🥶",
    giant_slayer: "⚔️",
};

const STATUS_LABELS_MAP = {
    warmingUp: "Warming Up",
    hotStreak: "Hot Streak",
    onFire: "On Fire!",
    legendary: "Legendary",
    cold: "Cold",
    iceCold: "Ice Cold",
    frozen: "Frozen",
    humiliated: "Humiliated",
    dominator: "Dominator",
    giantSlayer: "Giant Slayer",
    comeback: "Comeback",
    underdog: "Underdog",
    warming_up: "Warming Up",
    hot_streak: "Hot Streak",
    on_fire: "On Fire!",
    ice_cold: "Ice Cold",
    giant_slayer: "Giant Slayer",
};

/* ----------------------------------------
   PlayerDetailSheet Component
   
   Shows combined player details in the bottom sheet
   
   Props:
   - player: Object from usePlayersActivity with all player data
----------------------------------------- */
function PlayerDetailSheet({ player }) {
    if (!player) return null;

    const {
        player_id,
        player_name,
        player_avatar,
        activityStatus,
        totalBounty,
        bounty1on1,
        bounty2on2,
        streak1on1,
        streak2on2,
        statuses1on1,
        statuses2on2,
    } = player;

    // Determine online status display
    let statusText = "Offline";
    let statusKey = "offline";
    if (activityStatus === ACTIVITY_STATUS.IN_MATCH) {
        statusText = "In Match";
        statusKey = "inMatch";
    } else if (activityStatus === ACTIVITY_STATUS.ACTIVE) {
        statusText = "Online";
        statusKey = "online";
    } else if (activityStatus === ACTIVITY_STATUS.IDLE) {
        statusText = "Idle";
        statusKey = "idle";
    }

    const hasBounty = totalBounty > 0;
    const hasStreak =
        Math.abs(streak1on1 || 0) >= 3 || Math.abs(streak2on2 || 0) >= 3;
    const hasStatuses =
        (statuses1on1?.length || 0) > 0 || (statuses2on2?.length || 0) > 0;

    // Combine statuses with gamemode info
    const allStatuses = [
        ...(statuses1on1 || []).map((s) => ({ status: s, gamemode: "1on1" })),
        ...(statuses2on2 || []).map((s) => ({ status: s, gamemode: "2on2" })),
    ];

    return (
        <>
            <PlayerHeader>
                <Avatar
                    player={{
                        id: player_id,
                        name: player_name,
                        avatar: player_avatar,
                    }}
                    $size="medium"
                    showStatusEffects={false}
                    showStatus={false}
                />
                <PlayerInfo>
                    <PlayerName>{player_name}</PlayerName>
                    <PlayerStatus $status={statusKey}>{statusText}</PlayerStatus>
                </PlayerInfo>
            </PlayerHeader>

            {/* Bounty Section */}
            {hasBounty && (
                <Section>
                    <SectionTitle>
                        <SectionIcon>💰</SectionIcon>
                        Active Bounty
                    </SectionTitle>
                    <TotalBounty>
                        <TotalLabel>Total:</TotalLabel>
                        <TotalValue>+{totalBounty}</TotalValue>
                    </TotalBounty>
                    {bounty1on1 > 0 && (
                        <Row>
                            <RowLabel>1on1</RowLabel>
                            <BountyValue>+{bounty1on1}</BountyValue>
                        </Row>
                    )}
                    {bounty2on2 > 0 && (
                        <Row>
                            <RowLabel>2on2</RowLabel>
                            <BountyValue>+{bounty2on2}</BountyValue>
                        </Row>
                    )}
                </Section>
            )}

            {/* Streak Section */}
            {hasStreak && (
                <Section>
                    <SectionTitle>
                        <SectionIcon>
                            {(streak1on1 > 0 || streak2on2 > 0) ? "🔥" : "❄️"}
                        </SectionIcon>
                        Streak
                    </SectionTitle>
                    {Math.abs(streak1on1 || 0) >= 3 && (
                        <Row>
                            <RowLabel>1on1</RowLabel>
                            <StreakValue $cold={streak1on1 < 0}>
                                {streak1on1 > 0 ? "+" : ""}
                                {streak1on1}
                                {streak1on1 > 0 ? " 🔥" : " ❄️"}
                            </StreakValue>
                        </Row>
                    )}
                    {Math.abs(streak2on2 || 0) >= 3 && (
                        <Row>
                            <RowLabel>2on2</RowLabel>
                            <StreakValue $cold={streak2on2 < 0}>
                                {streak2on2 > 0 ? "+" : ""}
                                {streak2on2}
                                {streak2on2 > 0 ? " 🔥" : " ❄️"}
                            </StreakValue>
                        </Row>
                    )}
                </Section>
            )}

            {/* Status Section */}
            {hasStatuses && (
                <Section>
                    <SectionTitle>
                        <SectionIcon>📊</SectionIcon>
                        Active Status
                    </SectionTitle>
                    <StatusList>
                        {allStatuses.map(({ status, gamemode }) => (
                            <StatusItem key={`${status}-${gamemode}`}>
                                <StatusIcon>
                                    {STATUS_ICONS_MAP[status] || "•"}
                                </StatusIcon>
                                <StatusLabel>
                                    {STATUS_LABELS_MAP[status] || status}
                                </StatusLabel>
                                <GamemodeTag>{gamemode}</GamemodeTag>
                            </StatusItem>
                        ))}
                    </StatusList>
                </Section>
            )}

            {/* Empty state if no special data */}
            {!hasBounty && !hasStreak && !hasStatuses && (
                <Section>
                    <EmptyText>No active bounty, streak or status</EmptyText>
                </Section>
            )}
        </>
    );
}

export default PlayerDetailSheet;
