import styled, { keyframes } from "styled-components";
import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineEye,
} from "react-icons/hi2";
import Button from "../../../ui/Button";
import Spinner from "../../../ui/Spinner";
import { useSeasons } from "../../seasons/useSeasons";
import { useKickerPlayers } from "./useKickerPlayers";
import { useAchievementDefinitions } from "../useAchievementDefinitions";
import {
    useAdminPlayerProgress,
    useDeleteAdminPlayerProgress,
} from "./usePlayerAchievementsAdmin";
import PlayerProgressModal from "./PlayerProgressModal";
import { media } from "../../../utils/constants";

/* ----------------------------------------
   Tooltip Animation
----------------------------------------- */
const tooltipFadeIn = keyframes`
    from {
        opacity: 0;
        transform: translateY(4px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`;

/* ----------------------------------------
   Tooltip Styled Components
----------------------------------------- */
const TooltipContainer = styled.div`
    position: fixed;
    z-index: 10000;
    animation: ${tooltipFadeIn} 0.2s ease;
    pointer-events: none;
`;

const TooltipContent = styled.div`
    background-color: var(--color-grey-0);
    border: 1px solid var(--secondary-border-color);
    border-radius: var(--border-radius-md);
    padding: 1rem 1.2rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1);
    min-width: 18rem;
    max-width: 28rem;
`;

const TooltipArrow = styled.div`
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-bottom: 6px solid var(--secondary-border-color);

    &::after {
        content: "";
        position: absolute;
        top: 1px;
        left: -5px;
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-bottom: 5px solid var(--color-grey-0);
    }
`;

const TooltipHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 0.6rem;
    padding-bottom: 0.6rem;
    border-bottom: 1px solid var(--secondary-border-color);
`;

const TooltipIcon = styled.span`
    font-size: 1.6rem;
`;

const TooltipTitle = styled.span`
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--primary-text-color);
`;

const TooltipDescription = styled.p`
    font-size: 1.2rem;
    color: var(--secondary-text-color);
    margin: 0;
    line-height: 1.4;
`;

const TooltipProgress = styled.div`
    margin-top: 0.6rem;
    font-size: 1.1rem;
    color: var(--color-brand-600);
    font-weight: 500;
`;

/* ----------------------------------------
   Main Styled Components
----------------------------------------- */

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2rem;
`;

const FilterRow = styled.div`
    display: flex;
    gap: 1.6rem;
    flex-wrap: wrap;
    align-items: flex-end;

    ${media.mobile} {
        flex-direction: column;
        align-items: stretch;
    }
`;

const FilterGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
`;

const FilterLabel = styled.label`
    font-size: 1.2rem;
    font-weight: 500;
    color: var(--secondary-text-color);
`;

const Select = styled.select`
    padding: 0.8rem 1.2rem;
    border: 1px solid var(--primary-input-border-color);
    border-radius: var(--border-radius-sm);
    font-size: 1.4rem;
    background-color: var(--primary-input-background-color);
    color: var(--primary-text-color);
    min-width: 18rem;

    &:hover {
        background-color: var(--primary-input-background-color-hover);
    }

    &:focus {
        outline: none;
        border-color: var(--primary-input-border-color-active);
    }

    option {
        background-color: var(--dropdown-list-background-color);
        color: var(--primary-text-color);
    }

    ${media.mobile} {
        min-width: 100%;
    }
`;

const Section = styled.div`
    background-color: var(--color-grey-0);
    border: 1px solid var(--secondary-border-color);
    border-radius: var(--border-radius-md);
    padding: 2.4rem;

    ${media.mobile} {
        padding: 1.6rem;
    }
`;

const SectionHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.6rem;
    flex-wrap: wrap;
    gap: 1rem;
`;

const SectionTitle = styled.h2`
    font-size: 1.8rem;
    font-weight: 600;
    margin: 0;
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;

    ${media.mobile} {
        display: none;
    }
`;

const Th = styled.th`
    text-align: left;
    padding: 1.2rem;
    border-bottom: 2px solid var(--color-grey-200);
    font-weight: 600;
    font-size: 1.4rem;
    color: var(--secondary-text-color);
`;

const Td = styled.td`
    padding: 1.2rem;
    border-bottom: 1px solid var(--color-grey-100);
    font-size: 1.4rem;
`;

