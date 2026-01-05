import styled from "styled-components";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HiOutlinePlus } from "react-icons/hi2";
import Button from "../../ui/Button";
import LoadingSpinner from "../../ui/LoadingSpinner";
import {
    media,
    TEAM_STATUS_ACTIVE,
    TEAM_STATUS_DISSOLVED,
} from "../../utils/constants";
import { useTeams, useMyTeams } from "./useTeams";
import TeamCard from "./TeamCard";
import TeamInvitationBanner from "./TeamInvitationBanner";
import CreateTeamModal from "./CreateTeamModal";
import TeamsFilterRow from "./TeamsFilterRow";

const PageContainer = styled.div`
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

function TeamList() {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchParams] = useSearchParams();
    const filter = searchParams.get("filter") || "my";

    const { teams: allTeams, isLoading: isLoadingAll } = useTeams();
    const { teams: myTeams, isLoading: isLoadingMy } = useMyTeams();

    const isLoading = isLoadingAll || isLoadingMy;

    // Filter teams based on selected tab
    const getFilteredTeams = () => {
        switch (filter) {
            case "my":
                return myTeams.filter((t) => t.status === TEAM_STATUS_ACTIVE);
            case "all":
                return allTeams.filter((t) => t.status === TEAM_STATUS_ACTIVE);
            case "dissolved":
                return myTeams.filter(
                    (t) => t.status === TEAM_STATUS_DISSOLVED
                );
            default:
                return [];
        }
    };

    const filteredTeams = getFilteredTeams();
    const myActiveCount = myTeams.filter(
        (t) => t.status === TEAM_STATUS_ACTIVE
    ).length;

    return (
        <PageContainer>
            <HeaderRow>
                <Button
                    $variation="primary"
                    onClick={() => setShowCreateModal(true)}
                >
                    <HiOutlinePlus /> Create Team
                </Button>
            </HeaderRow>

            <TeamInvitationBanner />

            <TeamsFilterRow
                myActiveCount={myActiveCount}
                isLoading={isLoading}
            />

            {isLoading ? (
                <LoadingSpinner />
            ) : filteredTeams.length === 0 ? (
                <EmptyState>
                    <EmptyIcon>👥</EmptyIcon>
                    <EmptyTitle>
                        {filter === "my"
                            ? "No teams yet"
                            : filter === "dissolved"
                              ? "No dissolved teams"
                              : "No teams in this kicker"}
                    </EmptyTitle>
                    <EmptyText>
                        {filter === "my"
                            ? "Create a team with a partner to compete in team matches!"
                            : filter === "dissolved"
                              ? "Your dissolved teams will appear here."
                              : "Be the first to create a team!"}
                    </EmptyText>
                    {filter === "my" && (
                        <Button
                            $variation="primary"
                            onClick={() => setShowCreateModal(true)}
                        >
                            <HiOutlinePlus /> Create Team
                        </Button>
                    )}
                </EmptyState>
            ) : (
                <TeamsGrid>
                    {filteredTeams.map((team, index) => (
                        <TeamCard
                            key={team.id}
                            team={team}
                            rank={index + 1}
                            showRank={filter === "all"}
                        />
                    ))}
                </TeamsGrid>
            )}

            {showCreateModal && (
                <CreateTeamModal onClose={() => setShowCreateModal(false)} />
            )}
        </PageContainer>
    );
}

export default TeamList;
