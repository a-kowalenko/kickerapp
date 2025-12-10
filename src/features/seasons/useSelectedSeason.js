import { useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import { useCurrentSeason } from "./useCurrentSeason";
import { SEASON_ALL_TIME, SEASON_OFF_SEASON } from "../../utils/constants";

const STORAGE_KEY = "global_season";

/**
 * Reads the season value synchronously from localStorage.
 */
function getStoredSeasonValue() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return parsed?.value || null;
        }
    } catch {
        // Ignore parse errors
    }
    return null;
}

/**
 * Central hook to get the currently selected season value.
 * Priority: URL param > localStorage > currentSeason > null
 *
 * This hook should be used by all data-fetching hooks to ensure
 * consistent season filtering across the app.
 *
 * Returns:
 * - seasonValue: The season value string (season ID, "all-time", or "off-season")
 * - seasonFilter: Object to spread into API filter (e.g., { seasonId: "123" } or null for all-time)
 * - isLoading: Whether we're still determining the season (currentSeason loading)
 */
export function useSelectedSeason() {
    const [searchParams] = useSearchParams();
    const { currentSeason, isLoading: isLoadingCurrentSeason } =
        useCurrentSeason();

    // Determine season value with priority: URL > localStorage > currentSeason
    const seasonValue = useMemo(() => {
        // 1. Check URL param first
        const urlSeason = searchParams.get("season");
        if (urlSeason) {
            return urlSeason;
        }

        // 2. Check localStorage
        const storedSeason = getStoredSeasonValue();
        if (storedSeason) {
            return storedSeason;
        }

        // 3. Fall back to current season if available
        if (currentSeason) {
            return String(currentSeason.id);
        }

        // 4. Return null while loading, will resolve once currentSeason loads
        return null;
    }, [searchParams, currentSeason]);

    // Build the season filter object for API calls
    const seasonFilter = useMemo(() => {
        if (!seasonValue || seasonValue === SEASON_ALL_TIME) {
            return null; // No filter = all time
        }

        if (seasonValue === SEASON_OFF_SEASON) {
            return { seasonId: null }; // Off-season matches have null season_id
        }

        // Regular season ID
        return { seasonId: seasonValue };
    }, [seasonValue]);

    // We're loading if currentSeason is loading AND we don't have a value from URL/localStorage
    const isLoading = isLoadingCurrentSeason && !seasonValue;

    return {
        seasonValue,
        seasonFilter,
        isLoading,
    };
}
