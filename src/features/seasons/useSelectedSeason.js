import { useSearchParams } from "react-router-dom";
import { useMemo, useEffect } from "react";
import { useCurrentSeason } from "./useCurrentSeason";
import { useSeasons } from "./useSeasons";
import { SEASON_ALL_TIME, SEASON_OFF_SEASON } from "../../utils/constants";

const STORAGE_KEY = "global_season";

/**
 * Validates if a season value is in a valid format.
 * Valid formats: numeric ID, "all-time", "off-season"
 */
function isValidSeasonFormat(value) {
    if (!value || typeof value !== "string") return false;
    if (value === SEASON_ALL_TIME || value === SEASON_OFF_SEASON) return true;
    // Check if it's a valid numeric string (season ID)
    return /^\d+$/.test(value);
}

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
    const [searchParams, setSearchParams] = useSearchParams();
    const { currentSeason, isLoading: isLoadingCurrentSeason } =
        useCurrentSeason();
    const { seasons, isLoading: isLoadingSeasons } = useSeasons();

    // Extract URL param as stable string to prevent unnecessary re-renders
    const urlSeasonParam = searchParams.get("season");

    // Check if a season ID exists in the available seasons
    const isValidSeasonId = (id) => {
        if (!seasons || !id) return false;
        return seasons.some((s) => String(s.id) === id);
    };

    // Determine season value with priority: URL > localStorage > currentSeason
    const seasonValue = useMemo(() => {
        // 1. Check URL param first
        if (urlSeasonParam) {
            // Validate format first
            if (!isValidSeasonFormat(urlSeasonParam)) {
                return null; // Invalid format, will be cleaned up by effect
            }
            // For special values, return directly
            if (
                urlSeasonParam === SEASON_ALL_TIME ||
                urlSeasonParam === SEASON_OFF_SEASON
            ) {
                return urlSeasonParam;
            }
            // For numeric IDs, validate against available seasons if loaded
            if (!isLoadingSeasons && seasons) {
                if (isValidSeasonId(urlSeasonParam)) {
                    return urlSeasonParam;
                }
                return null; // Invalid season ID, will be cleaned up by effect
            }
            // Seasons still loading, trust the URL for now
            return urlSeasonParam;
        }

        // 2. Check localStorage
        const storedSeason = getStoredSeasonValue();
        if (storedSeason && isValidSeasonFormat(storedSeason)) {
            // For special values, return directly
            if (
                storedSeason === SEASON_ALL_TIME ||
                storedSeason === SEASON_OFF_SEASON
            ) {
                return storedSeason;
            }
            // For numeric IDs, validate if seasons are loaded
            if (!isLoadingSeasons && seasons) {
                if (isValidSeasonId(storedSeason)) {
                    return storedSeason;
                }
                // Invalid stored season ID, fall through to default
            } else {
                // Seasons still loading, trust localStorage for now
                return storedSeason;
            }
        }

        // 3. Fall back to current season if available
        if (currentSeason) {
            return String(currentSeason.id);
        }

        // 4. Return null while loading, will resolve once currentSeason loads
        return null;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [urlSeasonParam, currentSeason, seasons, isLoadingSeasons]);

    // Clean up invalid URL season parameter
    // Note: Only run cleanup when seasons are fully loaded to prevent loops
    useEffect(() => {
        // Wait for seasons to be fully loaded before validating
        if (isLoadingSeasons || !seasons) return;
        if (!urlSeasonParam) return;

        // Check if URL param is invalid format
        if (!isValidSeasonFormat(urlSeasonParam)) {
            // Remove invalid season param from URL
            const newParams = new URLSearchParams(searchParams);
            newParams.delete("season");
            setSearchParams(newParams, { replace: true });
            return;
        }

        // Check if it's an invalid season ID (not found in available seasons)
        const isSpecialValue =
            urlSeasonParam === SEASON_ALL_TIME ||
            urlSeasonParam === SEASON_OFF_SEASON;
        if (!isSpecialValue && !isValidSeasonId(urlSeasonParam)) {
            // Remove invalid season param from URL
            const newParams = new URLSearchParams(searchParams);
            newParams.delete("season");
            setSearchParams(newParams, { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [urlSeasonParam, seasons, isLoadingSeasons]);

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
    const isLoading =
        (isLoadingCurrentSeason || isLoadingSeasons) && !seasonValue;

    return {
        seasonValue,
        seasonFilter,
        isLoading,
    };
}
