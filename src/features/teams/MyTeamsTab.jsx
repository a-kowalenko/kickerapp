import styled from "styled-components";
import { useState } from "react";
import { HiOutlinePlus } from "react-icons/hi2";
import Button from "../../ui/Button";
import Spinner from "../../ui/Spinner";
import { media, TEAM_STATUS_ACTIVE } from "../../utils/constants";
import { useMyTeams } from "./useTeams";
import TeamCard from "./TeamCard";
import TeamInvitationBanner from "./TeamInvitationBanner";
import CreateTeamModal from "./CreateTeamModal";

const Content = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.6rem;

    ${media.mobile} {
        padding: 0 1.2rem;
    }
`;

const HeaderRow = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 1.6rem;
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
    margin-bottom: 1.6rem;
`;

function MyTeamsTab() {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { teams: myTeams, isLoading } = useMyTeams();

    const activeTeams = myTeams.filter((t) => t.status === TEAM_STATUS_ACTIVE);

    if (isLoading) {
        return <Spinner />;
    }

    return (
        <Content>
            <HeaderRow>
                <Button
                    $variation="primary"
                    onClick={() => setShowCreateModal(true)}
                >
                    <HiOutlinePlus /> Create Team
                </Button>
            </HeaderRow>

            <TeamInvitationBanner />

            {activeTeams.length === 0 ? (
                <EmptyState>
                    <EmptyIcon>👥</EmptyIcon>
                    <EmptyTitle>No teams yet</EmptyTitle>
                    <EmptyText>
                        Create a team with a partner to compete in team matches!
                    </EmptyText>
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
