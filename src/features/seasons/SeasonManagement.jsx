import styled from "styled-components";
import { useState } from "react";
import { format } from "date-fns";
import { useSeasons } from "./useSeasons";
import { useCurrentSeason } from "./useCurrentSeason";
import { useCreateSeason } from "./useCreateSeason";
import { useEndSeason } from "./useEndSeason";
import { useKickerInfo } from "../../hooks/useKickerInfo";
import { useUser } from "../authentication/useUser";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import FormRow from "../../ui/FormRow";
import Spinner from "../../ui/Spinner";
import Heading from "../../ui/Heading";
import { media } from "../../utils/constants";
import SectionTitle from "../../ui/SectionTitle";

const StyledSeasonManagement = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2.4rem;

    ${media.tablet} {
        padding: 0 2.4rem;
    }
`;

const SeasonCard = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    padding: 1.6rem;
    background-color: var(--secondary-background-color);
    border-radius: var(--border-radius-md);
    border: 1px solid var(--color-grey-200);
`;

const SeasonHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const SeasonName = styled.span`
    font-weight: 600;
    font-size: 1.6rem;
`;

const SeasonStatus = styled.span`
    padding: 0.4rem 0.8rem;
    border-radius: 1rem;
    font-size: 1.2rem;
    font-weight: 500;

    ${(props) =>
        props.$isActive
            ? `
        background-color: var(--color-green-100);
        color: var(--color-green-700);
    `
            : `
        background-color: var(--color-grey-200);
        color: var(--color-grey-600);
    `}
`;

const SeasonInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    font-size: 1.4rem;
    color: var(--color-grey-500);
`;

const SeasonList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    max-height: 40rem;
    overflow-y: auto;
`;

const CreateSeasonForm = styled.form`
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
    padding: 1.6rem;
    background-color: var(--tertiary-background-color);
    border-radius: var(--border-radius-md);
    border: 1px solid var(--color-grey-200);
`;

const ButtonRow = styled.div`
    display: flex;
    gap: 1.2rem;
    justify-content: flex-end;
`;

const WarningText = styled.p`
    color: var(--color-red-700);
    font-size: 1.3rem;
`;

const InfoText = styled.p`
    color: var(--color-grey-500);
    font-size: 1.4rem;
`;

