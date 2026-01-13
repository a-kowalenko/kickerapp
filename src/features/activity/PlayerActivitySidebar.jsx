import styled, { css } from "styled-components";
import { useState } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";
import { IoChevronDown, IoGameController } from "react-icons/io5";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";
import { usePlayersActivity } from "./usePlayersActivity";
import PlayerActivityCard from "./PlayerActivityCard";
import LoadingSpinner from "../../ui/LoadingSpinner";
import ProfileMenu from "../../ui/ProfileMenu";

/* ----------------------------------------
   Styled Components
----------------------------------------- */
const SidebarContainer = styled.aside`
    position: fixed;
    top: 0; /* Below header */
    /* padding-top: 80px; */
    right: 0;
    height: 100%;
    background-color: var(--primary-background-color);
    border-left: 1px solid var(--secondary-border-color);
    transition: width 0.2s ease-out;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    z-index: 2; /* Below header (100) */

    ${(props) =>
        props.$isOpen
            ? css`
                  width: 280px;
              `
            : css`
                  width: 44px;
              `}
`;

const ProfileMenuContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 1.6rem 4.8rem;
    border-bottom: 1px solid var(--secondary-border-color);
    background-color: var(--primary-background-color);
    opacity: 1;
    height: 83px;
    overflow: visible;
    position: relative;
    z-index: 10;
`;

const ToggleButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    height: 40px;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--secondary-border-color);
    color: var(--secondary-text-color);
    cursor: pointer;
    transition:
        background-color 0.15s ease,
        color 0.15s ease;

    &:hover {
        background-color: var(--secondary-background-color);
        color: var(--primary-text-color);
    }

    svg {
        margin: 0 0.8rem;
        font-size: 1.6rem;
    }
`;

const SidebarContent = styled.div`
    flex: 1;
    overflow-y: auto; /* Always show scrollbar space */
    overflow-x: hidden;
    padding: ${(props) => (props.$isOpen ? "0.5rem" : "0")};

    /* Custom scrollbar */
    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-track {
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background-color: var(--secondary-border-color);
        border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background-color: var(--primary-border-color);
    }
`;

const Section = styled.div`
    margin-bottom: 0.5rem;
`;

const SectionHeader = styled.button`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0.6rem 0.8rem;
    background: transparent;
    border: none;
    border-radius: var(--border-radius-sm);
    color: var(--secondary-text-color);
    font-size: 1.2rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    cursor: pointer;
    transition:
        background-color 0.15s ease,
        color 0.15s ease;

    &:hover {
        background-color: var(--secondary-background-color);
        color: var(--primary-text-color);
    }

    svg {
        font-size: 1.1rem;
        color: var(--secondary-text-color);
        transition: transform 0.25s ease-out;
    }
`;

const ChevronIcon = styled.span`
    display: flex;
    align-items: center;
    transform: ${(props) =>
        props.$isExpanded ? "rotate(0deg)" : "rotate(90deg)"};
    transition: transform 0.25s ease-out;
`;

const SectionTitle = styled.span`
    display: flex;
    align-items: center;
    gap: 0.4rem;
`;

const CountBadge = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 22px;
    padding: 0 6px;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 700;
    background-color: ${(props) =>
        props.$variant === "online"
            ? "rgba(34, 197, 94, 0.2)"
            : props.$variant === "offline"
              ? "rgba(156, 163, 175, 0.2)"
              : "rgba(107, 114, 128, 0.2)"};
    color: ${(props) =>
        props.$variant === "online"
            ? "#22c55e"
            : props.$variant === "offline"
              ? "#9ca3af"
              : "#6b7280"};
`;

const SectionContent = styled.div`
    overflow: hidden;
    padding-left: 0.2rem;

    /* Smooth expand/collapse animation */
    display: grid;
    grid-template-rows: ${(props) => (props.$isExpanded ? "1fr" : "0fr")};
    opacity: ${(props) => (props.$isExpanded ? 1 : 0)};
    transition:
        grid-template-rows 0.25s ease-out,
        opacity 0.2s ease-out;

    & > div {
        overflow: hidden;
    }
`;

const EmptyState = styled.div`
    padding: 0.8rem 0.6rem;
    color: var(--secondary-text-color);
    font-size: 1.4rem;
    text-align: center;
    font-style: italic;
`;

const LoadingContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
`;

const InMatchIcon = styled(IoGameController)`
    font-size: 14px;
    color: #22c55e !important;
`;

const OnlineDot = styled.span`
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #22c55e;
`;

const OfflineDot = styled.span`
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #6b7280;
`;

