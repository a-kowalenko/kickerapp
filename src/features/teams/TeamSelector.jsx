import styled from "styled-components";
import { useState } from "react";
import { HiOutlineChevronDown, HiOutlineUsers } from "react-icons/hi2";
import Avatar from "../../ui/Avatar";
import SpinnerMini from "../../ui/SpinnerMini";
import { DEFAULT_AVATAR } from "../../utils/constants";
import { useMyActiveTeams } from "./useTeams";
import { useOutsideClick } from "../../hooks/useOutsideClick";

const Container = styled.div`
    position: relative;
    width: 100%;
`;

const Toggle = styled.button`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 1.2rem 1.6rem;
    font-size: 1.6rem;
    background-color: var(--primary-dropdown-background-color);
    border: 1px solid var(--primary-dropdown-border-color);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
        background-color: var(--primary-dropdown-background-color-hover);
        box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    ${(props) =>
        props.$isOpen &&
        `
        background-color: var(--primary-dropdown-background-color-hover);
        border-radius: var(--border-radius-sm) var(--border-radius-sm) 0 0;
    `}
`;

const ToggleContent = styled.div`
    display: flex;
    align-items: center;
    gap: 1.2rem;
    overflow: hidden;
`;

const PlaceholderIcon = styled(HiOutlineUsers)`
    width: 3.2rem;
    height: 3.2rem;
    color: var(--color-grey-400);
`;

const Placeholder = styled.span`
    color: var(--color-grey-500);
`;

const SelectedTeam = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
`;

const TeamLogo = styled.img`
    width: 3.2rem;
    height: 3.2rem;
    border-radius: var(--border-radius-sm);
    object-fit: cover;
`;

const DefaultTeamLogo = styled.div`
    width: 3.2rem;
    height: 3.2rem;
    border-radius: var(--border-radius-sm);
    background: linear-gradient(
        135deg,
        var(--color-brand-100) 0%,
        var(--color-brand-200) 100%
    );
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--color-brand-600);
`;

const TeamInfo = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    overflow: hidden;
`;

const TeamName = styled.span`
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--primary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const TeamPlayers = styled.span`
    font-size: 1.2rem;
    color: var(--color-grey-500);
`;

const ChevronIcon = styled(HiOutlineChevronDown)`
    width: 2rem;
    height: 2rem;
    color: var(--color-grey-500);
    transition: transform 0.2s ease;
    flex-shrink: 0;

    ${(props) => props.$isOpen && `transform: rotate(180deg);`}
`;

const Dropdown = styled.ul`
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 100;
    max-height: 30rem;
    overflow-y: auto;
    background-color: var(--primary-dropdown-background-color);
    border: 1px solid var(--primary-dropdown-border-color);
    border-top: none;
    border-radius: 0 0 var(--border-radius-sm) var(--border-radius-sm);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const Option = styled.li`
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding: 1.2rem 1.6rem;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
        background-color: var(--primary-dropdown-background-color-hover);
    }

    ${(props) =>
        props.$selected &&
        `
        background-color: var(--color-brand-50);
    `}
`;

const OptionTeamInfo = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
`;

const OptionTeamName = styled.span`
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--primary-text-color);
`;

const OptionTeamMeta = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    font-size: 1.2rem;
    color: var(--color-grey-500);
`;

const MmrBadge = styled.span`
    font-family: "Sono";
    font-weight: 500;
    color: var(--color-brand-600);
`;

const PlayerAvatars = styled.div`
    display: flex;
    align-items: center;

    & > *:not(:first-child) {
        margin-left: -0.6rem;
    }
`;

const EmptyState = styled.div`
    padding: 2rem;
    text-align: center;
    color: var(--color-grey-500);
    font-size: 1.4rem;
`;

function TeamSelector({
    value,
    onChange,
    disabled = false,
    // New props for external team list support
    teams: externalTeams,
    selectedTeam: externalSelectedTeam,
    onSelect,
    placeholder = "Select a team...",
}) {
    const [isOpen, setIsOpen] = useState(false);
    const { teams: internalTeams, isLoading } = useMyActiveTeams();

    const ref = useOutsideClick(() => setIsOpen(false));

    // Use external teams if provided, otherwise use internal teams
    const teams = externalTeams ?? internalTeams;

    // Support both old (value/onChange) and new (selectedTeam/onSelect) API
    const selectedTeam =
        externalSelectedTeam ?? teams.find((t) => t.id === value);

    const handleSelect = (team) => {
        if (onSelect) {
            onSelect(team);
        } else if (onChange) {
            onChange(team);
        }
        setIsOpen(false);
    };

    const getInitials = (name) =>
        name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

    return (
        <Container ref={ref}>
            <Toggle
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                $isOpen={isOpen}
                disabled={disabled || (isLoading && !externalTeams)}
            >
                <ToggleContent>
                    {isLoading && !externalTeams ? (
                        <SpinnerMini />
                    ) : selectedTeam ? (
                        <SelectedTeam>
                            {selectedTeam.logo_url ? (
                                <TeamLogo
                                    src={selectedTeam.logo_url}
                                    alt={selectedTeam.name}
                                />
                            ) : (
                                <DefaultTeamLogo>
                                    {getInitials(selectedTeam.name)}
                                </DefaultTeamLogo>
                            )}
                            <TeamInfo>
                                <TeamName>{selectedTeam.name}</TeamName>
                                <TeamPlayers>
                                    {selectedTeam.player1?.name} &{" "}
                                    {selectedTeam.player2?.name}
                                </TeamPlayers>
                            </TeamInfo>
                        </SelectedTeam>
                    ) : (
                        <>
                            <PlaceholderIcon />
                            <Placeholder>{placeholder}</Placeholder>
                        </>
                    )}
                </ToggleContent>
                <ChevronIcon $isOpen={isOpen} />
            </Toggle>

            {isOpen && (
                <Dropdown>
                    {teams.length === 0 ? (
                        <EmptyState>
                            No teams available. Create a team first!
                        </EmptyState>
                    ) : (
                        teams.map((team) => (
                            <Option
                                key={team.id}
                                onClick={() => handleSelect(team)}
                                $selected={team.id === value}
                            >
                                {team.logo_url ? (
                                    <TeamLogo
                                        src={team.logo_url}
                                        alt={team.name}
                                    />
                                ) : (
                                    <DefaultTeamLogo>
                                        {getInitials(team.name)}
                                    </DefaultTeamLogo>
                                )}
                                <OptionTeamInfo>
                                    <OptionTeamName>{team.name}</OptionTeamName>
                                    <OptionTeamMeta>
                                        <PlayerAvatars>
                                            <Avatar
                                                $size="xs"
                                                src={
                                                    team.player1?.avatar ||
                                                    DEFAULT_AVATAR
                                                }
                                            />
                                            <Avatar
                                                $size="xs"
                                                src={
                                                    team.player2?.avatar ||
                                                    DEFAULT_AVATAR
                                                }
                                            />
                                        </PlayerAvatars>
                                        <span>
                                            {team.player1?.name} &{" "}
                                            {team.player2?.name}
                                        </span>
                                    </OptionTeamMeta>
                                </OptionTeamInfo>
                                <MmrBadge>{team.mmr} MMR</MmrBadge>
                            </Option>
                        ))
                    )}
                </Dropdown>
            )}
        </Container>
    );
}

export default TeamSelector;