const Section = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
`;

function SeasonManagement() {
    const { seasons, isLoading: isLoadingSeasons } = useSeasons();
    const { currentSeason, isLoading: isLoadingCurrent } = useCurrentSeason();
    const { createSeason, isCreating } = useCreateSeason();
    const { endSeason, isEnding } = useEndSeason();
    const { data: kickerData, isLoading: isLoadingKicker } = useKickerInfo();
    const { user } = useUser();

    const [newSeasonName, setNewSeasonName] = useState("");
    const [showEndConfirm, setShowEndConfirm] = useState(false);

    const isLoading = isLoadingSeasons || isLoadingCurrent || isLoadingKicker;
    const isAdmin = kickerData?.admin === user?.id;

    if (isLoading) {
        return <Spinner />;
    }

    if (!isAdmin) {
        return (
            <StyledSeasonManagement>
                <InfoText>Only the kicker admin can manage seasons.</InfoText>
                <Section>
                    <SectionTitle>Season History</SectionTitle>
                    <SeasonList>
                        {seasons?.map((season) => (
                            <SeasonCard key={season.id}>
                                <SeasonHeader>
                                    <SeasonName>
                                        {season.name ||
                                            `Season ${season.season_number}`}
                                    </SeasonName>
                                    <SeasonStatus $isActive={season.is_active}>
                                        {season.is_active ? "Active" : "Ended"}
                                    </SeasonStatus>
                                </SeasonHeader>
                                <SeasonInfo>
                                    <span>
                                        Started:{" "}
                                        {format(
                                            new Date(season.start_date),
                                            "MMM dd, yyyy"
                                        )}
                                    </span>
                                    {season.end_date && (
                                        <span>
                                            Ended:{" "}
                                            {format(
                                                new Date(season.end_date),
                                                "MMM dd, yyyy"
                                            )}
                                        </span>
                                    )}
                                </SeasonInfo>
                            </SeasonCard>
                        ))}
                    </SeasonList>
                </Section>
            </StyledSeasonManagement>
        );
    }

    function handleCreateSeason(e) {
        e.preventDefault();
        createSeason(
            { name: newSeasonName || undefined },
            {
                onSuccess: () => {
                    setNewSeasonName("");
                },
            }
        );
    }

    function handleEndSeason() {
        if (!currentSeason) return;
        endSeason(currentSeason.id, {
            onSuccess: () => {
                setShowEndConfirm(false);
            },
        });
    }

    return (
        <StyledSeasonManagement>
            {/* Current Season Section */}
            <Section>
                <SectionTitle>Current Season</SectionTitle>
                {currentSeason ? (
                    <SeasonCard>
                        <SeasonHeader>
                            <SeasonName>
                                {currentSeason.name ||
                                    `Season ${currentSeason.season_number}`}
                            </SeasonName>
                            <SeasonStatus $isActive={true}>Active</SeasonStatus>
                        </SeasonHeader>
                        <SeasonInfo>
                            <span>
                                Started:{" "}
                                {format(
                                    new Date(currentSeason.start_date),
                                    "MMM dd, yyyy HH:mm"
                                )}
                            </span>
                        </SeasonInfo>
                        {!showEndConfirm ? (
                            <ButtonRow>
                                <Button
                                    $variation="danger"
                                    onClick={() => setShowEndConfirm(true)}
                                    disabled={isEnding}
                                >
                                    End Season
                                </Button>
                            </ButtonRow>
                        ) : (
                            <>
                                <WarningText>
                                    Are you sure you want to end this season?
                                    This action cannot be undone. All rankings
                                    will be frozen and a new season must be
                                    created to continue tracking.
                                </WarningText>
                                <ButtonRow>
                                    <Button
                                        $variation="secondary"
                                        onClick={() => setShowEndConfirm(false)}
                                        disabled={isEnding}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        $variation="danger"
                                        onClick={handleEndSeason}
                                        disabled={isEnding}
                                    >
                                        {isEnding
                                            ? "Ending..."
                                            : "Confirm End Season"}
                                    </Button>
                                </ButtonRow>
                            </>
                        )}
                    </SeasonCard>
                ) : (
                    <>
                        <InfoText>
                            No active season. Matches played now will be
                            off-season and won&apos;t affect seasonal rankings.
                        </InfoText>
                        <CreateSeasonForm onSubmit={handleCreateSeason}>
                            <FormRow label="New Season Name (optional)">
                                <Input
                                    type="text"
                                    placeholder="e.g., Winter 2025"
                                    value={newSeasonName}
                                    onChange={(e) =>
                                        setNewSeasonName(e.target.value)
                                    }
                                    disabled={isCreating}
                                />
                            </FormRow>
                            <ButtonRow>
                                <Button
                                    $variation="primary"
                                    type="submit"
                                    disabled={isCreating}
                                >
                                    {isCreating
                                        ? "Creating..."
                                        : "Start New Season"}
                                </Button>
                            </ButtonRow>
                        </CreateSeasonForm>
                    </>
                )}
            </Section>

            {/* Season History Section */}
            <Section>
                <SectionTitle>Season History</SectionTitle>
                <SeasonList>
                    {seasons?.map((season) => (
                        <SeasonCard key={season.id}>
                            <SeasonHeader>
                                <SeasonName>
                                    {season.name ||
                                        `Season ${season.season_number}`}
                                </SeasonName>
                                <SeasonStatus $isActive={season.is_active}>
                                    {season.is_active ? "Active" : "Ended"}
                                </SeasonStatus>
                            </SeasonHeader>
                            <SeasonInfo>
                                <span>
                                    Started:{" "}
                                    {format(
                                        new Date(season.start_date),
                                        "MMM dd, yyyy"
                                    )}
                                </span>
                                {season.end_date && (
                                    <span>
                                        Ended:{" "}
                                        {format(
                                            new Date(season.end_date),
                                            "MMM dd, yyyy"
                                        )}
                                    </span>
                                )}
                            </SeasonInfo>
                        </SeasonCard>
                    ))}
                    {(!seasons || seasons.length === 0) && (
                        <InfoText>No seasons yet.</InfoText>
                    )}
                </SeasonList>
            </Section>
        </StyledSeasonManagement>
    );
}

export default SeasonManagement;
