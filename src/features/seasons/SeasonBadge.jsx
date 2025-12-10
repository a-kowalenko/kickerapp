import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import styled, { css } from "styled-components";
import { HiOutlineChevronDown } from "react-icons/hi2";
import { GiInfinity } from "react-icons/gi";
import { TbClockPause } from "react-icons/tb";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";
import { useSeasons } from "./useSeasons";
import { useCurrentSeason } from "./useCurrentSeason";
import { SEASON_ALL_TIME, SEASON_OFF_SEASON } from "../../utils/constants";
import SpinnerMini from "../../ui/SpinnerMini";

const StyledSeasonBadge = styled.div`
    position: relative;
    display: inline-block;
`;

const BadgeToggle = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.4rem 1rem;
    border-radius: 1rem;
    font-size: 1.2rem;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;

    /* Active season (currently running) */
    ${(props) =>
        props.$variant === "active" &&
        css`
            background-color: var(--color-brand-500);
            color: var(--color-brand-50);
            border: 1px solid var(--color-brand-600);

            &:hover {
                background-color: var(--color-brand-600);
            }
        `}

    /* Historical season (past season selected) */
    ${(props) =>
        props.$variant === "historical" &&
        css`
            background-color: var(--color-grey-300);
            color: var(--color-grey-700);
            border: 1px solid var(--color-grey-400);

            &:hover {
                background-color: var(--color-grey-400);
            }
        `}

    /* All Time selection */
    ${(props) =>
        props.$variant === "alltime" &&
        css`
            background-color: var(--color-indigo-100);
            color: var(--color-indigo-700);
            border: 1px solid var(--color-indigo-300);

            &:hover {
                background-color: var(--color-indigo-200);
            }
        `}

    /* Off-Season selection */
    ${(props) =>
        props.$variant === "offseason" &&
        css`
            background-color: var(--color-yellow-100);
            color: var(--color-yellow-700);
            border: 1px solid var(--color-yellow-300);

            &:hover {
                background-color: var(--color-yellow-200);
            }
        `}

    & svg {
        width: 1.4rem;
        height: 1.4rem;
        flex-shrink: 0;
    }
`;

const ChevronIcon = styled(HiOutlineChevronDown)`
    transform: rotate(${(props) => (props.$isOpen ? "180deg" : "0deg")});
    transition: transform 0.2s ease-in-out;
`;

const DropdownList = styled.ul`
    position: absolute;
    top: calc(100% + 0.4rem);
    left: 50%;
    transform: translateX(-50%);
    min-width: 16rem;
    z-index: 1000;
    background-color: var(--dropdown-list-background-color);
    border-radius: var(--border-radius-sm);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border: 1px solid var(--primary-dropdown-border-color);
    overflow: hidden;

    max-height: ${(props) => (props.$isOpen ? "300px" : "0")};
    opacity: ${(props) => (props.$isOpen ? "1" : "0")};
    overflow-y: auto;
    transition:
        max-height 0.2s ease-in-out,
        opacity 0.2s ease-in-out;

    /* Open upwards on mobile (footer position) */
    ${(props) =>
        props.$openUpwards &&
        css`
            top: auto;
            bottom: calc(100% + 0.4rem);
        `}
`;

const DropdownItem = styled.li`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.8rem 1.2rem;
    cursor: pointer;
    font-size: 1.2rem;
    transition: background-color 0.15s ease;

    &:hover {
        background-color: var(--dropdown-list-selected-background-color);
    }

    ${(props) =>
        props.$isSelected &&
        css`
            background-color: var(--dropdown-list-selected-background-color);
            font-weight: 600;
        `}

    & svg {
        width: 1.4rem;
        height: 1.4rem;
        flex-shrink: 0;
    }
`;

const Divider = styled.div`
    width: 100%;
    height: 1px;
    background-color: var(--color-grey-300);
`;

const SectionLabel = styled.div`
    padding: 0.6rem 1.2rem 0.4rem;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-grey-500);
    text-transform: uppercase;
    letter-spacing: 0.05em;
`;

function SeasonBadge({ openUpwards = false }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const { seasons, isLoading: isLoadingSeasons } = useSeasons();
    const { currentSeason, isLoading: isLoadingCurrent } = useCurrentSeason();

    // Build options (without icons - icons are rendered separately to avoid localStorage serialization issues)
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

    // Helper to get icon for a value
    const getIcon = (value) => {
        if (value === SEASON_ALL_TIME) return <GiInfinity />;
        if (value === SEASON_OFF_SEASON) return <TbClockPause />;
        return null;
    };

    // Determine default value
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

    // Get initial option from URL or localStorage
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

    const [isOpen, setIsOpen] = useState(false);
    const [initialized, setInitialized] = useState(false);

    const close = () => setIsOpen(false);
    const ref = useOutsideClick(close, false);

    // Set search param on mount when data is ready
    useEffect(() => {
        if (!isLoadingSeasons && !isLoadingCurrent && !initialized) {
            const urlSeason = searchParams.get("season");

            // If URL already has a valid season param, use it
            if (urlSeason) {
                const found = allOptions.find((o) => o.value === urlSeason);
                if (found) {
                    setSelectedOption({
                        text: found.text,
                        value: found.value,
                        variant: found.variant,
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
            });
            setInitialized(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoadingSeasons, isLoadingCurrent, currentSeason, seasons]);

    function handleToggle(e) {
        e.stopPropagation();
        setIsOpen((open) => !open);
    }

    function handleSelect(option) {
        const hasPage = searchParams.get("page");
        if (hasPage) {
            searchParams.set("page", 1);
        }
        searchParams.set("season", option.value);
        setSearchParams(searchParams, { replace: true });
        // Store only serializable data
        setSelectedOption({
            text: option.text,
            value: option.value,
            variant: option.variant,
        });
        close();
    }

    if (isLoadingSeasons || isLoadingCurrent) {
        return <SpinnerMini />;
    }

    // Determine current variant based on selection
    const currentVariant = selectedOption?.variant || "active";

    return (
        <StyledSeasonBadge ref={ref}>
            <BadgeToggle
                onClick={handleToggle}
                $variant={currentVariant}
                $isOpen={isOpen}
            >
                {getIcon(selectedOption?.value)}
                <span>{selectedOption?.text || "Select Season"}</span>
                <ChevronIcon $isOpen={isOpen} />
            </BadgeToggle>

            <DropdownList $isOpen={isOpen} $openUpwards={openUpwards}>
                <SectionLabel>Quick Filters</SectionLabel>
                {staticOptions.map((option) => (
                    <DropdownItem
                        onClick={() => handleSelect(option)}
                        key={option.value}
                        $isSelected={selectedOption?.value === option.value}
                    >
                        {getIcon(option.value)}
                        <span>{option.text}</span>
                    </DropdownItem>
                ))}

                {seasonOptions.length > 0 && (
                    <>
                        <Divider />
                        <SectionLabel>Seasons</SectionLabel>
                        {seasonOptions.map((option) => (
                            <DropdownItem
                                onClick={() => handleSelect(option)}
                                key={option.value}
                                $isSelected={
                                    selectedOption?.value === option.value
                                }
                            >
                                <span>{option.text}</span>
                                {currentSeason &&
                                    String(currentSeason.id) ===
                                        option.value && (
                                        <span
                                            style={{
                                                marginLeft: "auto",
                                                fontSize: "1rem",
                                                opacity: 0.7,
                                            }}
                                        >
                                            (active)
                                        </span>
                                    )}
                            </DropdownItem>
                        ))}
                    </>
                )}
            </DropdownList>
        </StyledSeasonBadge>
    );
}

export default SeasonBadge;
