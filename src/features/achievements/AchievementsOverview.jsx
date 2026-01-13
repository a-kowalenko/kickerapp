import styled from "styled-components";
import { useSearchParams } from "react-router-dom";
import Spinner from "../../ui/Spinner";
import AchievementsSummary from "./AchievementsSummary";
import AchievementsFilterRow from "./AchievementsFilterRow";
import AchievementsList from "./AchievementsList";
import { useAchievementsWithProgress } from "./useAchievementsWithProgress";
import { useOwnPlayer } from "../../hooks/useOwnPlayer";
import { useSelectedSeason } from "../seasons/useSelectedSeason";

const Content = styled.div`
    @media (max-width: 768px) {
        padding: 0 1.2rem;
    }
`;

/**
 * AchievementsOverview - Shows all achievements with progress for a player
 *
 * @param {Object} props
 * @param {number} [props.playerId] - Optional player ID. If not provided, uses current user's player
 */
function AchievementsOverview({ playerId: externalPlayerId }) {
    const [searchParams] = useSearchParams();
    const { data: ownPlayer, isLoading: isLoadingOwnPlayer } = useOwnPlayer();
    const { seasonValue } = useSelectedSeason();

    // Use external playerId if provided, otherwise fall back to own player
    const playerId = externalPlayerId ?? ownPlayer?.id;
    const isLoading = !externalPlayerId && isLoadingOwnPlayer;

    const seasonId =
        seasonValue &&
        seasonValue !== "all-time" &&
        seasonValue !== "off-season"
            ? seasonValue
            : null;

    const { achievements, isLoading: isLoadingAchievements } =
        useAchievementsWithProgress(playerId, seasonId);

    const isFullyLoading = isLoading || isLoadingAchievements;

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

    if (isFullyLoading) {
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

export default AchievementsOverview;
