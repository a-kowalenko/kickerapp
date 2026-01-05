import styled from "styled-components";
import { useState } from "react";
import { HiOutlinePlus } from "react-icons/hi2";
import Button from "../../ui/Button";
import LoadingSpinner from "../../ui/LoadingSpinner";
import EmptyState from "../../ui/EmptyState";
import { media, TEAM_STATUS_ACTIVE } from "../../utils/constants";
import { useMyTeams } from "./useTeams";
import TeamCard from "./TeamCard";
import TeamInvitationBanner from "./TeamInvitationBanner";
import CreateTeamModal from "./CreateTeamModal";

const Content = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2rem;
`;

const HeaderRow = styled.div`
    display: flex;
    justify-content: right;
    align-items: center;
    gap: 1.6rem;
    flex-wrap: wrap;

    ${media.mobile} {
        flex-direction: column;
        align-items: stretch;
    }
`;

const HeaderTitle = styled.h2`
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--primary-text-color);
    margin: 0;

    ${media.mobile} {
        font-size: 1.6rem;
        text-align: center;
    }
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

function MyTeamsTab() {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { teams: myTeams, isLoading } = useMyTeams();

    const activeTeams = myTeams.filter((t) => t.status === TEAM_STATUS_ACTIVE);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <Content>
            <HeaderRow>
                {/* <HeaderTitle>My Teams</HeaderTitle> */}
                <Button
                    $variation="primary"
                    onClick={() => setShowCreateModal(true)}
                >
                    <HiOutlinePlus /> Create Team
                </Button>
            </HeaderRow>

            <TeamInvitationBanner />

            {activeTeams.length === 0 ? (
                <EmptyState
                    icon="👥"
                    title="No teams yet"
                    description="Create a team with a partner to compete in team matches!"
                >
                    <Button
                        $variation="primary"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <HiOutlinePlus /> Create Team
                    </Button>
                </EmptyState>
            ) : (
                <TeamsGrid>
                    {activeTeams.map((team) => (
                        <TeamCard key={team.id} team={team} showRank={false} />
                    ))}
                </TeamsGrid>
            )}

            {showCreateModal && (
                <CreateTeamModal onClose={() => setShowCreateModal(false)} />
            )}
        </Content>
    );
}

export default MyTeamsTab;
