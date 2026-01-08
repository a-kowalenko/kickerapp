import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import { useKicker } from "../../contexts/KickerContext";
import { useCurrentSeason } from "./useCurrentSeason";
import { useOwnPlayer } from "../../hooks/useOwnPlayer";
import {
    getSeasonAnnouncementStatus,
    markSeasonAnnouncementSeen,
} from "../../services/apiSeasons";

const STORAGE_KEY_PREFIX = "acknowledged_seasons_";

/**
 * Hook to manage new season announcement popup.
 * Shows announcement once per season per kicker, then never again after user acknowledges.
 * Checks localStorage first, then falls back to database if localStorage is empty.
 */
export function useNewSeasonAnnouncement() {
    const { currentKicker } = useKicker();
    const { currentSeason, isLoading } = useCurrentSeason();
    const { data: player, isLoading: isLoadingPlayer } = useOwnPlayer();
    // State to trigger re-render when season is acknowledged
    const [isAcknowledged, setIsAcknowledged] = useState(false);

    const storageKey = `${STORAGE_KEY_PREFIX}${currentKicker}`;

    // Get acknowledged seasons from localStorage
    const getAcknowledgedSeasons = useCallback(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch {
            // Ignore parse errors
        }
        return [];
    }, [storageKey]);

    // Check if localStorage has this season acknowledged
    const localStorageHasSeason = useMemo(() => {
        if (!currentSeason) return false;
        const acknowledgedSeasons = getAcknowledgedSeasons();
        return acknowledgedSeasons.includes(String(currentSeason.id));
    }, [currentSeason, getAcknowledgedSeasons]);

    // Query database only if localStorage doesn't have the season and we have player + season
    const shouldQueryDb =
        !localStorageHasSeason &&
        !!player?.id &&
        !!currentSeason?.id &&
        !isLoading &&
        !isLoadingPlayer;

    const { data: dbAnnouncementSeen, isLoading: isLoadingDbStatus } = useQuery(
        {
            queryKey: [
                "seasonAnnouncementStatus",
                player?.id,
                currentSeason?.id,
            ],
            queryFn: () =>
                getSeasonAnnouncementStatus({
                    playerId: player.id,
                    seasonId: currentSeason.id,
                }),
            enabled: shouldQueryDb,
            staleTime: Infinity, // Don't refetch - we only need this once
        }
    );

    // Sync DB status to localStorage if DB says seen but localStorage doesn't have it
    useEffect(() => {
        if (
            dbAnnouncementSeen === true &&
            currentSeason &&
            !localStorageHasSeason
        ) {
            const acknowledgedSeasons = getAcknowledgedSeasons();
            const seasonId = String(currentSeason.id);
            if (!acknowledgedSeasons.includes(seasonId)) {
                acknowledgedSeasons.push(seasonId);
                localStorage.setItem(
                    storageKey,
                    JSON.stringify(acknowledgedSeasons)
                );
            }
        }
    }, [
        dbAnnouncementSeen,
        currentSeason,
        localStorageHasSeason,
        getAcknowledgedSeasons,
        storageKey,
    ]);

    // Check if we should show the announcement
    const { showAnnouncement, seasonName } = useMemo(() => {
        // Don't show if already acknowledged in this session
        if (isAcknowledged) {
            return { showAnnouncement: false, seasonName: "" };
        }

        // Don't show while loading or if no current season
        if (isLoading || isLoadingPlayer || !currentSeason || !currentKicker) {
            return { showAnnouncement: false, seasonName: "" };
        }

        // Check localStorage first
        const acknowledgedSeasons = getAcknowledgedSeasons();
        const seasonId = String(currentSeason.id);
        if (acknowledgedSeasons.includes(seasonId)) {
            return { showAnnouncement: false, seasonName: "" };
        }

        // If we're still loading DB status, don't show yet
        if (shouldQueryDb && isLoadingDbStatus) {
            return { showAnnouncement: false, seasonName: "" };
        }

        // Check if DB says it's already seen
        if (dbAnnouncementSeen === true) {
            return { showAnnouncement: false, seasonName: "" };
        }

        // Show announcement - neither localStorage nor DB have it as seen
        return {
            showAnnouncement: true,
            seasonName:
                currentSeason.name || `Season ${currentSeason.season_number}`,
        };
    }, [
        currentSeason,
        currentKicker,
        isLoading,
        isLoadingPlayer,
        getAcknowledgedSeasons,
        isAcknowledged,
        shouldQueryDb,
        isLoadingDbStatus,
        dbAnnouncementSeen,
    ]);

    // Function to acknowledge the new season (called when user closes the modal)
    const acknowledgeNewSeason = useCallback(() => {
        if (!currentSeason || !currentKicker) return;

        const acknowledgedSeasons = getAcknowledgedSeasons();
        const seasonId = String(currentSeason.id);

        // Add season ID to localStorage if not already present
        if (!acknowledgedSeasons.includes(seasonId)) {
            acknowledgedSeasons.push(seasonId);
            localStorage.setItem(
                storageKey,
                JSON.stringify(acknowledgedSeasons)
            );
        }

        // Update database (fire-and-forget, errors are logged but not thrown)
        if (player?.id) {
            markSeasonAnnouncementSeen({
                playerId: player.id,
                seasonId: currentSeason.id,
            });
        }

        // Update state to trigger re-render and close modal
        setIsAcknowledged(true);
    }, [
        currentSeason,
        currentKicker,
        storageKey,
        getAcknowledgedSeasons,
        player,
    ]);

    return {
        showAnnouncement,
        seasonName,
        acknowledgeNewSeason,
    };
}
