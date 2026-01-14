import styled from "styled-components";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineEye,
} from "react-icons/hi2";
import Button from "../../../ui/Button";
import Spinner from "../../../ui/Spinner";
import { useKickerPlayers } from "./useKickerPlayers";
import {
    useAdminPlayerStatus,
    useDeleteAdminPlayerStatus,
} from "./useStatusAdmin";
import PlayerStatusModal from "./PlayerStatusModal";
import { media } from "../../../utils/constants";

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
            : props.$variant === "streak"
            ? "var(--color-orange-100)"
            : props.$variant === "bounty"
            ? "var(--color-purple-100)"
            : "var(--color-grey-100)"};
    color: ${(props) =>
        props.$variant === "success"
            ? "var(--color-green-700)"
            : props.$variant === "warning"
            ? "var(--color-yellow-700)"
            : props.$variant === "info"
            ? "var(--color-brand-700)"
            : props.$variant === "streak"
            ? "var(--color-orange-700)"
            : props.$variant === "bounty"
            ? "var(--color-purple-700)"
            : "var(--color-grey-700)"};
`;

const ResultCount = styled.span`
    font-size: 1.2rem;
    color: var(--tertiary-text-color);
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

const StatusList = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
`;

/* ----------------------------------------
   Match Cell - displays last_match_id
----------------------------------------- */
function MatchCell({ matchId }) {
    if (!matchId) return "—";

    return <Badge $variant="info">#{matchId}</Badge>;
}

/* ----------------------------------------
   Main Component
----------------------------------------- */

function PlayerStatusTab() {
    const { players, isLoading: isLoadingPlayers } = useKickerPlayers();

    const [selectedPlayer, setSelectedPlayer] = useState("");
    const [selectedGamemode, setSelectedGamemode] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [viewMode, setViewMode] = useState(false);

    const { playerStatus, isLoading: isLoadingStatus } = useAdminPlayerStatus({
        playerId: selectedPlayer || undefined,
        gamemode: selectedGamemode || undefined,
    });

    const { deletePlayerStatus, isLoading: isDeleting } =
        useDeleteAdminPlayerStatus();

    const isLoading = isLoadingPlayers || isLoadingStatus;

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
                "Are you sure you want to delete this player status entry?"
            )
        ) {
            deletePlayerStatus(id);
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

    const formatStatuses = (statuses) => {
        if (!statuses || statuses.length === 0) return "—";
        return (
            <StatusList>
                {statuses.map((status, idx) => (
                    <Badge key={idx} $variant="warning">
                        {status}
                    </Badge>
                ))}
            </StatusList>
        );
    };

    if (isLoading) {
        return <Spinner />;
    }

    return (
        <Container>
            <FilterRow>
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

                <FilterGroup>
                    <FilterLabel>Gamemode</FilterLabel>
                    <Select
                        value={selectedGamemode}
                        onChange={(e) => setSelectedGamemode(e.target.value)}
                    >
                        <option value="">All Gamemodes</option>
                        <option value="1on1">1on1</option>
                        <option value="2on2">2on2</option>
                    </Select>
                </FilterGroup>
            </FilterRow>

            <Section>
                <SectionHeader>
                    <SectionTitle>
                        Player Status{" "}
                        <ResultCount>
                            ({playerStatus?.length || 0} entries)
                        </ResultCount>
                    </SectionTitle>
                    <Button $size="small" onClick={handleAdd}>
                        <HiOutlinePlus /> Add Entry
                    </Button>
                </SectionHeader>

                {playerStatus && playerStatus.length > 0 ? (
                    <>
                        {/* Desktop Table */}
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Player</Th>
                                    <Th>Gamemode</Th>
                                    <Th>Streak</Th>
                                    <Th>Bounty</Th>
                                    <Th>Active Statuses</Th>
                                    <Th>Last Match</Th>
                                    <Th>Updated At</Th>
                                    <Th>Actions</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {playerStatus.map((item) => (
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
                                            <Badge
                                                $variant={
                                                    item.gamemode === "1on1"
                                                        ? "info"
                                                        : "success"
                                                }
                                            >
                                                {item.gamemode}
                                            </Badge>
                                        </Td>
                                        <Td>
                                            {item.current_streak !== 0 ? (
                                                <Badge
                                                    $variant={
                                                        item.current_streak > 0
                                                            ? "success"
                                                            : "warning"
                                                    }
                                                >
                                                    {item.current_streak > 0
                                                        ? `+${item.current_streak}`
                                                        : item.current_streak}
                                                </Badge>
                                            ) : (
                                                "0"
                                            )}
                                        </Td>
                                        <Td>
                                            {item.current_bounty > 0 ? (
                                                <Badge $variant="bounty">
                                                    {item.current_bounty} pts
                                                </Badge>
                                            ) : (
                                                "—"
                                            )}
                                        </Td>
                                        <Td>
                                            {formatStatuses(
                                                item.active_statuses
                                            )}
                                        </Td>
                                        <Td>
                                            <MatchCell
                                                matchId={item.last_match_id}
                                            />
                                        </Td>
                                        <Td>{formatDate(item.updated_at)}</Td>
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
                                                        handleDelete(item.id)
                                                    }
                                                    disabled={isDeleting}
                                                    title="Delete"
                                                >
                                                    <HiOutlineTrash />
                                                </IconButton>
                                            </Actions>
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>

                        {/* Mobile List */}
                        <MobileList>
                            {playerStatus.map((item) => (
                                <MobileCard key={item.id}>
                                    <MobileCardHeader>
                                        <MobileCardTitle>
                                            {item.player?.name ? (
                                                <PlayerLink
                                                    to={`/user/${item.player.name}/profile`}
                                                >
                                                    {item.player.name}
                                                </PlayerLink>
                                            ) : (
                                                "Unknown"
                                            )}
                                        </MobileCardTitle>
                                        <IconButton
                                            onClick={() => handleView(item)}
                                            title="View / Edit"
                                        >
                                            <HiOutlineEye />
                                        </IconButton>
                                    </MobileCardHeader>
                                    <MobileCardDetail>
                                        <span>Gamemode:</span>
                                        <Badge
                                            $variant={
                                                item.gamemode === "1on1"
                                                    ? "info"
                                                    : "success"
                                            }
                                        >
                                            {item.gamemode}
                                        </Badge>
                                    </MobileCardDetail>
                                    <MobileCardDetail>
                                        <span>Streak:</span>
                                        <span>
                                            {item.current_streak > 0
                                                ? `+${item.current_streak}`
                                                : item.current_streak}
                                        </span>
                                    </MobileCardDetail>
                                    <MobileCardDetail>
                                        <span>Bounty:</span>
                                        <span>
                                            {item.current_bounty > 0
                                                ? `${item.current_bounty} pts`
                                                : "—"}
                                        </span>
                                    </MobileCardDetail>
                                    <MobileCardDetail>
                                        <span>Updated:</span>
                                        <span>
                                            {formatDate(item.updated_at)}
                                        </span>
                                    </MobileCardDetail>
                                </MobileCard>
                            ))}
                        </MobileList>
                    </>
                ) : (
                    <NoData>
                        No player status entries found. Try adjusting your
                        filters or add a new entry.
                    </NoData>
                )}
            </Section>

            {showModal && (
                <PlayerStatusModal
                    item={editingItem}
                    viewMode={viewMode}
                    players={players}
                    onClose={handleCloseModal}
                />
            )}
        </Container>
    );
}

export default PlayerStatusTab;
