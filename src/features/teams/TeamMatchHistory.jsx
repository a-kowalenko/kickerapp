import styled from "styled-components";
import { HiOutlineTrophy } from "react-icons/hi2";
import { media } from "../../utils/constants";
import { useTeamMatches } from "./useTeams";
import SpinnerMini from "../../ui/SpinnerMini";
import EmptyState from "../../ui/EmptyState";

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
    padding: 2.4rem;

    ${media.mobile} {
        padding: 1.2rem;
    }
`;

const LoadingContainer = styled.div`
    display: flex;
    justify-content: center;
    padding: 3rem;
`;

const MatchList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const MatchRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.4rem 1.6rem;
    background-color: var(--color-grey-50);
    border-radius: var(--border-radius-sm);
    border-left: 4px solid
        ${(props) =>
            props.$won ? "var(--color-green-600)" : "var(--color-red-600)"};
    transition: background-color 0.2s;

    &:hover {
        background-color: var(--color-grey-100);
    }

    ${media.mobile} {
        padding: 1.2rem;
        flex-wrap: wrap;
        gap: 0.8rem;
    }
`;

const MatchInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 1.2rem;
    flex: 1;
    min-width: 0;

    ${media.mobile} {
        gap: 0.8rem;
    }
`;

const MatchOpponent = styled.span`
    font-size: 1.5rem;
    color: var(--primary-text-color);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    ${media.mobile} {
        font-size: 1.4rem;
    }
`;

const MatchResult = styled.div`
    display: flex;
    align-items: center;
    gap: 1.6rem;

    ${media.mobile} {
        gap: 1rem;
        width: 100%;
        justify-content: flex-end;
    }
`;

const MatchScore = styled.span`
    font-family: "Sono";
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--primary-text-color);
    min-width: 6rem;
    text-align: center;

    ${media.mobile} {
        font-size: 1.6rem;
        min-width: 5rem;
    }
`;

const MatchMmrChange = styled.span`
    font-family: "Sono";
    font-size: 1.4rem;
    font-weight: 600;
    min-width: 5rem;
    text-align: right;
    color: ${(props) =>
        props.$positive ? "var(--color-green-600)" : "var(--color-red-600)"};

    ${media.mobile} {
        font-size: 1.3rem;
        min-width: 4rem;
    }
`;

const MatchDate = styled.span`
    font-size: 1.2rem;
    color: var(--color-grey-500);
    min-width: 8rem;
    text-align: right;

    ${media.mobile} {
        font-size: 1.1rem;
        min-width: auto;
    }
`;

const ResultBadge = styled.span`
    padding: 0.3rem 0.8rem;
    border-radius: var(--border-radius-sm);
    font-size: 1.1rem;
    font-weight: 600;
    text-transform: uppercase;
    background-color: ${(props) =>
        props.$won ? "var(--color-green-100)" : "var(--color-red-100)"};
    color: ${(props) =>
        props.$won ? "var(--color-green-700)" : "var(--color-red-700)"};
`;

function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
    });
}

function TeamMatchHistory({ teamId }) {
    const { matches, isLoading } = useTeamMatches(teamId);

    return (
        <StyledTeamMatchHistory>
            <Card>
                <CardHeader>
                    <IconWrapper>
                        <HiOutlineTrophy />
                    </IconWrapper>
                    <HeaderContent>
                        <CardTitle>Match History</CardTitle>
                        <CardDescription>
                            All team matches and results
                        </CardDescription>
                    </HeaderContent>
                </CardHeader>
                <CardBody>
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
                        <MatchList>
                            {matches.map((match) => {
                                const isTeam1 =
                                    match.team1_id === parseInt(teamId);
                                const won = isTeam1
                                    ? match.scoreTeam1 > match.scoreTeam2
                                    : match.scoreTeam2 > match.scoreTeam1;
                                const teamScore = isTeam1
                                    ? match.scoreTeam1
                                    : match.scoreTeam2;
                                const opponentScore = isTeam1
                                    ? match.scoreTeam2
                                    : match.scoreTeam1;
                                const opponentTeam = isTeam1
                                    ? match.team2
                                    : match.team1;
                                const mmrChange = isTeam1
                                    ? match.mmrChangeTeam1
                                    : match.mmrChangeTeam2;

                                return (
                                    <MatchRow key={match.id} $won={won}>
                                        <MatchInfo>
                                            <ResultBadge $won={won}>
                                                {won ? "W" : "L"}
                                            </ResultBadge>
                                            <MatchOpponent>
                                                vs{" "}
                                                {opponentTeam?.name ||
                                                    "Unknown"}
                                            </MatchOpponent>
                                        </MatchInfo>
                                        <MatchResult>
                                            <MatchScore>
                                                {teamScore} - {opponentScore}
                                            </MatchScore>
                                            {mmrChange && (
                                                <MatchMmrChange
                                                    $positive={mmrChange > 0}
                                                >
                                                    {mmrChange > 0 ? "+" : ""}
                                                    {mmrChange}
                                                </MatchMmrChange>
                                            )}
                                            <MatchDate>
                                                {formatDate(match.end_time)}
                                            </MatchDate>
                                        </MatchResult>
                                    </MatchRow>
                                );
                            })}
                        </MatchList>
                    )}
                </CardBody>
            </Card>
        </StyledTeamMatchHistory>
    );
}

export default TeamMatchHistory;
