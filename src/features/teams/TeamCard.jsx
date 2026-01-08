import styled, { css } from "styled-components";
import { Link } from "react-router-dom";
import Avatar from "../../ui/Avatar";
import {
    DEFAULT_AVATAR,
    media,
    TEAM_STATUS_DISSOLVED,
} from "../../utils/constants";
import { HiOutlineTrophy } from "react-icons/hi2";

/* ----------------------------------------
   MMR Color Helpers (same as RankingsRow)
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

const getRankColor = (rank) => {
    if (rank === 1) return "linear-gradient(135deg, #FFD700 0%, #FFC107 100%)";
    if (rank === 2) return "linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)";
    if (rank === 3) return "linear-gradient(135deg, #CD7F32 0%, #A0522D 100%)";
    return "var(--color-grey-100)";
};

const CardContainer = styled(Link)`
    display: flex;
    flex-direction: column;
    background-color: var(--color-grey-0);
    border: 1px solid var(--secondary-border-color);
    border-radius: var(--border-radius-md);
    overflow: hidden;
    transition: all 0.2s ease;
    text-decoration: none;
    color: inherit;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

    &:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        border-color: var(--color-brand-500);
    }

    ${(props) =>
        props.$dissolved &&
        css`
            opacity: 0.7;
            background-color: var(--color-grey-50);

            &:hover {
                opacity: 0.85;
                border-color: var(--color-grey-400);
            }
        `}
`;

const CardHeader = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    gap: 1.6rem;
    padding: 2rem;
    background: linear-gradient(
        135deg,
        var(--color-grey-50) 0%,
        var(--color-grey-100) 100%
    );
    border-bottom: 1px solid var(--secondary-border-color);

    ${media.mobile} {
        padding: 1.6rem;
        gap: 1.2rem;
    }
`;

const RankBadge = styled.div`
    position: absolute;
    top: 1rem;
    right: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.2rem;
    height: 3.2rem;
    border-radius: 50%;
    background: ${(props) => getRankColor(props.$rank)};
    font-size: 1.4rem;
    font-weight: 700;
    color: ${(props) =>
        props.$rank <= 3 ? "var(--color-grey-800)" : "var(--color-grey-600)"};
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);

    ${media.mobile} {
        width: 2.8rem;
        height: 2.8rem;
        font-size: 1.2rem;
        top: 0.8rem;
        right: 0.8rem;
    }
`;

const TeamLogoContainer = styled.div`
    position: relative;
    flex-shrink: 0;
`;

const TeamLogo = styled.img`
    width: 6.4rem;
    height: 6.4rem;
    border-radius: var(--border-radius-lg);
    object-fit: cover;
    border: 3px solid var(--color-grey-0);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

    ${media.mobile} {
        width: 5.6rem;
        height: 5.6rem;
    }
`;

const DefaultLogo = styled.div`
    width: 6.4rem;
    height: 6.4rem;
    border-radius: var(--border-radius-lg);
    background: linear-gradient(
        135deg,
        var(--color-brand-500) 0%,
        var(--color-brand-600) 100%
    );
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.4rem;
    font-weight: 700;
    color: white;
    border: 3px solid var(--color-grey-0);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

    ${media.mobile} {
        width: 5.6rem;
        height: 5.6rem;
        font-size: 2rem;
    }
`;

const TeamInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    flex: 1;
    min-width: 0;
`;

const TeamName = styled.h3`
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--primary-text-color);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    ${media.mobile} {
        font-size: 1.6rem;
    }
`;

const PlayersRow = styled.div`
    display: flex;
    align-items: center;
    gap: 0.6rem;
`;

const PlayerItem = styled.div`
    display: flex;
    align-items: center;
    gap: 0.4rem;
`;

const StyledAvatar = styled(Avatar)`
    width: 2rem;
    height: 2rem;
    border: 1.5px solid var(--color-grey-0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
`;

const PlayerName = styled.span`
    font-size: 1.2rem;
    color: var(--color-grey-600);
    max-width: 8rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    ${media.mobile} {
        font-size: 1.1rem;
        max-width: 6rem;
    }
`;

const PlayerDivider = styled.span`
    font-size: 1.1rem;
    color: var(--color-grey-400);
    margin: 0 0.2rem;
`;

const CardBody = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.6rem 2rem;
    gap: 1rem;

    ${media.mobile} {
        padding: 1.2rem 1.6rem;
    }
`;

const StatsGrid = styled.div`
    display: flex;
    gap: 2rem;

    ${media.mobile} {
        gap: 1.2rem;
    }
`;

const StatItem = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
`;

const StatValue = styled.span`
    font-family: "Sono";
    font-size: 1.8rem;
    font-weight: 600;
    color: ${(props) => props.$color || "var(--primary-text-color)"};

    ${media.mobile} {
        font-size: 1.6rem;
    }
`;

const StatLabel = styled.span`
    font-size: 1.1rem;
    color: var(--color-grey-500);
    text-transform: uppercase;
    letter-spacing: 0.05em;
`;

const WinRateContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.4rem;
`;

const WinRate = styled.span`
    font-family: "Sono";
    font-size: 2rem;
    font-weight: 700;
    color: ${(props) =>
        props.$rate >= 60
            ? "var(--color-green-600)"
            : props.$rate >= 40
            ? "var(--color-yellow-600)"
            : "var(--color-red-600)"};

    ${media.mobile} {
        font-size: 1.8rem;
    }
`;

const WinRateLabel = styled.span`
    font-size: 1.1rem;
    color: var(--color-grey-500);
    text-transform: uppercase;
    letter-spacing: 0.05em;
`;

const DissolvedBadge = styled.div`
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 1.2rem;
    background-color: var(--color-grey-200);
    color: var(--color-grey-600);
    border-radius: var(--border-radius-sm);
    font-size: 1.2rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
`;

function TeamCard({ team, rank, showRank = false }) {
    const { id, name, logo_url, status, mmr, wins, losses } = team;

    // Normalize data to handle both flat (from useTeams RPC) and nested (from useMyTeams) formats
    const player1Name = team.player1_name || team.player1?.name;
    const player2Name = team.player2_name || team.player2?.name;
    const player1Avatar = team.player1_avatar || team.player1?.avatar;
    const player2Avatar = team.player2_avatar || team.player2?.avatar;

    const isDissolved = status === TEAM_STATUS_DISSOLVED;
    const mmrColor = getMmrColor(mmr);
    const totalGames = wins + losses;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
    const initials = name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <CardContainer to={`/team/${id}`} $dissolved={isDissolved}>
            <CardHeader>
                {showRank && <RankBadge $rank={rank}>{rank}</RankBadge>}

                <TeamLogoContainer>
                    {logo_url ? (
                        <TeamLogo src={logo_url} alt={name} />
                    ) : (
                        <DefaultLogo>{initials}</DefaultLogo>
                    )}
                </TeamLogoContainer>

                <TeamInfo>
                    <TeamName>{name}</TeamName>
                    <PlayersRow>
                        <PlayerItem>
                            <StyledAvatar
                                src={player1Avatar || DEFAULT_AVATAR}
                            />
                            <PlayerName>{player1Name}</PlayerName>
                        </PlayerItem>
                        <PlayerDivider>&</PlayerDivider>
                        <PlayerItem>
                            <StyledAvatar
                                src={player2Avatar || DEFAULT_AVATAR}
                            />
                            <PlayerName>{player2Name}</PlayerName>
                        </PlayerItem>
                    </PlayersRow>
                </TeamInfo>
            </CardHeader>

            <CardBody>
                {isDissolved ? (
                    <DissolvedBadge>
                        <HiOutlineTrophy /> Dissolved
                    </DissolvedBadge>
                ) : (
                    <>
                        <StatsGrid>
                            <StatItem>
                                <StatValue $color={mmrColor}>{mmr}</StatValue>
                                <StatLabel>MMR</StatLabel>
                            </StatItem>
                            <StatItem>
                                <StatValue>{wins}</StatValue>
                                <StatLabel>Wins</StatLabel>
                            </StatItem>
                            <StatItem>
                                <StatValue>{losses}</StatValue>
                                <StatLabel>Losses</StatLabel>
                            </StatItem>
                        </StatsGrid>
                        <WinRateContainer>
                            <WinRate $rate={winRate}>{winRate}%</WinRate>
                            <WinRateLabel>Win Rate</WinRateLabel>
                        </WinRateContainer>
                    </>
                )}
            </CardBody>
        </CardContainer>
    );
}

export default TeamCard;
