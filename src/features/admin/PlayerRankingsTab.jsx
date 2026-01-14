import styled from "styled-components";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
} from "react-icons/hi2";
import Button from "../../ui/Button";
import Spinner from "../../ui/Spinner";
import { useKickerPlayers } from "../achievements/admin/useKickerPlayers";
import { useSeasons } from "../seasons/useSeasons";
import {
    useAdminPlayerRankings,
    useDeleteAdminPlayerRanking,
} from "./useRankingsAdmin";
import PlayerRankingsModal from "./PlayerRankingsModal";
import { media } from "../../utils/constants";

/* ----------------------------------------
   Styled Components
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

const PlayerLink = styled(Link)`
    color: var(--primary-text-color);
    text-decoration: none;
    font-weight: 500;

    &:hover {
        color: var(--color-brand-600);
        text-decoration: underline;
    }
`;

/* ----------------------------------------
   Main Component
----------------------------------------- */

function PlayerRankingsTab() {
    const { players, isLoading: isLoadingPlayers } = useKickerPlayers();
    const { seasons, isLoading: isLoadingSeasons } = useSeasons();
    const [filterPlayer, setFilterPlayer] = useState("");
    const [filterSeason, setFilterSeason] = useState("");

    const { playerRankings, isLoading: isLoadingRankings } =
        useAdminPlayerRankings({
            playerId: filterPlayer || undefined,
            seasonId: filterSeason || undefined,
        });

    const { deletePlayerRanking, isLoading: isDeleting } =
        useDeleteAdminPlayerRanking();

    const [showModal, setShowModal] = useState(false);
    const [editingRanking, setEditingRanking] = useState(null);

    const isLoading = isLoadingPlayers || isLoadingSeasons || isLoadingRankings;

    if (isLoading) {
        return <Spinner />;
    }

    const handleCreate = () => {
        setEditingRanking(null);
        setShowModal(true);
    };

    const handleEdit = (ranking) => {
        setEditingRanking(ranking);
        setShowModal(true);
    };

    const handleDelete = (id) => {
        if (
            window.confirm(
                "Are you sure you want to delete this ranking entry?"
            )
        ) {
            deletePlayerRanking(id);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingRanking(null);
    };

    return (
        <Container>
            <FilterRow>
                <FilterGroup>
                    <FilterLabel>Player</FilterLabel>
                    <Select
                        value={filterPlayer}
                        onChange={(e) => setFilterPlayer(e.target.value)}
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
                    <FilterLabel>Season</FilterLabel>
                    <Select
                        value={filterSeason}
                        onChange={(e) => setFilterSeason(e.target.value)}
                    >
                        <option value="">All Seasons</option>
                        {seasons?.map((season) => (
                            <option key={season.id} value={season.id}>
                                {season.name ||
                                    `Season ${season.season_number}`}
                                {season.is_active ? " (Active)" : ""}
                            </option>
                        ))}
                    </Select>
                </FilterGroup>
            </FilterRow>

            <Section>
                <SectionHeader>
                    <SectionTitle>Player Season Rankings</SectionTitle>
                    <div
                        style={{
                            display: "flex",
                            gap: "1rem",
                            alignItems: "center",
                        }}
                    >
                        <ResultCount>
                            {playerRankings?.length || 0} entries
                        </ResultCount>
                        <Button $size="small" onClick={handleCreate}>
                            <HiOutlinePlus /> Add Ranking
                        </Button>
                    </div>
                </SectionHeader>

                {playerRankings && playerRankings.length > 0 ? (
                    <>
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Player</Th>
                                    <Th>Season</Th>
                                    <Th>1on1 W/L</Th>
                                    <Th>1on1 MMR</Th>
                                    <Th>2on2 W/L</Th>
                                    <Th>2on2 MMR</Th>
                                    <Th>Bounty</Th>
                                    <Th>Actions</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {playerRankings.map((ranking) => (
                                    <tr key={ranking.id}>
                                        <Td>
                                            <PlayerLink
                                                to={`/player/${ranking.player?.id}`}
                                            >
                                                {ranking.player?.name ||
                                                    "Unknown"}
                                            </PlayerLink>
                                        </Td>
                                        <Td>
                                            {ranking.season?.is_active ? (
                                                <Badge $variant="success">
                                                    {ranking.season?.name ||
                                                        `S${ranking.season?.season_number}`}
                                                </Badge>
                                            ) : (
                                                <Badge>
                                                    {ranking.season?.name ||
                                                        `S${ranking.season?.season_number}`}
                                                </Badge>
                                            )}
                                        </Td>
                                        <Td>
                                            {ranking.wins}/{ranking.losses}
                                        </Td>
                                        <Td>
                                            <Badge $variant="info">
                                                {ranking.mmr}
                                            </Badge>
                                        </Td>
                                        <Td>
                                            {ranking.wins2on2}/
                                            {ranking.losses2on2}
                                        </Td>
                                        <Td>
                                            <Badge $variant="info">
                                                {ranking.mmr2on2}
                                            </Badge>
                                        </Td>
                                        <Td>
                                            {ranking.bounty_claimed || 0} /{" "}
                                            {ranking.bounty_claimed_2on2 || 0}
                                        </Td>
                                        <Td>
                                            <Actions>
                                                <IconButton
                                                    onClick={() =>
                                                        handleEdit(ranking)
                                                    }
                                                    title="Edit"
                                                >
                                                    <HiOutlinePencil />
                                                </IconButton>
                                                <IconButton
                                                    className="delete"
                                                    onClick={() =>
                                                        handleDelete(ranking.id)
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

                        <MobileList>
                            {playerRankings.map((ranking) => (
                                <MobileCard key={ranking.id}>
                                    <MobileCardHeader>
                                        <MobileCardTitle>
                                            {ranking.player?.name || "Unknown"}
                                        </MobileCardTitle>
                                        <Actions>
                                            <IconButton
                                                onClick={() =>
                                                    handleEdit(ranking)
                                                }
                                            >
                                                <HiOutlinePencil />
                                            </IconButton>
                                            <IconButton
                                                className="delete"
                                                onClick={() =>
                                                    handleDelete(ranking.id)
                                                }
                                                disabled={isDeleting}
                                            >
                                                <HiOutlineTrash />
                                            </IconButton>
                                        </Actions>
                                    </MobileCardHeader>
                                    <MobileCardDetail>
                                        <span>Season</span>
                                        <span>
                                            {ranking.season?.name ||
                                                `S${ranking.season?.season_number}`}
                                        </span>
                                    </MobileCardDetail>
                                    <MobileCardDetail>
                                        <span>1on1</span>
                                        <span>
                                            {ranking.wins}/{ranking.losses} (
                                            {ranking.mmr} MMR)
                                        </span>
                                    </MobileCardDetail>
                                    <MobileCardDetail>
                                        <span>2on2</span>
                                        <span>
                                            {ranking.wins2on2}/
                                            {ranking.losses2on2} (
                                            {ranking.mmr2on2} MMR)
                                        </span>
                                    </MobileCardDetail>
                                </MobileCard>
                            ))}
                        </MobileList>
                    </>
                ) : (
                    <NoData>No player rankings found</NoData>
                )}
            </Section>

            {showModal && (
                <PlayerRankingsModal
                    ranking={editingRanking}
                    onClose={handleCloseModal}
                    players={players}
                    seasons={seasons}
                />
            )}
        </Container>
    );
}

export default PlayerRankingsTab;
