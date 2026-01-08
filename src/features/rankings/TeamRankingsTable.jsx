import styled, { css, keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import Avatar from "../../ui/Avatar";
import {
    DEFAULT_AVATAR,
    media,
    TEAM_STATUS_ACTIVE,
} from "../../utils/constants";
import LoadingSpinner from "../../ui/LoadingSpinner";
import useWindowWidth from "../../hooks/useWindowWidth";
import { useActiveTeams } from "../teams/useTeams";

const Content = styled.div`
    @media (max-width: 768px) {
        padding: 0 1.2rem;
    }
`;

/* ----------------------------------------
   MMR Color Helpers (CS2-inspired)
----------------------------------------- */
const getMmrColor = (mmr) => {
    if (mmr >= 1500) return "var(--mmr-gold)";
    if (mmr >= 1400) return "var(--mmr-red)";
    if (mmr >= 1300) return "var(--mmr-pink)";
    if (mmr >= 1100) return "var(--mmr-purple)";
    if (mmr >= 900) return "var(--mmr-blue)";
    if (mmr >= 700) return "var(--mmr-cyan)";
    return "var(--mmr-grey)";
};

const getMmrGlow = (mmr) => {
    if (mmr >= 1500) return "0 0 8px rgba(255, 215, 0, 0.5)";
    if (mmr >= 1400) return "0 0 6px rgba(255, 59, 59, 0.4)";
    if (mmr >= 1300) return "0 0 5px rgba(255, 75, 199, 0.35)";
    return "none";
};

/* ----------------------------------------
   Gold Shimmer Animation
----------------------------------------- */
const goldShimmer = keyframes`
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
`;

const Rank = styled.div`
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--color-grey-600);

    ${media.mobile} {
        font-size: 1.2rem;
    }
`;

const Stat = styled.div`
    font-family: "Sono";
    font-size: 1.6rem;
    font-weight: 500;
    text-align: center;

    ${media.mobile} {
        font-size: 1.2rem;
    }
`;

const DesktopTeamRow = styled.div`
    display: grid;
    grid-template-columns: 0.3fr 2fr 1fr 1fr 1fr 1fr 1fr;
    column-gap: 2.4rem;
    align-items: center;
    padding: 1.2rem 2.4rem;
    position: relative;
    cursor: pointer;
    transition: background-color 0.2s ease;
    border-bottom: 1px solid var(--table-border-color);

    &:hover {
        background-color: var(--table-row-color-hover);
        box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1), 0 2px 5px rgba(0, 0, 0, 0.1);
    }

    &:last-child {
        border-bottom: none;
    }

    ${media.tablet} {
        column-gap: 1.2rem;
        grid-template-columns: 0.3fr 1.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr;
    }
`;

const MobileTeamCard = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background: var(--table-background-color);
    border: 1px solid var(--table-border-color);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
        background-color: var(--color-grey-50);
    }
`;

const MobileCardHeader = styled.div`
    display: flex;
    gap: 0.8rem;
    align-items: center;
    justify-content: space-between;
`;

const MobileCardStats = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
    gap: 1rem;
`;

const MobileStatItem = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    align-items: center;
`;

const MobileStatLabel = styled.div`
    font-size: 0.85rem;
    color: var(--color-grey-500);
    text-transform: uppercase;
    letter-spacing: 0.3px;
    font-weight: 500;
`;

const MobileStatValue = styled.div`
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--primary-text-color);
    text-align: center;
`;

const MmrValue = styled.span`
    color: ${(props) => props.$color};
    font-weight: 600;
    font-size: 1.6rem;

    ${media.mobile} {
        font-size: 1.2rem;
    }

    /* Glow only on desktop */
    ${(props) =>
        props.$glow !== "none" &&
        css`
            ${media.desktop} {
                text-shadow: ${props.$glow};
            }
        `}

    /* Gold Shimmer Animation - desktop only */
    ${(props) =>
        props.$isGold &&
        css`
            ${media.desktop} {
                background: linear-gradient(
                    90deg,
                    var(--mmr-gold) 0%,
                    var(--mmr-gold-light) 25%,
                    var(--mmr-gold) 50%,
                    var(--mmr-gold-light) 75%,
                    var(--mmr-gold) 100%
                );
                background-size: 200% auto;
                -webkit-background-clip: text;
                background-clip: text;
                -webkit-text-fill-color: transparent;
                animation: ${goldShimmer} 3s linear infinite;
            }
        `}
