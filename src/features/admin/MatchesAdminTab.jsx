import styled from "styled-components";
import { useState } from "react";
import { HiOutlinePencil, HiOutlineTrash, HiOutlineEye } from "react-icons/hi2";
import Spinner from "../../ui/Spinner";
import { useKickerPlayers } from "../achievements/admin/useKickerPlayers";
import { useSeasons } from "../seasons/useSeasons";
import { useAdminMatches, useDeleteAdminMatch } from "./useMatchesAdmin";
import MatchModal from "./MatchModal";
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
    min-width: 14rem;

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
            : props.$variant === "error"
            ? "var(--color-red-100)"
            : "var(--color-grey-100)"};
    color: ${(props) =>
        props.$variant === "success"
            ? "var(--color-green-700)"
            : props.$variant === "warning"
            ? "var(--color-yellow-700)"
            : props.$variant === "info"
            ? "var(--color-brand-700)"
            : props.$variant === "error"
            ? "var(--color-red-700)"
            : "var(--color-grey-700)"};
`;

const ResultCount = styled.span`
    font-size: 1.2rem;
    color: var(--tertiary-text-color);
`;

const ScoreDisplay = styled.span`
    font-weight: 600;
    font-size: 1.4rem;
`;

/* ----------------------------------------
   Helper functions
----------------------------------------- */

function getStatusBadge(status) {
    switch (status) {
        case "finished":
            return <Badge $variant="success">Finished</Badge>;
        case "active":
            return <Badge $variant="warning">Active</Badge>;
        case "cancelled":
            return <Badge $variant="error">Cancelled</Badge>;
        default:
            return <Badge>{status}</Badge>;
    }
}

function formatDate(dateString) {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/* ----------------------------------------
   Main Component
----------------------------------------- */

function MatchesAdminTab() {
    const { players, isLoading: isLoadingPlayers } = useKickerPlayers();
    const { seasons, isLoading: isLoadingSeasons } = useSeasons();
    const [filterPlayer, setFilterPlayer] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterGamemode, setFilterGamemode] = useState("");
    const [filterSeason, setFilterSeason] = useState("");
    const [filterLimit, setFilterLimit] = useState("100");

    const { matches, isLoading: isLoadingMatches } = useAdminMatches({
        playerId: filterPlayer || undefined,
        status: filterStatus || undefined,
        gamemode: filterGamemode || undefined,
        seasonId: filterSeason || undefined,
        limit: parseInt(filterLimit) || 100,
    });

    const { deleteMatch, isLoading: isDeletingMatch } = useDeleteAdminMatch();

    const [showModal, setShowModal] = useState(false);
    const [editingMatch, setEditingMatch] = useState(null);
    const [viewingMatch, setViewingMatch] = useState(null);

    const isLoading = isLoadingPlayers || isLoadingSeasons || isLoadingMatches;

    if (isLoading) {
        return <Spinner />;
    }

    const handleEdit = (match) => {
        setEditingMatch(match);
        setViewingMatch(null);
        setShowModal(true);
    };

    const handleView = (match) => {
        setViewingMatch(match);
        setEditingMatch(null);
        setShowModal(true);
    };

    const handleDelete = (id) => {
        if (
            window.confirm(
                "Are you sure you want to delete this match? This action cannot be undone."
            )
        ) {
            deleteMatch(id);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingMatch(null);
        setViewingMatch(null);
    };

    const getTeamDisplay = (match, team) => {
        if (team === 1) {
            if (match.gamemode === "2on2") {
                return `${match.player1_data?.name || "?"} & ${
                    match.player3_data?.name || "?"
                }`;
            }
            return match.player1_data?.name || "?";
        } else {
            if (match.gamemode === "2on2") {
                return `${match.player2_data?.name || "?"} & ${
                    match.player4_data?.name || "?"
                }`;
            }
            return match.player2_data?.name || "?";
        }
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
                    <FilterLabel>Status</FilterLabel>
                    <Select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="finished">Finished</option>
                        <option value="cancelled">Cancelled</option>
                    </Select>
                </FilterGroup>

                <FilterGroup>
                    <FilterLabel>Gamemode</FilterLabel>
                    <Select
                        value={filterGamemode}
                        onChange={(e) => setFilterGamemode(e.target.value)}
                    >
                        <option value="">All Gamemodes</option>
                        <option value="1on1">1on1</option>
                        <option value="2on2">2on2</option>
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
                            </option>
                        ))}
                    </Select>
                </FilterGroup>

                <FilterGroup>
                    <FilterLabel>Limit</FilterLabel>
                    <Select
                        value={filterLimit}
                        onChange={(e) => setFilterLimit(e.target.value)}
                    >
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="200">200</option>
                        <option value="500">500</option>
                    </Select>
                </FilterGroup>
            </FilterRow>

            <Section>
                <SectionHeader>
                    <SectionTitle>Matches</SectionTitle>
                    <ResultCount>
                        {matches?.length || 0} matches found
                    </ResultCount>
                </SectionHeader>

                {matches && matches.length > 0 ? (
                    <>
                        <Table>
                            <thead>
                                <tr>
                                    <Th>#</Th>
                                    <Th>Team 1</Th>
                                    <Th>Score</Th>
                                    <Th>Team 2</Th>
                                    <Th>Mode</Th>
                                    <Th>Status</Th>
                                    <Th>Date</Th>
                                    <Th>Actions</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {matches.map((match) => (
                                    <tr key={match.id}>
                                        <Td>
                                            <Badge $variant="info">
                                                #{match.nr || match.id}
                                            </Badge>
                                        </Td>
                                        <Td>{getTeamDisplay(match, 1)}</Td>
                                        <Td>
                                            <ScoreDisplay>
                                                {match.scoreTeam1} :{" "}
                                                {match.scoreTeam2}
                                            </ScoreDisplay>
                                        </Td>
                                        <Td>{getTeamDisplay(match, 2)}</Td>
                                        <Td>
                                            <Badge>{match.gamemode}</Badge>
                                        </Td>
                                        <Td>{getStatusBadge(match.status)}</Td>
                                        <Td>{formatDate(match.created_at)}</Td>
                                        <Td>
                                            <Actions>
                                                <IconButton
                                                    onClick={() =>
                                                        handleView(match)
                                                    }
                                                    title="View details"
                                                >
                                                    <HiOutlineEye />
                                                </IconButton>
                                                <IconButton
                                                    onClick={() =>
                                                        handleEdit(match)
                                                    }
                                                    title="Edit match"
                                                >
                                                    <HiOutlinePencil />
                                                </IconButton>
                                                <IconButton
                                                    className="delete"
                                                    onClick={() =>
                                                        handleDelete(match.id)
                                                    }
                                                    disabled={isDeletingMatch}
                                                    title="Delete match"
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
                            {matches.map((match) => (
                                <MobileCard key={match.id}>
                                    <MobileCardHeader>
                                        <MobileCardTitle>
                                            Match #{match.nr || match.id}
                                        </MobileCardTitle>
                                        <Actions>
                                            <IconButton
                                                onClick={() =>
                                                    handleView(match)
                                                }
                                            >
                                                <HiOutlineEye />
                                            </IconButton>
                                            <IconButton
                                                onClick={() =>
                                                    handleEdit(match)
                                                }
                                            >
                                                <HiOutlinePencil />
                                            </IconButton>
                                            <IconButton
                                                className="delete"
                                                onClick={() =>
                                                    handleDelete(match.id)
                                                }
                                                disabled={isDeletingMatch}
                                            >
                                                <HiOutlineTrash />
                                            </IconButton>
                                        </Actions>
                                    </MobileCardHeader>
                                    <MobileCardDetail>
                                        <span>{getTeamDisplay(match, 1)}</span>
                                        <ScoreDisplay>
                                            {match.scoreTeam1} :{" "}
                                            {match.scoreTeam2}
                                        </ScoreDisplay>
                                        <span>{getTeamDisplay(match, 2)}</span>
                                    </MobileCardDetail>
                                    <MobileCardDetail>
                                        <span>
                                            {getStatusBadge(match.status)}
                                        </span>
                                        <Badge>{match.gamemode}</Badge>
                                    </MobileCardDetail>
                                    <MobileCardDetail>
                                        <span>
                                            {formatDate(match.created_at)}
                                        </span>
                                    </MobileCardDetail>
                                </MobileCard>
                            ))}
                        </MobileList>
                    </>
                ) : (
                    <NoData>No matches found</NoData>
                )}
            </Section>

            {showModal && (
                <MatchModal
                    match={editingMatch || viewingMatch}
                    isViewMode={!!viewingMatch}
                    onClose={handleCloseModal}
                    players={players}
                    seasons={seasons}
                />
            )}
        </Container>
    );
}

export default MatchesAdminTab;
