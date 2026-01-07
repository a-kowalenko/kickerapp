import styled from "styled-components";
import { format } from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";
import { HiOutlineTrophy } from "react-icons/hi2";
import { media } from "../../utils/constants";
import Table from "../../ui/Table";
import Pagination from "../../ui/Pagination";
import SpinnerMini from "../../ui/SpinnerMini";
import EmptyState from "../../ui/EmptyState";
import useWindowWidth from "../../hooks/useWindowWidth";
import { useTeamMatchHistoryPaginated } from "./useTeamMatchHistoryPaginated";
import TeamLogoContainer from "../../ui/TeamLogoContainer";
import TeamLogo from "../../ui/TeamLogo";
import DefaultTeamLogo from "../../ui/DefaultTeamLogo";

const StyledTeamMatchHistory = styled.div`
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
    padding: 0;
`;

const LoadingContainer = styled.div`
    display: flex;
    justify-content: center;
    padding: 3rem;
`;

// Table styled components
const TeamName = styled.span`
    display: flex;
    flex-direction: row;
    font-size: 1.6rem;
    gap: 0.4rem;
    font-weight: 600;
    color: ${(props) =>
        props.$won === null
            ? "var(--primary-text-color)"
            : props.$won === true
              ? "var(--winner-name-color)"
              : "var(--loser-name-color)"};
    cursor: pointer;

    &:hover {
        text-decoration: underline;
    }

    ${media.mobile} {
        flex-direction: column;
        font-size: 1.4rem;
        gap: unset;
    }
`;

const TeamContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: ${(props) =>
        props.$team === "1" ? "flex-end" : "flex-start"};
`;

const MmrChange = styled.span`
    font-size: 1.6rem;
    color: ${(props) =>
        props.$positive
            ? "var(--winner-name-color)"
            : "var(--loser-name-color)"};

    ${media.mobile} {
        font-size: 1.4rem;
    }
`;

const TeamNameText = styled.span`
    ${media.mobile} {
        display: flex;
        justify-content: ${(props) =>
            props.$team === "1" ? "flex-end" : "flex-start"};
    }
`;
const TeamMmrText = styled.span`
    ${media.mobile} {
        display: flex;
        justify-content: ${(props) =>
            props.$team === "1" ? "flex-end" : "flex-start"};
    }
`;

const BountyBadge = styled.span`
    color: var(--color-yellow-600);
    font-size: 1.2rem;
`;

const ScoreContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.2rem;

    ${media.tablet} {
        gap: 0.6rem;
    }
`;

const Score = styled.div`
    display: flex;
    font-weight: 600;
    min-width: 2rem;
    align-items: center;
    justify-content: ${(props) =>
        props.$team === "1" ? "flex-end" : "flex-start"};

    ${media.tablet} {
        font-weight: 600;
        font-size: 1.4rem;
        min-width: 1.6rem;
    }
`;

const Rank = styled.div`
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--color-grey-600);

    ${media.mobile} {
        font-weight: 600;
        font-size: 1.4rem;
        min-width: 1.6rem;
    }
`;