`;

const TeamInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 1.2rem;

    ${media.mobile} {
        gap: 0.8rem;
    }
`;

const TeamLogo = styled.img`
    width: 4rem;
    height: 4rem;
    border-radius: var(--border-radius-sm);
    object-fit: cover;

    ${media.mobile} {
        width: 3rem;
        height: 3rem;
    }
`;

const DefaultLogo = styled.div`
    width: 4rem;
    height: 4rem;
    border-radius: var(--border-radius-sm);
    background: linear-gradient(
        135deg,
        var(--color-brand-100) 0%,
        var(--color-brand-200) 100%
    );
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--color-brand-600);

    ${media.mobile} {
        width: 3rem;
        height: 3rem;
        font-size: 1.1rem;
    }
`;

const TeamDetails = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;

    ${media.mobile} {
        gap: 0.3rem;
    }
`;

const TeamName = styled.span`
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--primary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    ${media.mobile} {
        font-size: 1.2rem;
    }
`;

const TeamPlayers = styled.span`
    font-size: 1.2rem;
    color: var(--color-grey-500);
    display: flex;
    align-items: center;
    gap: 0.4rem;

    ${media.tablet} {
        display: none;
    }
`;

const PlayerAvatars = styled.div`
    display: flex;
    align-items: center;

    & > *:not(:first-child) {
        margin-left: -0.4rem;
    }
`;

const NoTeamsMessage = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    color: var(--tertiary-text-color);
    font-size: 1.4rem;
`;

function TeamRankingsRow({ team, rank }) {
    const navigate = useNavigate();
    const { isMobile } = useWindowWidth();

    const mmrColor = getMmrColor(team.mmr);
    const mmrGlow = getMmrGlow(team.mmr);
    const isGold = team.mmr >= 1500;
    const totalGames = team.wins + team.losses;
    const winrate =
        totalGames > 0 ? ((team.wins / totalGames) * 100).toFixed(0) : 0;

    // Support both flat (from RPC) and nested (from teams table) player data
    const player1Name = team.player1_name || team.player1?.name;
    const player2Name = team.player2_name || team.player2?.name;
    const player1Avatar = team.player1_avatar || team.player1?.avatar;
    const player2Avatar = team.player2_avatar || team.player2?.avatar;

    const getInitials = (name) =>
        name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

    if (isMobile) {
        return (
            <MobileTeamCard onClick={() => navigate(`/team/${team.id}`)}>
                <MobileCardHeader>
                    <Rank>{rank}</Rank>
                    <TeamInfo style={{ flex: 1 }}>
                        {team.logo_url ? (
                            <TeamLogo src={team.logo_url} alt={team.name} />
                        ) : (
                            <DefaultLogo>{getInitials(team.name)}</DefaultLogo>
                        )}
                        <TeamDetails>
                            <TeamName>{team.name}</TeamName>
                            <TeamPlayers>
                                <PlayerAvatars>
                                    <Avatar
                                        $size="xs"
                                        src={player1Avatar || DEFAULT_AVATAR}
                                    />
                                    <Avatar
                                        $size="xs"
                                        src={player2Avatar || DEFAULT_AVATAR}
                                    />
                                </PlayerAvatars>
                            </TeamPlayers>
                        </TeamDetails>
                    </TeamInfo>
                </MobileCardHeader>
                <MobileCardStats>
                    <MobileStatItem>
                        <MobileStatLabel>W</MobileStatLabel>
                        <MobileStatValue>{team.wins}</MobileStatValue>
                    </MobileStatItem>
                    <MobileStatItem>
                        <MobileStatLabel>L</MobileStatLabel>
                        <MobileStatValue>{team.losses}</MobileStatValue>
                    </MobileStatItem>
                    <MobileStatItem>
                        <MobileStatLabel>T</MobileStatLabel>
                        <MobileStatValue>{totalGames}</MobileStatValue>
                    </MobileStatItem>
                    <MobileStatItem>
                        <MobileStatLabel>Wr</MobileStatLabel>
                        <MobileStatValue>{winrate}%</MobileStatValue>
                    </MobileStatItem>
                    <MobileStatItem>
                        <MobileStatLabel>MMR</MobileStatLabel>
                        <MobileStatValue>
                            <MmrValue
                                $color={mmrColor}
                                $glow={mmrGlow}
                                $isGold={isGold}
                            >
                                {Math.round(team.mmr)}
                            </MmrValue>
                        </MobileStatValue>
                    </MobileStatItem>
                </MobileCardStats>
            </MobileTeamCard>
        );
    }

    return (
        <DesktopTeamRow onClick={() => navigate(`/team/${team.id}`)}>
            <Rank>{rank}</Rank>
            <TeamInfo>
                {team.logo_url ? (
                    <TeamLogo src={team.logo_url} alt={team.name} />
                ) : (
                    <DefaultLogo>{getInitials(team.name)}</DefaultLogo>
                )}
                <TeamDetails>
                    <TeamName>{team.name}</TeamName>
                    <TeamPlayers>
                        <PlayerAvatars>
                            <Avatar
                                $size="xs"
                                src={player1Avatar || DEFAULT_AVATAR}
                            />
                            <Avatar
                                $size="xs"
                                src={player2Avatar || DEFAULT_AVATAR}
                            />
                        </PlayerAvatars>
                        <span>
                            {player1Name} & {player2Name}
                        </span>
                    </TeamPlayers>
                </TeamDetails>
            </TeamInfo>
            <Stat>{team.wins}</Stat>
            <Stat>{team.losses}</Stat>
            <Stat>{totalGames}</Stat>
            <Stat>{winrate}%</Stat>
            <Stat>
                <MmrValue $color={mmrColor} $glow={mmrGlow} $isGold={isGold}>
                    {Math.round(team.mmr)}
                </MmrValue>
            </Stat>
        </DesktopTeamRow>
    );
}

