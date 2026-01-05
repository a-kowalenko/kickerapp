import styled from "styled-components";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HiOutlinePlus } from "react-icons/hi2";
import Button from "../../ui/Button";
import LoadingSpinner from "../../ui/LoadingSpinner";
import EmptyState from "../../ui/EmptyState";
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

    ${media.tablet} {
        padding: 0 1.6rem;
    }

    ${media.mobile} {
        padding: 0;
    }
`;

const HeaderRow = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 1.6rem;

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
                <EmptyState
                    icon={filter === "dissolved" ? "📦" : "👥"}
                    title={
                        filter === "my"
                            ? "No teams yet"
                            : filter === "dissolved"
                            ? "No dissolved teams"
                            : "No teams in this kicker"
                    }
                    description={
                        filter === "my"
                            ? "Create a team with a partner to compete in team matches!"
                            : filter === "dissolved"
                            ? "Your dissolved teams will appear here."
                            : "Be the first to create a team!"
                    }
                >
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
