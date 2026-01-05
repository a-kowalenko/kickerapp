import styled from "styled-components";
import { Link } from "react-router-dom";
import { HiOutlineUser, HiOutlineTrophy } from "react-icons/hi2";
import Avatar from "../../ui/Avatar";
import {
    DEFAULT_AVATAR,
    media,
    TEAM_STATUS_DISSOLVED,
} from "../../utils/constants";

/* ----------------------------------------
   MMR Color Helpers
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

const StyledTeamOverview = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2.4rem;

    ${media.tablet} {
        padding: 0 2.4rem;
    }

    ${media.mobile} {
        padding: 0;
        gap: 1.6rem;
    }
`;

const Card = styled.div`
    background-color: var(--color-grey-0);
    border: 1px solid var(--secondary-border-color);
    border-radius: var(--border-radius-md);
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    ${media.tablet} {
        border-radius: var(--border-radius-sm);
    }

    ${media.mobile} {
        border-radius: 0;
        border-left: none;
        border-right: none;
    }
`;

const CardHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding: 2rem 2.4rem;
    background-color: var(--color-grey-50);
    border-bottom: 1px solid var(--secondary-border-color);

    ${media.mobile} {
        padding: 1.6rem;
    }
`;

const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    background-color: var(--primary-button-color);
    color: var(--primary-button-color-text);

    svg {
        width: 2rem;
        height: 2rem;
    }

    ${media.mobile} {
        width: 3.2rem;
        height: 3.2rem;

        svg {
            width: 1.6rem;
            height: 1.6rem;
        }
    }
`;

const HeaderContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
`;

const CardTitle = styled.span`
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--color-grey-800);

    ${media.mobile} {
        font-size: 1.6rem;
    }
`;

const CardDescription = styled.span`
    font-size: 1.4rem;
    color: var(--color-grey-500);

    ${media.mobile} {
        font-size: 1.2rem;
    }
`;

const CardBody = styled.div`
    padding: 2.4rem;

    ${media.mobile} {
        padding: 1.2rem;
    }
`;

// Profile Card
const ProfileCard = styled(Card)`
    display: flex;
    flex-direction: column;

    ${media.desktop} {
        flex-direction: row;
        align-items: center;
    }
`;

const ProfileContent = styled.div`
    display: flex;
    gap: 4rem;
    padding: 2.4rem;
    flex: 1;

    ${media.desktop} {
        padding: 1.6rem 2.4rem;
        gap: 3rem;
        align-items: center;
    }

    ${media.tablet} {
        flex-direction: column;
        align-items: center;
        gap: 2.4rem;
    }

    ${media.mobile} {
        padding: 1.2rem;
        gap: 1.6rem;
    }
`;

const LogoSection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.6rem;

    ${media.desktop} {
        flex-direction: row;
        gap: 1.6rem;
    }
`;

const TeamLogo = styled.img`
    width: 12rem;
    height: 12rem;
    border-radius: var(--border-radius-lg);
    object-fit: cover;
    border: 3px solid var(--secondary-border-color);

    ${media.desktop} {
        width: 8rem;
        height: 8rem;
    }

    ${media.tablet} {
        width: 10rem;
        height: 10rem;
    }

    ${media.mobile} {
        width: 8rem;
        height: 8rem;
    }
`;

const DefaultLogo = styled.div`
    width: 12rem;
    height: 12rem;
    border-radius: var(--border-radius-lg);
    background: linear-gradient(
        135deg,
        var(--color-brand-100) 0%,
        var(--color-brand-200) 100%
    );
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 4.8rem;
    font-weight: 700;
    color: var(--color-brand-600);
    border: 3px solid var(--secondary-border-color);

    ${media.desktop} {
        width: 8rem;
        height: 8rem;
        font-size: 3rem;
    }

    ${media.tablet} {
        width: 10rem;
        height: 10rem;
        font-size: 4rem;
    }

    ${media.mobile} {
        width: 8rem;
        height: 8rem;
        font-size: 3rem;
    }
`;

const TeamName = styled.h2`
    font-size: 2.4rem;
    font-weight: 600;
    color: var(--color-grey-800);
    text-align: center;
    display: flex;
    align-items: center;
    gap: 1.2rem;
    flex-wrap: wrap;
    justify-content: center;

    ${media.desktop} {
        font-size: 2rem;
        text-align: left;
        justify-content: flex-start;
    }

    ${media.mobile} {
        font-size: 2rem;
    }
`;

const DissolvedBadge = styled.span`
    display: inline-flex;
    padding: 0.4rem 1rem;
    background-color: var(--color-grey-200);
    color: var(--color-grey-700);
    border-radius: var(--border-radius-sm);
    font-size: 1.2rem;
    font-weight: 600;
    text-transform: uppercase;
`;

const InfoSection = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
    min-width: 0;

    ${media.tablet} {
        width: 100%;
    }
`;

// Players Section
const PlayersSection = styled.div`
    display: flex;
    align-items: center;
    gap: 1.2rem;
    justify-content: center;

    ${media.desktop} {
        justify-content: flex-start;
    }
`;

const PlayerAvatars = styled.div`
    display: flex;
    align-items: center;

    & > *:not(:first-child) {
        margin-left: -1rem;
    }
`;

const PlayerNames = styled.span`
    font-size: 1.6rem;
    color: var(--color-grey-600);

    ${media.mobile} {
        font-size: 1.4rem;
    }
`;

const PlayerLink = styled(Link)`
    color: var(--color-brand-600);
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
        color: var(--color-brand-700);
        text-decoration: underline;
    }
`;

// Stats Grid
const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.6rem;

    ${media.desktop} {
        display: flex;
        gap: 2rem;
    }

    ${media.tablet} {
        grid-template-columns: repeat(2, 1fr);
    }

    ${media.mobile} {
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }
`;

const StatCard = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    padding: 1.6rem;
    background-color: var(--color-grey-50);
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--secondary-border-color);

    ${media.desktop} {
        padding: 1rem 1.4rem;
        gap: 0.2rem;
    }

    ${media.mobile} {
        padding: 1.2rem;
    }
`;

const RankIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4.8rem;
    height: 4.8rem;
    border-radius: 50%;
    background: ${(props) =>
        props.$variant === "gold"
            ? "linear-gradient(135deg, #FFD700 0%, #FFC107 100%)"
            : props.$variant === "silver"
            ? "linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)"
            : props.$variant === "bronze"
            ? "linear-gradient(135deg, #CD7F32 0%, #A0522D 100%)"
            : "var(--color-grey-100)"};

    ${media.desktop} {
        width: 3.6rem;
        height: 3.6rem;
    }

    ${media.mobile} {
        width: 4rem;
        height: 4rem;
    }

    svg {
        width: 2.4rem;
        height: 2.4rem;
        color: ${(props) =>
            props.$variant === "gold"
                ? "#7a5c00"
                : props.$variant === "silver"
                ? "#616161"
                : props.$variant === "bronze"
                ? "#5D4037"
                : "var(--color-grey-600)"};

        ${media.desktop} {
            width: 1.8rem;
            height: 1.8rem;
        }

        ${media.mobile} {
            width: 2rem;
            height: 2rem;
        }
    }
`;

const StatValue = styled.span`
    font-family: "Sono";
    font-size: 2.4rem;
    font-weight: 600;
    color: ${(props) => props.$color || "var(--primary-text-color)"};

    ${media.desktop} {
        font-size: 1.8rem;
    }

    ${media.mobile} {
        font-size: 2rem;
    }
`;

const StatLabel = styled.span`
    font-size: 1.3rem;
    color: var(--color-grey-500);
    text-transform: uppercase;
    letter-spacing: 0.5px;

    ${media.mobile} {
        font-size: 1.1rem;
    }
`;

const ProfileCardHeader = styled(CardHeader)`
    ${media.desktop} {
        display: none;
    }
`;

// Quick Stats Card
const QuickStatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.6rem;

    ${media.tablet} {
        grid-template-columns: repeat(2, 1fr);
    }

    ${media.mobile} {
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }
`;

const QuickStatCard = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.8rem;
    padding: 2rem;
    background-color: var(--color-grey-50);
    border-radius: var(--border-radius-sm);

    ${media.mobile} {
        padding: 1.4rem;
    }
`;

const QuickStatValue = styled.span`
    font-family: "Sono";
    font-size: 2.8rem;
    font-weight: 600;
    color: var(--primary-text-color);

    ${media.mobile} {
        font-size: 2.2rem;
    }
`;

const QuickStatLabel = styled.span`
    font-size: 1.3rem;
    color: var(--color-grey-500);
    text-align: center;

    ${media.mobile} {
        font-size: 1.2rem;
    }
`;

function TeamOverview({ team, rank }) {
    if (!team) return null;

    const { name, logo_url, player1, player2, status, mmr, wins, losses } =
        team;

    const isDissolved = status === TEAM_STATUS_DISSOLVED;
    const totalGames = wins + losses;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
    const mmrColor = getMmrColor(mmr);

    const initials = name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    // Determine trophy variant based on rank
    let trophyVariant;
    switch (rank) {
        case 1:
            trophyVariant = "gold";
            break;
        case 2:
            trophyVariant = "silver";
            break;
        case 3:
            trophyVariant = "bronze";
            break;
        default:
            trophyVariant = "none";
    }

    return (
        <StyledTeamOverview>
            <ProfileCard>
                <ProfileCardHeader>
                    <IconWrapper>
                        <HiOutlineUser />
                    </IconWrapper>
                    <HeaderContent>
                        <CardTitle>Team Profile</CardTitle>
                        <CardDescription>
                            View team information and rankings
                        </CardDescription>
                    </HeaderContent>
                </ProfileCardHeader>
                <ProfileContent>
                    <LogoSection>
                        {logo_url ? (
                            <TeamLogo src={logo_url} alt={name} />
                        ) : (
                            <DefaultLogo>{initials}</DefaultLogo>
                        )}
                        <TeamName>
                            {name}
                            {isDissolved && (
                                <DissolvedBadge>Dissolved</DissolvedBadge>
                            )}
                        </TeamName>
                    </LogoSection>
                    <InfoSection>
                        <PlayersSection>
                            <PlayerAvatars>
                                <Avatar
                                    $size="small"
                                    src={player1?.avatar || DEFAULT_AVATAR}
                                />
                                <Avatar
                                    $size="small"
                                    src={player2?.avatar || DEFAULT_AVATAR}
                                />
                            </PlayerAvatars>
                            <PlayerNames>
                                <PlayerLink
                                    to={`/user/${player1?.name}/profile`}
                                >
                                    {player1?.name}
                                </PlayerLink>
                                {" & "}
                                <PlayerLink
                                    to={`/user/${player2?.name}/profile`}
                                >
                                    {player2?.name}
                                </PlayerLink>
                            </PlayerNames>
                        </PlayersSection>
                        <StatsGrid>
                            <StatCard>
                                {rank && rank <= 3 && (
                                    <RankIcon $variant={trophyVariant}>
                                        <HiOutlineTrophy />
                                    </RankIcon>
                                )}
                                <StatLabel>Rank</StatLabel>
                                <StatValue>#{rank || "-"}</StatValue>
                            </StatCard>
                            <StatCard>
                                <StatLabel>MMR</StatLabel>
                                <StatValue $color={mmrColor}>{mmr}</StatValue>
                            </StatCard>
                            <StatCard>
                                <StatLabel>Wins</StatLabel>
                                <StatValue>{wins}</StatValue>
                            </StatCard>
                            <StatCard>
                                <StatLabel>Losses</StatLabel>
                                <StatValue>{losses}</StatValue>
                            </StatCard>
                        </StatsGrid>
                    </InfoSection>
                </ProfileContent>
            </ProfileCard>

            <Card>
                <CardHeader>
                    <IconWrapper>
                        <HiOutlineTrophy />
                    </IconWrapper>
                    <HeaderContent>
                        <CardTitle>Quick Stats</CardTitle>
                        <CardDescription>
                            Team performance overview
                        </CardDescription>
                    </HeaderContent>
                </CardHeader>
                <CardBody>
                    <QuickStatsGrid>
                        <QuickStatCard>
                            <QuickStatValue>{totalGames}</QuickStatValue>
                            <QuickStatLabel>Total Games</QuickStatLabel>
                        </QuickStatCard>
                        <QuickStatCard>
                            <QuickStatValue>{wins}</QuickStatValue>
                            <QuickStatLabel>Victories</QuickStatLabel>
                        </QuickStatCard>
                        <QuickStatCard>
                            <QuickStatValue>{losses}</QuickStatValue>
                            <QuickStatLabel>Defeats</QuickStatLabel>
                        </QuickStatCard>
                        <QuickStatCard>
                            <QuickStatValue>{winRate}%</QuickStatValue>
                            <QuickStatLabel>Win Rate</QuickStatLabel>
                        </QuickStatCard>
                    </QuickStatsGrid>
                </CardBody>
            </Card>
        </StyledTeamOverview>
    );
}

export default TeamOverview;