function TeamMatchRow({ match, teamId }) {
    const navigate = useNavigate();
    const { isDesktop } = useWindowWidth();

    const isTeam1 = match.team1_id === parseInt(teamId);
    const team1Won = match.scoreTeam1 > match.scoreTeam2;

    // Determine display based on whether we are team1 or team2
    const ourTeam = isTeam1 ? match.team1 : match.team2;
    const opponentTeam = isTeam1 ? match.team2 : match.team1;
    const ourWon = isTeam1 ? team1Won : !team1Won;
    const ourMmrChange = isTeam1 ? match.mmrChangeTeam1 : match.mmrChangeTeam2;
    const opponentMmrChange = isTeam1
        ? match.mmrChangeTeam2
        : match.mmrChangeTeam1;
    const ourBounty = isTeam1
        ? match.bounty_team1_team
        : match.bounty_team2_team;
    const opponentBounty = isTeam1
        ? match.bounty_team2_team
        : match.bounty_team1_team;

    // Calculate pre-match MMR (current MMR - change = pre-match MMR)
    const ourPreMatchMmr =
        ourTeam?.mmr && ourMmrChange
            ? Math.round(ourTeam.mmr - ourMmrChange)
            : null;
    const opponentPreMatchMmr =
        opponentTeam?.mmr && opponentMmrChange
            ? Math.round(opponentTeam.mmr - opponentMmrChange)
            : null;

    function handleClickRow(e) {
        e.stopPropagation();
        navigate(`/matches/${match.id}`);
    }

    function handleTeamClick(e, teamId) {
        e.stopPropagation();
        navigate(`/team/${teamId}`);
    }

    return (
        <Table.Row onClick={handleClickRow}>
            <Rank>{match.nr}</Rank>
            <TeamContainer $won={ourWon} $team="1">
                <TeamLogoContainer $team="1">
                    {isDesktop &&
                        (ourTeam.logo_url ? (
                            <TeamLogo
                                src={ourTeam.logo_url}
                                alt={ourTeam.name}
                            />
                        ) : (
                            <DefaultTeamLogo>
                                {ourTeam.name?.charAt(0)?.toUpperCase()}
                            </DefaultTeamLogo>
                        ))}
                    <TeamName
                        $won={ourWon}
                        onClick={(e) => handleTeamClick(e, ourTeam?.id)}
                    >
                        <TeamNameText $team="1">
                            {ourTeam?.name || "Unknown"}
                        </TeamNameText>
                        <TeamMmrText $team="1">
                            {ourMmrChange && ourPreMatchMmr && (
                                <>
                                    ({ourPreMatchMmr})
                                    <MmrChange $positive={ourWon}>
                                        {ourWon ? "+" : ""}
                                        {ourMmrChange}
                                    </MmrChange>
                                </>
                            )}
                            {ourWon && ourBounty > 0 && (
                                <BountyBadge>+{ourBounty}💰</BountyBadge>
                            )}
                        </TeamMmrText>
                    </TeamName>
                </TeamLogoContainer>
            </TeamContainer>

            <ScoreContainer>
                <Score $team="1">
                    {isTeam1 ? match.scoreTeam1 : match.scoreTeam2}
                </Score>
                &mdash;
                <Score $team="2">
                    {isTeam1 ? match.scoreTeam2 : match.scoreTeam1}
                </Score>
            </ScoreContainer>

            <TeamContainer $won={!ourWon} $team="2">
                <TeamLogoContainer $team="2">
                    {isDesktop &&
                        (opponentTeam.logo_url ? (
                            <TeamLogo
                                src={opponentTeam.logo_url}
                                alt={opponentTeam.name}
                            />
                        ) : (
                            <DefaultTeamLogo>
                                {opponentTeam.name?.charAt(0)?.toUpperCase()}
                            </DefaultTeamLogo>
                        ))}
                    <TeamName
                        $won={!ourWon}
                        onClick={(e) => handleTeamClick(e, opponentTeam?.id)}
                    >
                        <TeamNameText $team="2">
                            {opponentTeam?.name || "Unknown"}
                        </TeamNameText>
                        <TeamMmrText $team="2">
                            {opponentMmrChange && opponentPreMatchMmr && (
                                <>
                                    ({opponentPreMatchMmr})
                                    <MmrChange $positive={!ourWon}>
                                        {!ourWon ? "+" : ""}
                                        {opponentMmrChange}
                                    </MmrChange>
                                </>
                            )}

                            {!ourWon && opponentBounty > 0 && (
                                <BountyBadge>+{opponentBounty}💰</BountyBadge>
                            )}
                        </TeamMmrText>
                    </TeamName>
                </TeamLogoContainer>
            </TeamContainer>

            {isDesktop && (
                <div style={{ textAlign: "center" }}>
                    {format(new Date(match.start_time), "dd.MM.yyyy - HH:mm")}
                </div>
            )}

            {isDesktop && (
                <div>
                    {match.end_time && (
                        <span>
                            {format(
                                new Date(match.end_time) -
                                    new Date(match.start_time),
                                "mm:ss"
                            )}
                        </span>
                    )}
                </div>
            )}
        </Table.Row>
    );
}

function TeamMatchHistoryTable({ teamId }) {
    const [searchParams] = useSearchParams();
    const currentPage = searchParams.get("page")
        ? Number(searchParams.get("page"))
        : 1;

    const { matches, totalCount, isLoading } = useTeamMatchHistoryPaginated(
        teamId,
        currentPage
    );
    const { isDesktop, isMobile } = useWindowWidth();

    const columns = isDesktop
        ? "0.1fr 1fr 0.4fr 1fr 0.5fr 0.3fr"
        : "0.1fr 1.8fr 0.8fr 1.8fr";

    return (
        <StyledTeamMatchHistory>
            {isLoading ? (
                <LoadingContainer>
                    <SpinnerMini />
                </LoadingContainer>
            ) : matches.length === 0 ? (
                <EmptyState
                    icon="🎮"
                    title="No matches yet"
                    description="Start a team match to see your history here!"
                />
            ) : (
                <Table columns={columns}>
                    <Table.Header>
                        <div>Nr</div>
                        <div
                            style={{
                                textAlign: isMobile ? "center" : "right",
                            }}
                        >
                            Your Team
                        </div>
                        <div style={{ textAlign: "center" }}>Score</div>
                        <div
                            style={{
                                textAlign: isMobile ? "center" : "",
                            }}
                        >
                            Opponent
                        </div>
                        {isDesktop && (
                            <div style={{ textAlign: "center" }}>
                                Start Time
                            </div>
                        )}
                        {isDesktop && <div>Duration</div>}
                    </Table.Header>
                    <Table.Body
                        noDataLabel="No matches available"
                        data={matches}
                        render={(match) => (
                            <TeamMatchRow
                                key={match.id}
                                match={match}
                                teamId={teamId}
                            />
                        )}
                    />
                    <Table.Footer>
                        <Pagination numEntries={totalCount} />
                    </Table.Footer>
                </Table>
            )}
        </StyledTeamMatchHistory>
    );
}

export default TeamMatchHistoryTable;
