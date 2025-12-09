import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { HiOutlineChevronDown } from "react-icons/hi2";
import { GiBattleAxe } from "react-icons/gi";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";
import { useSeasons } from "./useSeasons";
import { useCurrentSeason } from "./useCurrentSeason";
import { SEASON_ALL_TIME, SEASON_OFF_SEASON } from "../../utils/constants";
import SpinnerMini from "../../ui/SpinnerMini";

const RotateIcon = styled(HiOutlineChevronDown)`
    transform: rotate(${(props) => (props.$isOpen ? "-90deg" : "0deg")});
    transition: transform 0.2s ease-in-out;
`;

const StyledFilter = styled.div`
    position: relative;
`;

const Toggle = styled.div`
    position: relative;
    width: 100%;
    cursor: pointer;

    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid var(--primary-dropdown-border-color);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.361);
    padding: 1.2rem 2.4rem;
    border-radius: var(--border-radius-sm);
    gap: 1.4rem;
    min-width: 16rem;

    background-color: ${(props) =>
        props.$isOpen
            ? "var(--primary-dropdown-background-color-hover)"
            : "var(--primary-dropdown-background-color)"};

    box-shadow: ${(props) =>
        props.$isOpen && "2px 2px 2px 2px rgba(0, 0, 0, 0.4)"};

    &:hover:not(:disabled) {
        background-color: var(--primary-dropdown-background-color-hover);
        box-shadow: 0 1px 5px rgba(0, 0, 0, 0.727);
    }

    & svg {
        width: 2rem;
        height: 2rem;
    }
`;

const List = styled.ul`
    position: absolute;
    top: 5%;
    left: 100%;
    width: 100%;
    z-index: 10;

    align-items: flex-start;
    flex-direction: column;
    border-radius: var(--border-radius-sm);

    box-shadow:
        1px 1px 1px var(--primary-dropdown-border-color),
        -1px -1px 1px var(--primary-dropdown-border-color);

    max-height: ${(props) => (props.$isOpen ? "300px" : "0")};
    max-width: ${(props) => (props.$isOpen ? "100%" : "0")};
    overflow-y: auto;
    overflow-x: hidden;
    display: ${(props) => (props.$isOpen ? "flex" : "hidden")};
    transition:
        max-height 0.2s ease-in-out,
        max-width 0.2s ease-in-out;
`;

const Element = styled.div`
    display: flex;
    width: 100%;
    padding: 0.6rem 1.2rem;
    background-color: var(--dropdown-list-background-color);
    cursor: pointer;

    &:hover {
        background-color: var(--dropdown-list-selected-background-color);
    }

    ${(props) =>
        props.$isSelected
            ? "background-color: var(--dropdown-list-selected-background-color);"
            : ""}
`;

const Divider = styled.div`
    width: 100%;
    height: 1px;
    background-color: var(--color-grey-300);
`;

function SeasonFilter({ name = "season", defaultToCurrent = true }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const { seasons, isLoading: isLoadingSeasons } = useSeasons();
    const { currentSeason, isLoading: isLoadingCurrent } = useCurrentSeason();

    // Build options: All Time, Off-Season, then all seasons (newest first)
    const staticOptions = [
        { text: "All Time", value: SEASON_ALL_TIME },
        { text: "Off-Season", value: SEASON_OFF_SEASON },
    ];

    const seasonOptions =
        seasons?.map((s) => ({
            text: s.name || `Season ${s.season_number}`,
            value: String(s.id),
        })) || [];

    const allOptions = [...staticOptions, ...seasonOptions];

    // Determine default value
    const getDefaultOption = () => {
        if (defaultToCurrent && currentSeason) {
            return {
                text:
                    currentSeason.name ||
                    `Season ${currentSeason.season_number}`,
                value: String(currentSeason.id),
            };
        }
        return staticOptions[0]; // All Time
    };

    // Get initial option from URL or localStorage
    const getInitialOption = () => {
        const urlSeason = searchParams.get("season");
        if (urlSeason) {
            const found = allOptions.find((o) => o.value === urlSeason);
            if (found) return found;
        }
        return null; // Will be set by useEffect once data loads
    };

    const [selectedOption, setSelectedOption] = useLocalStorageState(
        getInitialOption(),
        `${name}_season`
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
                    setSelectedOption(found);
                    setInitialized(true);
                    return;
                }
            }

            // Otherwise set the default (current season if available)
            const defaultOpt = getDefaultOption();
            searchParams.set("season", defaultOpt.value);
            setSearchParams(searchParams, { replace: true });
            setSelectedOption(defaultOpt);
            setInitialized(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoadingSeasons, isLoadingCurrent, currentSeason, seasons]);

    function handleToggle(e) {
        e.stopPropagation();
        setIsOpen((open) => !open);
    }

    function handleSelect(option) {
        const hasPage = !!searchParams.get("page");
        if (hasPage) {
            searchParams.set("page", 1);
        }
        searchParams.set("season", option.value);
        setSearchParams(searchParams, { replace: true });
        setSelectedOption(option);
        close();
    }

    if (isLoadingSeasons || isLoadingCurrent) {
        return <SpinnerMini />;
    }

    return (
        <StyledFilter>
            <Toggle onClick={handleToggle} $isOpen={isOpen}>
                <GiBattleAxe />
                <span>{selectedOption?.text || selectedOption?.value}</span>
                <RotateIcon $isOpen={isOpen} />
            </Toggle>
            <List ref={ref} $isOpen={isOpen}>
                {staticOptions.map((option) => (
                    <Element
                        onClick={() => handleSelect(option)}
                        key={option.value}
                        $isSelected={selectedOption?.value === option.value}
                    >
                        <span>{option.text}</span>
                    </Element>
                ))}
                {seasonOptions.length > 0 && <Divider />}
                {seasonOptions.map((option) => (
                    <Element
                        onClick={() => handleSelect(option)}
                        key={option.value}
                        $isSelected={selectedOption?.value === option.value}
                    >
                        <span>{option.text}</span>
                    </Element>
                ))}
            </List>
        </StyledFilter>
    );
}

export default SeasonFilter;