const MobileList = styled.div`
    display: none;

    ${media.mobile} {
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
    }
`;

const MobileCard = styled.div`
    background-color: var(--color-grey-50);
    border: 1px solid var(--secondary-border-color);
    border-radius: var(--border-radius-sm);
    padding: 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
`;

const MobileCardHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const MobileCardTitle = styled.span`
    font-weight: 600;
    font-size: 1.4rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;
`;

const MobileCardDetail = styled.div`
    font-size: 1.2rem;
    color: var(--secondary-text-color);
    display: flex;
    justify-content: space-between;
`;

const Actions = styled.div`
    display: flex;
    gap: 0.8rem;
`;

const IconButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.4rem;
    color: var(--secondary-text-color);
    transition: color 0.2s;

    &:hover {
        color: var(--primary-text-color);
    }

    &:hover.delete {
        color: var(--color-red-700);
    }

    & svg {
        width: 2rem;
        height: 2rem;
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const NoData = styled.div`
    text-align: center;
    padding: 2rem;
    color: var(--tertiary-text-color);
`;

const Badge = styled.span`
    display: inline-block;
    padding: 0.2rem 0.6rem;
    font-size: 1rem;
    border-radius: var(--border-radius-sm);
    background-color: ${(props) =>
        props.$variant === "success"
            ? "var(--color-green-100)"
            : props.$variant === "warning"
            ? "var(--color-yellow-100)"
            : props.$variant === "info"
            ? "var(--color-brand-100)"
            : "var(--color-grey-100)"};
    color: ${(props) =>
        props.$variant === "success"
            ? "var(--color-green-700)"
            : props.$variant === "warning"
            ? "var(--color-yellow-700)"
            : props.$variant === "info"
            ? "var(--color-brand-700)"
            : "var(--color-grey-700)"};
`;

const ResultCount = styled.span`
    font-size: 1.2rem;
    color: var(--tertiary-text-color);
`;

const ProgressBar = styled.div`
    width: 100%;
    max-width: 12rem;
    height: 0.8rem;
    background-color: var(--color-grey-200);
    border-radius: var(--border-radius-sm);
    overflow: hidden;
`;

const ProgressFill = styled.div`
    height: 100%;
    background-color: ${(props) =>
        props.$percent >= 100
            ? "var(--color-green-500)"
            : "var(--color-brand-500)"};
    width: ${(props) => Math.min(100, props.$percent)}%;
    transition: width 0.3s ease;
`;

const ProgressCell = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
`;

const ProgressText = styled.span`
    font-size: 1.2rem;
    color: var(--secondary-text-color);
`;

const PlayerLink = styled(Link)`
    color: var(--primary-text-color);
    text-decoration: none;
    font-weight: 500;

    &:hover {
        color: var(--color-brand-600);
        text-decoration: underline;
    }
`;

const HoverTrigger = styled.span`
    cursor: help;
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
`;

/* ----------------------------------------
   Tooltip Hook
----------------------------------------- */
function useTooltip(tooltipWidth = 200) {
    const [isHovered, setIsHovered] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);

    const handleMouseEnter = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            let left = rect.left + rect.width / 2 - tooltipWidth / 2;

            // Keep tooltip within viewport
            if (left < 8) left = 8;
            if (left + tooltipWidth > window.innerWidth - 8) {
                left = window.innerWidth - tooltipWidth - 8;
            }

            setTooltipPos({
                top: rect.bottom + 8,
                left,
            });
        }
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    return {
        isHovered,
        tooltipPos,
        handleMouseEnter,
        handleMouseLeave,
        triggerRef,
    };
}

/* ----------------------------------------
   Achievement Tooltip Component
----------------------------------------- */
function AchievementTooltip({ achievement, isVisible, position }) {
    if (!isVisible || !achievement) return null;

    return createPortal(
        <TooltipContainer
            style={{
                top: position.top,
                left: position.left,
            }}
        >
            <TooltipContent>
                <TooltipArrow />
                <TooltipHeader>
                    <TooltipIcon>{achievement.icon || "🏆"}</TooltipIcon>
                    <TooltipTitle>{achievement.name}</TooltipTitle>
                </TooltipHeader>
                {achievement.description && (
                    <TooltipDescription>
                        {achievement.description}
                    </TooltipDescription>
                )}
                {achievement.max_progress > 0 && (
                    <TooltipProgress>
                        Target: {achievement.max_progress}
                    </TooltipProgress>
                )}
            </TooltipContent>
        </TooltipContainer>,
        document.body
    );
}

/* ----------------------------------------
   Achievement Cell with Tooltip
----------------------------------------- */
function AchievementCell({ achievement }) {
    const {
        isHovered,
        tooltipPos,
        handleMouseEnter,
        handleMouseLeave,
        triggerRef,
    } = useTooltip(220);

    return (
        <>
            <HoverTrigger
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {achievement?.icon || "🏆"}
                {achievement?.name}
            </HoverTrigger>
            <AchievementTooltip
                achievement={achievement}
                isVisible={isHovered}
                position={tooltipPos}
            />
        </>
    );
}

/* ----------------------------------------
   Main Component
----------------------------------------- */

function PlayerProgressTab() {
    const { seasons, isLoading: isLoadingSeasons } = useSeasons();
    const { players, isLoading: isLoadingPlayers } = useKickerPlayers();
    const { definitions, isLoading: isLoadingDefinitions } =
        useAchievementDefinitions();

    const [selectedSeason, setSelectedSeason] = useState("");
    const [selectedPlayer, setSelectedPlayer] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [viewMode, setViewMode] = useState(false);

    const { playerProgress, isLoading: isLoadingProgress } =
        useAdminPlayerProgress({
            seasonId: selectedSeason || undefined,
            playerId: selectedPlayer || undefined,
        });

    const { deletePlayerProgress, isLoading: isDeleting } =
        useDeleteAdminPlayerProgress();

    const isLoading =
        isLoadingSeasons ||
        isLoadingPlayers ||
        isLoadingDefinitions ||
        isLoadingProgress;

    const handleAdd = () => {
        setEditingItem(null);
        setViewMode(false);
        setShowModal(true);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setViewMode(false);
        setShowModal(true);
    };

    const handleView = (item) => {
        setEditingItem(item);
        setViewMode(true);
        setShowModal(true);
    };

    const handleDelete = (id) => {
        if (
            window.confirm(
                "Are you sure you want to delete this progress entry?"
            )
        ) {
            deletePlayerProgress(id);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingItem(null);
        setViewMode(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleString("en-US", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getProgressPercent = (current, max) => {
        if (!max || max <= 0) return 0;
        return Math.round((current / max) * 100);
    };

    if (isLoading) {
        return <Spinner />;
    }

    return (
        <Container>
            <FilterRow>
                <FilterGroup>
                    <FilterLabel>Season</FilterLabel>
                    <Select
                        value={selectedSeason}
                        onChange={(e) => setSelectedSeason(e.target.value)}
                    >
                        <option value="">All Seasons</option>
                        {seasons?.map((season) => (
                            <option key={season.id} value={season.id}>
                                {season.name}
                            </option>
                        ))}
                    </Select>
                </FilterGroup>

                <FilterGroup>
                    <FilterLabel>Player</FilterLabel>
                    <Select
                        value={selectedPlayer}
                        onChange={(e) => setSelectedPlayer(e.target.value)}
                    >
                        <option value="">All Players</option>
                        {players?.map((player) => (
                            <option key={player.id} value={player.id}>
                                {player.name}
                            </option>
                        ))}
                    </Select>
                </FilterGroup>
            </FilterRow>

            <Section>
                <SectionHeader>
                    <SectionTitle>
                        Achievement Progress{" "}
                        <ResultCount>
                            ({playerProgress?.length || 0} entries)
                        </ResultCount>
                    </SectionTitle>
                    <Button $size="small" onClick={handleAdd}>
                        <HiOutlinePlus /> Add Entry
                    </Button>
                </SectionHeader>

                {playerProgress && playerProgress.length > 0 ? (
                    <>
                        {/* Desktop Table */}
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Player</Th>
                                    <Th>Achievement</Th>
                                    <Th>Season</Th>
                                    <Th>Progress</Th>
                                    <Th>Updated At</Th>
                                    <Th>Actions</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {playerProgress.map((item) => {
                                    const percent = getProgressPercent(
                                        item.current_progress,
                                        item.achievement?.max_progress
                                    );
                                    return (
                                        <tr key={item.id}>
                                            <Td>
                                                {item.player?.name ? (
                                                    <PlayerLink
                                                        to={`/user/${item.player.name}/profile`}
                                                    >
                                                        {item.player.name}
                                                    </PlayerLink>
                                                ) : (
                                                    "—"
                                                )}
                                            </Td>
                                            <Td>
                                                <AchievementCell
                                                    achievement={
                                                        item.achievement
                                                    }
                                                />
                                            </Td>
                                            <Td>
                                                {item.season?.name || (
                                                    <Badge>Global</Badge>
                                                )}
                                            </Td>
                                            <Td>
                                                <ProgressCell>
                                                    <ProgressBar>
                                                        <ProgressFill
                                                            $percent={percent}
                                                        />
                                                    </ProgressBar>
                                                    <ProgressText>
                                                        {item.current_progress}{" "}
                                                        /{" "}
                                                        {item.achievement
                                                            ?.max_progress ||
                                                            "?"}{" "}
                                                        ({percent}%)
                                                    </ProgressText>
                                                </ProgressCell>
                                            </Td>
                                            <Td>
                                                {formatDate(item.updated_at)}
                                            </Td>
                                            <Td>
                                                <Actions>
                                                    <IconButton
                                                        onClick={() =>
                                                            handleView(item)
                                                        }
                                                        title="View"
                                                    >
                                                        <HiOutlineEye />
                                                    </IconButton>
                                                    <IconButton
                                                        onClick={() =>
                                                            handleEdit(item)
                                                        }
                                                        title="Edit"
                                                    >
                                                        <HiOutlinePencil />
                                                    </IconButton>
                                                    <IconButton
                                                        className="delete"
                                                        onClick={() =>
                                                            handleDelete(
                                                                item.id
                                                            )
                                                        }
                                                        disabled={isDeleting}
                                                        title="Delete"
                                                    >
                                                        <HiOutlineTrash />
                                                    </IconButton>
                                                </Actions>
                                            </Td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>

                        {/* Mobile List */}
                        <MobileList>
                            {playerProgress.map((item) => {
                                const percent = getProgressPercent(
                                    item.current_progress,
                                    item.achievement?.max_progress
                                );
                                return (
                                    <MobileCard key={item.id}>
                                        <MobileCardHeader>
                                            <MobileCardTitle>
                                                {item.achievement?.icon || "🏆"}
                                                {item.achievement?.name}
                                            </MobileCardTitle>
                                            <IconButton
                                                onClick={() => handleView(item)}
                                                title="View / Edit"
                                            >
                                                <HiOutlineEye />
                                            </IconButton>
                                        </MobileCardHeader>
                                        <MobileCardDetail>
                                            <span>Player:</span>
                                            <span>
                                                {item.player?.name ? (
                                                    <PlayerLink
                                                        to={`/user/${item.player.name}/profile`}
                                                    >
                                                        {item.player.name}
                                                    </PlayerLink>
                                                ) : (
                                                    "—"
                                                )}
                                            </span>
                                        </MobileCardDetail>
                                        <MobileCardDetail>
                                            <span>Season:</span>
                                            <span>
                                                {item.season?.name || "Global"}
                                            </span>
                                        </MobileCardDetail>
                                        <MobileCardDetail>
                                            <span>Progress:</span>
                                            <span>
                                                {item.current_progress} /{" "}
                                                {item.achievement
                                                    ?.max_progress || "?"}{" "}
                                                ({percent}%)
                                            </span>
                                        </MobileCardDetail>
                                        <ProgressBar>
                                            <ProgressFill $percent={percent} />
                                        </ProgressBar>
                                        <MobileCardDetail>
                                            <span>Updated:</span>
                                            <span>
                                                {formatDate(item.updated_at)}
                                            </span>
                                        </MobileCardDetail>
                                    </MobileCard>
                                );
                            })}
                        </MobileList>
                    </>
                ) : (
                    <NoData>
                        No progress entries found. Try adjusting your filters or
                        add a new entry.
                    </NoData>
                )}
            </Section>

            {showModal && (
                <PlayerProgressModal
                    item={editingItem}
                    viewMode={viewMode}
                    players={players}
                    achievements={definitions}
                    seasons={seasons}
                    onClose={handleCloseModal}
                />
            )}
        </Container>
    );
}

export default PlayerProgressTab;
