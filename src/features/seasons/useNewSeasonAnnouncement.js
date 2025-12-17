import { useCallback, useMemo, useState } from "react";
import { useKicker } from "../../contexts/KickerContext";
import { useCurrentSeason } from "./useCurrentSeason";

const STORAGE_KEY_PREFIX = "acknowledged_seasons_";

/**
 * Hook to manage new season announcement popup.
 * Shows announcement once per season per kicker, then never again after user acknowledges.
 */
export function useNewSeasonAnnouncement() {
    const { currentKicker } = useKicker();
    const { currentSeason, isLoading } = useCurrentSeason();
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

    // Check if we should show the announcement
    const { showAnnouncement, seasonName } = useMemo(() => {
        // Don't show if already acknowledged in this session
        if (isAcknowledged) {
            return { showAnnouncement: false, seasonName: "" };
        }

        // Don't show while loading or if no current season
        if (isLoading || !currentSeason || !currentKicker) {
            return { showAnnouncement: false, seasonName: "" };
        }

        const acknowledgedSeasons = getAcknowledgedSeasons();
        const seasonId = String(currentSeason.id);

        // Show announcement if this season hasn't been acknowledged yet
        const shouldShow = !acknowledgedSeasons.includes(seasonId);

        return {
            showAnnouncement: shouldShow,
            seasonName:
                currentSeason.name || `Season ${currentSeason.season_number}`,
        };
    }, [
        currentSeason,
        currentKicker,
        isLoading,
        getAcknowledgedSeasons,
        isAcknowledged,
    ]);

    // Function to acknowledge the new season (called when user closes the modal)
    const acknowledgeNewSeason = useCallback(() => {
        if (!currentSeason || !currentKicker) return;

        const acknowledgedSeasons = getAcknowledgedSeasons();
        const seasonId = String(currentSeason.id);

        // Add season ID if not already present
        if (!acknowledgedSeasons.includes(seasonId)) {
            acknowledgedSeasons.push(seasonId);
            localStorage.setItem(
                storageKey,
                JSON.stringify(acknowledgedSeasons)
            );
        }

        // Update state to trigger re-render and close modal
        setIsAcknowledged(true);
    }, [currentSeason, currentKicker, storageKey, getAcknowledgedSeasons]);

    return {
        showAnnouncement,
        seasonName,
        acknowledgeNewSeason,
    };
}
