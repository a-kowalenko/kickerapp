import styled from "styled-components";
import { useState, useCallback } from "react";
import { IoChevronDown, IoGameController } from "react-icons/io5";
import { usePlayersActivity } from "./usePlayersActivity";
import PlayerActivityCardMobile from "./PlayerActivityCardMobile";
import PlayerDetailSheet from "./PlayerDetailSheet";
import MobileTooltipSheet from "../../ui/MobileTooltipSheet";
import LoadingSpinner from "../../ui/LoadingSpinner";

/* ----------------------------------------
   PlayerActivityListMobile Styles
   
   Mobile-optimized activity list with collapsible sections
   Matches PlayerActivitySidebar styling patterns
----------------------------------------- */

const ListContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background-color: var(--secondary-background-color);
`;

const ScrollArea = styled.div`
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 0.8rem;
`;

const Section = styled.div`
    margin-bottom: 0.8rem;
`;

const SectionHeader = styled.button`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 1rem 1.2rem;
    background: var(--tertiary-background-color);
    border: none;
    border-radius: var(--border-radius-sm);
    color: var(--secondary-text-color);
    font-size: 1.3rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease;

    &:active {
        background-color: var(--quaternary-background-color);
        color: var(--primary-text-color);
    }
`;

const SectionTitle = styled.span`
    display: flex;
    align-items: center;
    gap: 0.6rem;
`;

const CountBadge = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 22px;
    padding: 0 7px;
    border-radius: 999px;
    font-size: 1.1rem;
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

const ChevronIcon = styled.span`
    display: flex;
    align-items: center;
    transform: ${(props) =>
        props.$isExpanded ? "rotate(0deg)" : "rotate(-90deg)"};
    transition: transform 0.25s ease-out;

    svg {
        font-size: 1.4rem;
        color: var(--secondary-text-color);
    }
`;

const SectionContent = styled.div`
    overflow: hidden;

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
    padding: 1.2rem;
    color: var(--secondary-text-color);
    font-size: 1.4rem;
    text-align: center;
    font-style: italic;
`;

const LoadingContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    flex: 1;
`;

const InMatchIcon = styled(IoGameController)`
    font-size: 1.4rem;
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
   PlayerActivityListMobile Component
   
   Mobile activity list with collapsible sections:
   - In Match
   - Online
   - Offline
   - Inactive
----------------------------------------- */
function PlayerActivityListMobile() {
    const [expandedSections, setExpandedSections] = useState({
        inMatch: true,
        online: true,
        offline: true,
        inactive: false,
    });

    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const { inMatch, online, offline, inactive, isLoading } =
        usePlayersActivity();

    const toggleSection = useCallback((section) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    }, []);

    const handlePlayerTap = useCallback((player) => {
        setSelectedPlayer(player);
        setIsSheetOpen(true);
    }, []);

    const handleCloseSheet = useCallback(() => {
        setIsSheetOpen(false);
        // Delay clearing player data for smoother animation
        setTimeout(() => setSelectedPlayer(null), 300);
    }, []);

    if (isLoading) {
        return (
            <ListContainer>
                <LoadingContainer>
                    <LoadingSpinner />
                </LoadingContainer>
            </ListContainer>
        );
    }

    return (
        <ListContainer>
            <ScrollArea>
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
                            <ChevronIcon $isExpanded={expandedSections.inMatch}>
                                <IoChevronDown />
                            </ChevronIcon>
                        </SectionHeader>
                        <SectionContent $isExpanded={expandedSections.inMatch}>
                            <div>
                                {inMatch.map((player) => (
                                    <PlayerActivityCardMobile
                                        key={player.player_id}
                                        player={player}
                                        onTap={() => handlePlayerTap(player)}
                                    />
                                ))}
                            </div>
                        </SectionContent>
                    </Section>
                )}

                {/* Online Section */}
                <Section>
                    <SectionHeader onClick={() => toggleSection("online")}>
                        <SectionTitle>
                            <OnlineDot />
                            Online
                            <CountBadge $variant="online">
                                {online.length}
                            </CountBadge>
                        </SectionTitle>
                        <ChevronIcon $isExpanded={expandedSections.online}>
                            <IoChevronDown />
                        </ChevronIcon>
                    </SectionHeader>
                    <SectionContent $isExpanded={expandedSections.online}>
                        <div>
                            {online.length === 0 ? (
                                <EmptyState>No one online</EmptyState>
                            ) : (
                                online.map((player) => (
                                    <PlayerActivityCardMobile
                                        key={player.player_id}
                                        player={player}
                                        onTap={() => handlePlayerTap(player)}
                                    />
                                ))
                            )}
                        </div>
                    </SectionContent>
                </Section>

                {/* Offline Section */}
                <Section>
                    <SectionHeader onClick={() => toggleSection("offline")}>
                        <SectionTitle>
                            <OfflineDot />
                            Offline
                            <CountBadge $variant="offline">
                                {offline.length}
                            </CountBadge>
                        </SectionTitle>
                        <ChevronIcon $isExpanded={expandedSections.offline}>
                            <IoChevronDown />
                        </ChevronIcon>
                    </SectionHeader>
                    <SectionContent $isExpanded={expandedSections.offline}>
                        <div>
                            {offline.length === 0 && online.length === 0 ? (
                                <EmptyState>
                                    No recently active players
                                </EmptyState>
                            ) : offline.length === 0 && online.length > 0 ? (
                                <EmptyState>All players are online</EmptyState>
                            ) : (
                                offline.map((player) => (
                                    <PlayerActivityCardMobile
                                        key={player.player_id}
                                        player={player}
                                        onTap={() => handlePlayerTap(player)}
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
                            onClick={() => toggleSection("inactive")}
                        >
                            <SectionTitle>
                                Inactive
                                <CountBadge $variant="inactive">
                                    {inactive.length}
                                </CountBadge>
                            </SectionTitle>
                            <ChevronIcon
                                $isExpanded={expandedSections.inactive}
                            >
                                <IoChevronDown />
                            </ChevronIcon>
                        </SectionHeader>
                        <SectionContent $isExpanded={expandedSections.inactive}>
                            <div>
                                {inactive.map((player) => (
                                    <PlayerActivityCardMobile
                                        key={player.player_id}
                                        player={player}
                                        onTap={() => handlePlayerTap(player)}
                                    />
                                ))}
                            </div>
                        </SectionContent>
                    </Section>
                )}
            </ScrollArea>

            {/* Player Detail Bottom Sheet */}
            <MobileTooltipSheet
                isOpen={isSheetOpen}
                onClose={handleCloseSheet}
                title={selectedPlayer?.player_name}
                icon="👤"
            >
                <PlayerDetailSheet player={selectedPlayer} />
            </MobileTooltipSheet>
        </ListContainer>
    );
}

export default PlayerActivityListMobile;
