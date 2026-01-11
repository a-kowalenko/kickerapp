import styled from "styled-components";
import { GiInfinity } from "react-icons/gi";
import { TbClockPause } from "react-icons/tb";
import { useSeasonSelector } from "../../hooks/useSeasonSelector";
import { SEASON_ALL_TIME, SEASON_OFF_SEASON } from "../../utils/constants";
import Dropdown from "../../ui/Dropdown";
import SpinnerMini from "../../ui/SpinnerMini";

const StyledSeasonSelector = styled.div`
    display: inline-block;
    min-width: 14rem;
    max-width: fit-content;
    font-size: 1.2rem;

    /* Match input field height from Invite Link */
    & > div > div:first-child {
        padding: 0.9rem 1.6rem;
        gap: 1.2rem;
    }
`;

const OptionContent = styled.span`
    display: flex;
    align-items: center;
    gap: 0.6rem;

    & svg {
        width: 1.4rem;
        height: 1.4rem;
        flex-shrink: 0;
    }
`;

const ActiveLabel = styled.span`
    margin-left: auto;
    font-size: 1rem;
    opacity: 0.7;
    color: var(--color-brand-600);
`;

/**
 * Season selector component for Settings page.
 * Uses the shared useSeasonSelector hook for state management.
 * Renders a Dropdown with season options and visual indicators.
 */
function SeasonSelector() {
    const {
        staticOptions,
        seasonOptions,
        selectedOption,
        isLoading,
        currentSeason,
        handleSelect,
    } = useSeasonSelector();

    // Helper to get icon for a value (UI-specific)
    const getIcon = (value) => {
        if (value === SEASON_ALL_TIME) return <GiInfinity />;
        if (value === SEASON_OFF_SEASON) return <TbClockPause />;
        return null;
    };

    // Build dropdown options with text that includes icons and active label
    const buildDropdownOptions = () => {
        const options = [];

        // Add static options (All Time, Off-Season)
        staticOptions.forEach((opt) => {
            const icon = getIcon(opt.value);
            options.push({
                text: (
                    <OptionContent>
                        {icon}
                        <span>{opt.text}</span>
                    </OptionContent>
                ),
                value: opt.value,
                variant: opt.variant,
                originalText: opt.text,
            });
        });

        // Add season options
        seasonOptions.forEach((opt) => {
            const isActive =
                currentSeason && String(currentSeason.id) === opt.value;
            options.push({
                text: (
                    <OptionContent>
                        <span>{opt.text}</span>
                        {isActive && <ActiveLabel>(active)</ActiveLabel>}
                    </OptionContent>
                ),
                value: opt.value,
                variant: opt.variant,
                originalText: opt.text,
            });
        });

        return options;
    };

    if (isLoading) {
        return <SpinnerMini />;
    }

    const dropdownOptions = buildDropdownOptions();

    // Find the currently selected option for the dropdown
    const getSelectedForDropdown = () => {
        if (!selectedOption) return null;

        const found = dropdownOptions.find(
            (o) => o.value === selectedOption.value
        );
        if (found) {
            return {
                text: found.text,
                value: found.value,
            };
        }
        return null;
    };

    const handleDropdownSelect = (value) => {
        // Find the full option object
        const staticOpt = staticOptions.find((o) => o.value === value);
        if (staticOpt) {
            handleSelect(staticOpt);
            return;
        }

        const seasonOpt = seasonOptions.find((o) => o.value === value);
        if (seasonOpt) {
            handleSelect(seasonOpt);
        }
    };

    return (
        <StyledSeasonSelector>
            <Dropdown
                options={dropdownOptions}
                onSelect={handleDropdownSelect}
                initSelected={getSelectedForDropdown()}
                minWidth="14rem"
            />
        </StyledSeasonSelector>
    );
}

export default SeasonSelector;
