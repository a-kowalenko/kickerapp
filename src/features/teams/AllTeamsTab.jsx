import styled from "styled-components";
import Spinner from "../../ui/Spinner";
import { media, TEAM_STATUS_ACTIVE } from "../../utils/constants";
import { useTeams } from "./useTeams";
import TeamCard from "./TeamCard";

const Content = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
    padding: 0 2.4rem;

    ${media.mobile} {
        padding: 0 1.2rem;
    }
`;

const TeamsGrid = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    max-width: 80rem;
`;

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    color: var(--tertiary-text-color);
    max-width: 80rem;
`;

const EmptyIcon = styled.span`
    font-size: 4rem;
    margin-bottom: 1.2rem;
    opacity: 0.5;
`;

const EmptyTitle = styled.h3`
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--secondary-text-color);
    margin-bottom: 0.6rem;
`;

const EmptyText = styled.p`
    font-size: 1.4rem;
    color: var(--tertiary-text-color);
    max-width: 40rem;
`;

function AllTeamsTab() {
    const { teams: allTeams, isLoading } = useTeams();

    const activeTeams = allTeams.filter((t) => t.status === TEAM_STATUS_ACTIVE);

    if (isLoading) {
        return <Spinner />;
    }

    return (
        <Content>
            {activeTeams.length === 0 ? (
                <EmptyState>
                    <EmptyIcon>👥</EmptyIcon>
                    <EmptyTitle>No teams in this kicker</EmptyTitle>
                    <EmptyText>Be the first to create a team!</EmptyText>
                </EmptyState>
            ) : (
                <TeamsGrid>
                    {activeTeams.map((team, index) => (
                        <TeamCard
                            key={team.id}
                            team={team}
                            rank={index + 1}
                            showRank={true}
                        />
                    ))}
                </TeamsGrid>
            )}
        </Content>
    );
}

export default AllTeamsTab;