/* ----------------------------------------
   PlayerActivitySidebar Component
   
   Discord-style sidebar showing player activity status
   Collapsible sections: Online, Offline, Inactive
----------------------------------------- */
export function PlayerActivitySidebar() {
    const [isOpen, setIsOpen] = useLocalStorageState(
        true,
        "isOpenRightSidebar"
    );
    const [expandedSections, setExpandedSections] = useState({
        inMatch: true,
        online: true,
        offline: true,
        inactive: false,
    });

    const { inMatch, online, offline, inactive, isLoading } =
        usePlayersActivity();

    const toggleSidebar = () => {
        setIsOpen((prev) => !prev);
    };

    const toggleSection = (section) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    return (
        <SidebarContainer $isOpen={isOpen}>
            {/* ProfileMenu appears when header is hidden */}

            <ProfileMenuContainer>
                {isOpen && <ProfileMenu inSidebar={true} />}
            </ProfileMenuContainer>

            <ToggleButton
                onClick={toggleSidebar}
                title={isOpen ? "Close sidebar" : "Open sidebar"}
            >
                {isOpen ? <HiChevronRight /> : <HiChevronLeft />}
            </ToggleButton>

            {isOpen && (
                <SidebarContent $isOpen={isOpen}>
                    {isLoading ? (
                        <LoadingContainer>
                            <LoadingSpinner />
                        </LoadingContainer>
                    ) : (
                        <>
                            {/* In Match Section */}
                            {inMatch.length > 0 && (
                                <Section>
                                    <SectionHeader
                                        onClick={() => toggleSection("inMatch")}
                                    >
                                        <SectionTitle>
                                            <InMatchIcon />
                                            In Match
                                            <CountBadge $variant="online">
                                                {inMatch.length}
                                            </CountBadge>
                                        </SectionTitle>
                                        <ChevronIcon
                                            $isExpanded={
                                                expandedSections.inMatch
                                            }
                                        >
                                            <IoChevronDown />
                                        </ChevronIcon>
                                    </SectionHeader>
                                    <SectionContent
                                        $isExpanded={expandedSections.inMatch}
                                    >
                                        <div>
                                            {inMatch.map((player) => (
                                                <PlayerActivityCard
                                                    key={player.player_id}
                                                    player={player}
                                                />
                                            ))}
                                        </div>
                                    </SectionContent>
                                </Section>
                            )}

                            {/* Online Section */}
                            <Section>
                                <SectionHeader
                                    onClick={() => toggleSection("online")}
                                >
                                    <SectionTitle>
                                        <OnlineDot />
                                        Online
                                        <CountBadge $variant="online">
                                            {online.length}
                                        </CountBadge>
                                    </SectionTitle>
                                    <ChevronIcon
                                        $isExpanded={expandedSections.online}
                                    >
                                        <IoChevronDown />
                                    </ChevronIcon>
                                </SectionHeader>
                                <SectionContent
                                    $isExpanded={expandedSections.online}
                                >
                                    <div>
                                        {online.length === 0 ? (
                                            <EmptyState>
                                                No one online
                                            </EmptyState>
                                        ) : (
                                            online.map((player) => (
                                                <PlayerActivityCard
                                                    key={player.player_id}
                                                    player={player}
                                                />
                                            ))
                                        )}
                                    </div>
                                </SectionContent>
                            </Section>

                            {/* Offline Section */}
                            <Section>
                                <SectionHeader
                                    onClick={() => toggleSection("offline")}
                                >
                                    <SectionTitle>
                                        <OfflineDot />
                                        Offline
                                        <CountBadge $variant="offline">
                                            {offline.length}
                                        </CountBadge>
                                    </SectionTitle>
                                    <ChevronIcon
                                        $isExpanded={expandedSections.offline}
                                    >
                                        <IoChevronDown />
                                    </ChevronIcon>
                                </SectionHeader>
                                <SectionContent
                                    $isExpanded={expandedSections.offline}
                                >
                                    <div>
                                        {offline.length === 0 &&
                                        online.length === 0 ? (
                                            <EmptyState>
                                                No recently active players
                                            </EmptyState>
                                        ) : offline.length === 0 &&
                                          online.length > 0 ? (
                                            <EmptyState>
                                                All players are online
                                            </EmptyState>
                                        ) : (
                                            offline.map((player) => (
                                                <PlayerActivityCard
                                                    key={player.player_id}
                                                    player={player}
                                                />
                                            ))
                                        )}
                                    </div>
                                </SectionContent>
                            </Section>

                            {/* Inactive Section */}
                            {inactive.length > 0 && (
                                <Section>
                                    <SectionHeader
                                        onClick={() =>
                                            toggleSection("inactive")
                                        }
                                    >
                                        <SectionTitle>
                                            Inactive
                                            <CountBadge $variant="inactive">
                                                {inactive.length}
                                            </CountBadge>
                                        </SectionTitle>
                                        <ChevronIcon
                                            $isExpanded={
                                                expandedSections.inactive
                                            }
                                        >
                                            <IoChevronDown />
                                        </ChevronIcon>
                                    </SectionHeader>
                                    <SectionContent
                                        $isExpanded={expandedSections.inactive}
                                    >
                                        <div>
                                            {inactive.map((player) => (
                                                <PlayerActivityCard
                                                    key={player.player_id}
                                                    player={player}
                                                />
                                            ))}
                                        </div>
                                    </SectionContent>
                                </Section>
                            )}
                        </>
                    )}
                </SidebarContent>
            )}
        </SidebarContainer>
    );
}

export default PlayerActivitySidebar;
