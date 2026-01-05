import styled from "styled-components";
import Spinner from "../../ui/Spinner";
import { media, TEAM_STATUS_DISSOLVED } from "../../utils/constants";
import { useMyTeams } from "./useTeams";
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

function DissolvedTeamsTab() {
    const { teams: myTeams, isLoading } = useMyTeams();

    const dissolvedTeams = myTeams.filter(
        (t) => t.status === TEAM_STATUS_DISSOLVED
    );

    if (isLoading) {
        return <Spinner />;
    }

    return (
        <Content>
            {dissolvedTeams.length === 0 ? (
                <EmptyState>
                    <EmptyIcon>📦</EmptyIcon>
                    <EmptyTitle>No dissolved teams</EmptyTitle>
                    <EmptyText>
                        Your dissolved teams will appear here.
                    </EmptyText>
                </EmptyState>
            ) : (
                <TeamsGrid>
                    {dissolvedTeams.map((team) => (
                        <TeamCard key={team.id} team={team} showRank={false} />
                    ))}
                </TeamsGrid>
            )}
        </Content>
    );
}

export default DissolvedTeamsTab;
