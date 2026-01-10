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
import SentInvitationsBanner from "./SentInvitationsBanner";
import CreateTeamModal from "./CreateTeamModal";

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

const CreateTeamCard = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.2rem;
    min-height: 18rem;
    background-color: var(--tertiary-background-color);
    border: 2px dashed var(--primary-border-color);
    border-radius: var(--border-radius-md);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        border-color: var(--primary-button-color);
        background-color: var(--primary-background-color);

        & > div:first-child {
            background-color: var(--primary-button-color);
            color: white;
        }
    }
`;

const CreateTeamIconCircle = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 5rem;
    height: 5rem;
    border-radius: 50%;
    background-color: var(--secondary-background-color);
    color: var(--secondary-text-color);
    transition: all 0.2s ease;

    & svg {
        width: 2.4rem;
        height: 2.4rem;
    }
`;

const CreateTeamText = styled.span`
    font-size: 1.4rem;
    font-weight: 500;
    color: var(--secondary-text-color);
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
            <TeamInvitationBanner />

            <SentInvitationsBanner />

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
                    <CreateTeamCard onClick={() => setShowCreateModal(true)}>
                        <CreateTeamIconCircle>
                            <HiOutlinePlus />
                        </CreateTeamIconCircle>
                        <CreateTeamText>Create New Team</CreateTeamText>
                    </CreateTeamCard>
                </TeamsGrid>
            )}

            {showCreateModal && (
                <CreateTeamModal onClose={() => setShowCreateModal(false)} />
            )}
        </Content>
    );
}

export default MyTeamsTab;
