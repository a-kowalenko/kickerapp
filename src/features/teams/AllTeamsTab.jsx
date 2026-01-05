import styled from "styled-components";
import LoadingSpinner from "../../ui/LoadingSpinner";
import EmptyState from "../../ui/EmptyState";
import { media, TEAM_STATUS_ACTIVE } from "../../utils/constants";
import { useTeams } from "./useTeams";
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

function AllTeamsTab() {
    const { teams: allTeams, isLoading } = useTeams();

    const activeTeams = allTeams.filter((t) => t.status === TEAM_STATUS_ACTIVE);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <Content>
            {activeTeams.length === 0 ? (
                <EmptyState
                    icon="👥"
                    title="No teams in this kicker"
                    description="Be the first to create a team!"
                />
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
