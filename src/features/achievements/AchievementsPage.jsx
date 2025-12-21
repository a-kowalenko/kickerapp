import styled from "styled-components";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Heading from "../../ui/Heading";
import Spinner from "../../ui/Spinner";
import TabView from "../../ui/TabView";
import AchievementsSummary from "./AchievementsSummary";
import AchievementsFilterRow from "./AchievementsFilterRow";
import AchievementsList from "./AchievementsList";
import AchievementAdminPage from "./admin/AchievementAdminPage";
import { useAchievementsWithProgress } from "./useAchievementsWithProgress";
import { useOwnPlayer } from "../../hooks/useOwnPlayer";
import { useSelectedSeason } from "../seasons/useSelectedSeason";
import { useKickerInfo } from "../../hooks/useKickerInfo";
import { useUser } from "../authentication/useUser";

const StyledAchievements = styled.div`
    display: flex;
    flex-direction: column;
`;

const Content = styled.div`
    padding: 0 2.4rem;

    @media (max-width: 768px) {
        padding: 0 1.2rem;
    }
`;

// Overview tab content component
function AchievementsOverview() {
    const [searchParams] = useSearchParams();
    const { data: player, isLoading: isLoadingPlayer } = useOwnPlayer();
    const { seasonValue } = useSelectedSeason();

    const seasonId =
        seasonValue &&
        seasonValue !== "all-time" &&
        seasonValue !== "off-season"
            ? seasonValue
            : null;

    const { achievements, isLoading: isLoadingAchievements } =
        useAchievementsWithProgress(player?.id, seasonId);

    const isLoading = isLoadingPlayer || isLoadingAchievements;

    // Filter achievements based on URL params
    const categoryFilter = searchParams.get("category") || "all";
    const statusFilter = searchParams.get("status") || "all";
    const scopeFilter = searchParams.get("scope") || "season";

    const filteredAchievements = (achievements || []).filter((achievement) => {
        // Scope filter - filter by is_season_specific
        if (
            scopeFilter === "season" &&
            achievement.is_season_specific === false
        ) {
            return false;
        }
        if (
            scopeFilter === "alltime" &&
            achievement.is_season_specific === true
        ) {
            return false;
        }

        // Category filter
        if (
            categoryFilter !== "all" &&
            achievement.category?.id?.toString() !== categoryFilter
        ) {
            return false;
        }

        // Status filter
        if (statusFilter === "completed" && !achievement.isUnlocked) {
            return false;
        }
        if (
            statusFilter === "in-progress" &&
            (achievement.isUnlocked ||
                !achievement.isAvailable ||
                achievement.currentProgress === 0)
        ) {
            return false;
        }
        if (
            statusFilter === "locked" &&
            (achievement.isUnlocked || achievement.isAvailable)
        ) {
            return false;
        }

        // NOTE: Chain filtering is handled in AchievementsList to keep chains complete
        // Don't filter out chain members here - let AchievementsList handle chain logic

        return true;
    });

    // Calculate summary stats
    const totalAchievements = achievements?.length || 0;
    const totalUnlocked = achievements?.filter((a) => a.isUnlocked).length || 0;
    const totalPoints =
        achievements
            ?.filter((a) => a.isUnlocked)
            .reduce((sum, a) => sum + (a.points || 0), 0) || 0;

    if (isLoading) {
        return <Spinner />;
    }

    return (
        <Content>
            <AchievementsSummary
                totalPoints={totalPoints}
                totalUnlocked={totalUnlocked}
                totalAchievements={totalAchievements}
            />
            <AchievementsFilterRow />
            <AchievementsList
                achievements={filteredAchievements}
                groupByCategory={categoryFilter === "all"}
            />
        </Content>
    );
}

function AchievementsPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { data: kickerData, isLoading: isLoadingKicker } = useKickerInfo();
    const { user, isLoading: isLoadingUser } = useUser();

    const isAdmin = kickerData?.admin === user?.id;

    // Redirect to overview tab if no specific tab is selected
    useEffect(() => {
        if (location.pathname === "/achievements") {
            navigate("/achievements/overview", { replace: true });
        }
    }, [location.pathname, navigate]);

    if (isLoadingKicker || isLoadingUser) {
        return <Spinner />;
    }

    // Build tabs - only show Admin tab if user is admin
    const tabs = [
        {
            path: "/achievements/overview",
            label: "Overview",
            component: <AchievementsOverview />,
        },
    ];

    if (isAdmin) {
        tabs.push({
            path: "/achievements/admin",
            label: "Admin",
            component: <AchievementAdminPage />,
        });
    }

    return (
        <StyledAchievements>
            <Heading as="h1" type="page" hasBackBtn={true}>
                Achievements
            </Heading>
            <TabView tabs={tabs} />
        </StyledAchievements>
    );
}

export default AchievementsPage;
