import styled from "styled-components";
import LoadingSpinner from "../../ui/LoadingSpinner";
import EmptyState from "../../ui/EmptyState";
import { media, TEAM_STATUS_DISSOLVED } from "../../utils/constants";
import { useMyTeams } from "./useTeams";
import TeamCard from "./TeamCard";

const Content = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2rem;
`;

const TeamsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(32rem, 1fr));
    gap: 1.6rem;

    ${media.mobile} {
        grid-template-columns: 1fr;
        gap: 1.2rem;
    }
`;

function DissolvedTeamsTab() {
    const { teams: myTeams, isLoading } = useMyTeams();

    const dissolvedTeams = myTeams.filter(
        (t) => t.status === TEAM_STATUS_DISSOLVED
    );

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <Content>
            {dissolvedTeams.length === 0 ? (
                <EmptyState
                    icon="📦"
                    title="No dissolved teams"
                    description="Your dissolved teams will appear here."
                />
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
