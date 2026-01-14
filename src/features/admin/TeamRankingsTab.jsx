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
import { useTeams } from "../teams/useTeams";
import { useSeasons } from "../seasons/useSeasons";
import {
    useAdminTeamRankings,
    useDeleteAdminTeamRanking,
} from "./useRankingsAdmin";
import TeamRankingsModal from "./TeamRankingsModal";
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

const TeamLink = styled(Link)`
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

function TeamRankingsTab() {
    const { teams, isLoading: isLoadingTeams } = useTeams();
    const { seasons, isLoading: isLoadingSeasons } = useSeasons();
    const [filterTeam, setFilterTeam] = useState("");
    const [filterSeason, setFilterSeason] = useState("");

    const { teamRankings, isLoading: isLoadingRankings } = useAdminTeamRankings(
        {
            teamId: filterTeam || undefined,
            seasonId: filterSeason || undefined,
        }
    );

    const { deleteTeamRanking, isLoading: isDeleting } =
        useDeleteAdminTeamRanking();

    const [showModal, setShowModal] = useState(false);
    const [editingRanking, setEditingRanking] = useState(null);

    const isLoading = isLoadingTeams || isLoadingSeasons || isLoadingRankings;

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
            deleteTeamRanking(id);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingRanking(null);
    };

    // Filter active teams for display
    const activeTeams = teams?.filter((t) => t.status === "active") || [];

    return (
        <Container>
            <FilterRow>
                <FilterGroup>
                    <FilterLabel>Team</FilterLabel>
                    <Select
                        value={filterTeam}
                        onChange={(e) => setFilterTeam(e.target.value)}
                    >
                        <option value="">All Teams</option>
                        {activeTeams.map((team) => (
                            <option key={team.id} value={team.id}>
                                {team.name}
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
                    <SectionTitle>Team Season Rankings</SectionTitle>
                    <div
                        style={{
                            display: "flex",
                            gap: "1rem",
                            alignItems: "center",
                        }}
                    >
                        <ResultCount>
                            {teamRankings?.length || 0} entries
                        </ResultCount>
                        <Button $size="small" onClick={handleCreate}>
                            <HiOutlinePlus /> Add Ranking
                        </Button>
                    </div>
                </SectionHeader>

                {teamRankings && teamRankings.length > 0 ? (
                    <>
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Team</Th>
                                    <Th>Season</Th>
                                    <Th>Wins</Th>
                                    <Th>Losses</Th>
                                    <Th>MMR</Th>
                                    <Th>Bounty Claimed</Th>
                                    <Th>Actions</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {teamRankings.map((ranking) => (
                                    <tr key={ranking.id}>
                                        <Td>
                                            <TeamLink
                                                to={`/teams/${ranking.team?.id}`}
                                            >
                                                {ranking.team?.name ||
                                                    "Unknown"}
                                            </TeamLink>
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
                                        <Td>{ranking.wins}</Td>
                                        <Td>{ranking.losses}</Td>
                                        <Td>
                                            <Badge $variant="info">
                                                {ranking.mmr}
                                            </Badge>
                                        </Td>
                                        <Td>{ranking.bounty_claimed || 0}</Td>
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
                            {teamRankings.map((ranking) => (
                                <MobileCard key={ranking.id}>
                                    <MobileCardHeader>
                                        <MobileCardTitle>
                                            {ranking.team?.name || "Unknown"}
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
                                        <span>Record</span>
                                        <span>
                                            {ranking.wins}W / {ranking.losses}L
                                        </span>
                                    </MobileCardDetail>
                                    <MobileCardDetail>
                                        <span>MMR</span>
                                        <Badge $variant="info">
                                            {ranking.mmr}
                                        </Badge>
                                    </MobileCardDetail>
                                    <MobileCardDetail>
                                        <span>Bounty</span>
                                        <span>
                                            {ranking.bounty_claimed || 0}
                                        </span>
                                    </MobileCardDetail>
                                </MobileCard>
                            ))}
                        </MobileList>
                    </>
                ) : (
                    <NoData>No team rankings found</NoData>
                )}
            </Section>

            {showModal && (
                <TeamRankingsModal
                    ranking={editingRanking}
                    onClose={handleCloseModal}
                    teams={activeTeams}
                    seasons={seasons}
                />
            )}
        </Container>
    );
}

export default TeamRankingsTab;