function TeamRankingsTable() {
    const { teams, isLoading } = useActiveTeams();
    const { isDesktop, isTablet, isMobile } = useWindowWidth();

    // Teams are already filtered (active only) and sorted by MMR from useActiveTeams
    const activeTeams = teams || [];

    if (isMobile) {
        return (
            <Content>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.8rem",
                    }}
                >
                    {isLoading ? (
                        <LoadingSpinner />
                    ) : activeTeams.length === 0 ? (
                        <NoTeamsMessage>
                            No teams have been created yet. Create a team to get
                            started!
                        </NoTeamsMessage>
                    ) : (
                        activeTeams.map((team, index) => (
                            <TeamRankingsRow
                                key={team.id}
                                team={team}
                                rank={index + 1}
                            />
                        ))
                    )}
                </div>
            </Content>
        );
    }

    const columns = "0.3fr 2fr 1fr 1fr 1fr 1fr 1fr";

    return (
        <Content>
            <div
                style={{
                    border: "1px solid var(--table-border-color)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "2px 2px 2px 1px rgba(0, 0, 0, 0.2)",
                }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: isTablet
                            ? "0.3fr 1.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr"
                            : columns,
                        columnGap: isTablet ? "1.2rem" : "2.4rem",
                        alignItems: "center",
                        padding: "1.6rem 2.4rem",
                        backgroundColor: "var(--primary-background-color)",
                        borderBottom: "1px solid var(--table-border-color)",
                        textTransform: "uppercase",
                        letterSpacing: "0.4px",
                        color: "var(--primary-text-color)",
                    }}
                >
                    <div>Rank</div>
                    <div>Team</div>
                    <div style={{ textAlign: "center" }}>Wins</div>
                    <div style={{ textAlign: "center" }}>Losses</div>
                    <div style={{ textAlign: "center" }}>Total</div>
                    <div style={{ textAlign: "center" }}>Winrate</div>
                    <div style={{ textAlign: "center" }}>MMR</div>
                </div>
                {isLoading ? (
                    <div style={{ padding: "2rem", textAlign: "center" }}>
                        <LoadingSpinner />
                    </div>
                ) : activeTeams.length === 0 ? (
                    <NoTeamsMessage>
                        No teams have been created yet. Create a team to get
                        started!
                    </NoTeamsMessage>
                ) : (
                    <div>
                        {activeTeams.map((team, index) => (
                            <TeamRankingsRow
                                key={team.id}
                                team={team}
                                rank={index + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        </Content>
    );
}

export default TeamRankingsTable;
