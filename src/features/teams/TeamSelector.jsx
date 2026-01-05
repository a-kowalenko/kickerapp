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
    padding: 1.2rem 2.4rem;
    font-size: 1.6rem;
    color: var(--primary-dropdown-text-color);
    background-color: ${(props) =>
        props.$isOpen
            ? "var(--primary-dropdown-background-color-hover)"
            : "var(--primary-dropdown-background-color)"};
    border: 1px solid var(--primary-dropdown-border-color);
    border-radius: var(--border-radius-sm);
    box-shadow: ${(props) =>
        props.$isOpen
            ? "0 1px 5px rgba(0, 0, 0, 0.727)"
            : "0 1px 3px rgba(0, 0, 0, 0.361)"};
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
        background-color: var(--primary-dropdown-background-color-hover);
        box-shadow: 0 1px 5px rgba(0, 0, 0, 0.727);
    }

    &:disabled {
        background-color: var(--disabled-color);
        cursor: not-allowed;
    }

    ${(props) =>
        props.$isOpen &&
        `
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
    background-color: var(--dropdown-list-background-color);
    border-radius: 0 0 var(--border-radius-sm) var(--border-radius-sm);
    box-shadow: 1px 1px 1px var(--primary-dropdown-border-color),
        -1px -1px 1px var(--primary-dropdown-border-color);

    &::-webkit-scrollbar {
        display: none;
    }
    scrollbar-width: none;
    -ms-overflow-style: none;
`;

const Option = styled.li`
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding: 1rem 1.6rem;
    cursor: pointer;
    background-color: var(--dropdown-list-background-color);
    transition: background-color 0.2s ease;

    &:hover {
        background-color: var(--dropdown-list-selected-background-color);
    }

    ${(props) =>
        props.$selected &&
        `
        background-color: var(--dropdown-list-selected-background-color);
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

    // Helper to normalize team data (handle both flat and nested formats)
    const getPlayer1Name = (team) => team.player1_name || team.player1?.name;
    const getPlayer2Name = (team) => team.player2_name || team.player2?.name;
    const getPlayer1Avatar = (team) =>
        team.player1_avatar || team.player1?.avatar;
    const getPlayer2Avatar = (team) =>
        team.player2_avatar || team.player2?.avatar;

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
                                    {getPlayer1Name(selectedTeam)} &{" "}
                                    {getPlayer2Name(selectedTeam)}
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
                                                    getPlayer1Avatar(team) ||
                                                    DEFAULT_AVATAR
                                                }
                                            />
                                            <Avatar
                                                $size="xs"
                                                src={
                                                    getPlayer2Avatar(team) ||
                                                    DEFAULT_AVATAR
                                                }
                                            />
                                        </PlayerAvatars>
                                        <span>
                                            {getPlayer1Name(team)} &{" "}
                                            {getPlayer2Name(team)}
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
