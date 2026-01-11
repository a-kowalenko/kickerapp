import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useLocalStorageState } from "./useLocalStorageState";
import { useSeasons } from "../features/seasons/useSeasons";
import { useCurrentSeason } from "../features/seasons/useCurrentSeason";
import { SEASON_ALL_TIME, SEASON_OFF_SEASON } from "../utils/constants";

/**
 * Shared hook for season selection logic.
 * Manages season options, selected state, URL params, and localStorage sync.
 * UI-specific logic (icons, styling) should remain in consuming components.
 */
export function useSeasonSelector() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { seasons, isLoading: isLoadingSeasons } = useSeasons();
    const { currentSeason, isLoading: isLoadingCurrent } = useCurrentSeason();

    // Static options (without icons - icons are component-specific UI)
    const staticOptions = [
        {
            text: "All Time",
            value: SEASON_ALL_TIME,
            variant: "alltime",
        },
        {
            text: "Off-Season",
            value: SEASON_OFF_SEASON,
            variant: "offseason",
        },
    ];

    // Season options from database
    const seasonOptions =
        seasons?.map((s) => ({
            text: s.name || `Season ${s.season_number}`,
            value: String(s.id),
            variant:
                currentSeason && String(currentSeason.id) === String(s.id)
                    ? "active"
                    : "historical",
        })) || [];

    const allOptions = [...staticOptions, ...seasonOptions];

    // Helper to get default option (current season if available, otherwise All Time)
    const getDefaultOption = () => {
        if (currentSeason) {
            return {
                text:
                    currentSeason.name ||
                    `Season ${currentSeason.season_number}`,
                value: String(currentSeason.id),
                variant: "active",
            };
        }
        return staticOptions[0]; // All Time
    };

    // Get initial option from URL
    const getInitialOption = () => {
        const urlSeason = searchParams.get("season");
        if (urlSeason) {
            const found = allOptions.find((o) => o.value === urlSeason);
            if (found)
                return {
                    text: found.text,
                    value: found.value,
                    variant: found.variant,
                };
        }
        return null;
    };

    const [selectedOption, setSelectedOption] = useLocalStorageState(
        getInitialOption(),
        "global_season"
    );

    const [initialized, setInitialized] = useState(false);

    // Helper to check if a new season was created since user's last selection
    const isNewSeasonCreated = () => {
        if (!currentSeason || !selectedOption) return false;

        const lastKnown = selectedOption.lastKnownCurrentSeasonId;
        // If no lastKnownCurrentSeasonId stored, a new season might have been created
        if (!lastKnown) return true;

        // If current season ID is greater than what user last knew, new season was created
        return Number(currentSeason.id) > Number(lastKnown);
    };

    // Initialize and sync with URL/localStorage on mount
    useEffect(() => {
        if (!isLoadingSeasons && !isLoadingCurrent && !initialized) {
            const urlSeason = searchParams.get("season");

            // Check if a new season was created - if so, auto-select it
            if (currentSeason && isNewSeasonCreated()) {
                const defaultOpt = getDefaultOption();
                searchParams.set("season", defaultOpt.value);
                setSearchParams(searchParams, { replace: true });
                setSelectedOption({
                    text: defaultOpt.text,
                    value: defaultOpt.value,
                    variant: defaultOpt.variant,
                    lastKnownCurrentSeasonId: String(currentSeason.id),
                });
                setInitialized(true);
                return;
            }

            // If URL already has a valid season param, use it
            if (urlSeason) {
                const found = allOptions.find((o) => o.value === urlSeason);
                if (found) {
                    setSelectedOption({
                        text: found.text,
                        value: found.value,
                        variant: found.variant,
                        lastKnownCurrentSeasonId: currentSeason
                            ? String(currentSeason.id)
                            : selectedOption?.lastKnownCurrentSeasonId,
                    });
                    setInitialized(true);
                    return;
                }
            }

            // Check localStorage
            if (selectedOption) {
                const found = allOptions.find(
                    (o) => o.value === selectedOption.value
                );
                if (found) {
                    searchParams.set("season", found.value);
                    setSearchParams(searchParams, { replace: true });
                    setSelectedOption({
                        text: found.text,
                        value: found.value,
                        variant: found.variant,
                        lastKnownCurrentSeasonId: currentSeason
                            ? String(currentSeason.id)
                            : selectedOption?.lastKnownCurrentSeasonId,
                    });
                    setInitialized(true);
                    return;
                }
            }

            // Otherwise set the default (current season if available)
            const defaultOpt = getDefaultOption();
            searchParams.set("season", defaultOpt.value);
            setSearchParams(searchParams, { replace: true });
            setSelectedOption({
                text: defaultOpt.text,
                value: defaultOpt.value,
                variant: defaultOpt.variant,
                lastKnownCurrentSeasonId: currentSeason
                    ? String(currentSeason.id)
                    : null,
            });
            setInitialized(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoadingSeasons, isLoadingCurrent, currentSeason, seasons]);

    // Handle selection change
    function handleSelect(option) {
        const hasPage = searchParams.get("page");
        if (hasPage) {
            searchParams.set("page", 1);
        }
        searchParams.set("season", option.value);
        setSearchParams(searchParams, { replace: true });
        setSelectedOption({
            text: option.text,
            value: option.value,
            variant: option.variant,
            lastKnownCurrentSeasonId: currentSeason
                ? String(currentSeason.id)
                : null,
        });
    }

    const isLoading = isLoadingSeasons || isLoadingCurrent;

    return {
        // Options
        staticOptions,
        seasonOptions,
        allOptions,
        // State
        selectedOption,
        initialized,
        isLoading,
        // Data
        currentSeason,
        seasons,
        // Actions
        handleSelect,
    };
}
