import { useParams, Navigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import Heading from "../ui/Heading";
import TabView from "../ui/TabView";
import LoadingSpinner from "../ui/LoadingSpinner";
import Error from "../ui/Error";
import { useTeam } from "../features/teams/useTeams";
import { useOwnPlayer } from "../hooks/useOwnPlayer";
import TeamOverview from "../features/teams/TeamOverview";
import TeamMatchHistoryTable from "../features/teams/TeamMatchHistoryTable";
import TeamStatistics from "../features/teams/TeamStatistics";
import TeamSettings from "../features/teams/TeamSettings";
import { media } from "../utils/constants";

const PageContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
    max-width: 120rem;

    ${media.tablet} {
        gap: 1.2rem;
    }
`;

function Team() {
    const { teamId } = useParams();
    const location = useLocation();
    const { team, isLoading, error } = useTeam(teamId);
    const { data: ownPlayer } = useOwnPlayer();

    // Check if user is a team member
    const isTeamMember =
        ownPlayer?.id === team?.player1?.id ||
        ownPlayer?.id === team?.player2?.id;

    // Calculate team rank (would need proper ranking data)
    // For now, we'll pass null and handle it in components
    const teamRank = null;

    // Define base path for tabs
    const basePath = `/team/${teamId}`;

    // Build tabs array
    const tabs = [
        {
            path: `${basePath}/overview`,
            label: "Overview",
            component: <TeamOverview team={team} rank={teamRank} />,
        },
        {
            path: `${basePath}/history`,
            label: "Match History",
            component: <TeamMatchHistoryTable teamId={teamId} />,
        },
        {
            path: `${basePath}/statistics`,
            label: "Statistics",
            component: <TeamStatistics teamId={teamId} team={team} />,
        },
    ];

    // Add settings tab only for team members with active team
    if (isTeamMember) {
        tabs.push({
            path: `${basePath}/settings`,
            label: "Settings",
            component: (
                <TeamSettings
                    teamId={teamId}
                    team={team}
                    isTeamMember={isTeamMember}
                />
            ),
        });
    }

    // Redirect to overview if on base path
    if (
        location.pathname === basePath ||
        location.pathname === `${basePath}/`
    ) {
        return <Navigate to={`${basePath}/overview`} replace />;
    }

    if (isLoading) {
        return (
            <PageContainer>
                <LoadingSpinner />
            </PageContainer>
        );
    }

    if (error || !team) {
        return (
            <PageContainer>
                <Heading
                    as="h1"
                    type="page"
                    hasBackBtn={true}
                    backDirection="/teams"
                >
                    Team Not Found
                </Heading>
                <Error message="The team you're looking for doesn't exist or has been removed." />
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <Heading
                as="h1"
                type="page"
                hasBackBtn={true}
                backDirection="/teams"
            >
                {team.name}
            </Heading>
            <TabView tabs={tabs} />
        </PageContainer>
    );
}

export default Team;
