import styled from "styled-components";
import { HiArrowsUpDown } from "react-icons/hi2";
import Heading from "../../ui/Heading";
import ContentBox from "../../ui/ContentBox";
import Button from "../../ui/Button";
import { useChoosePlayers } from "../../contexts/ChoosePlayerContext";
import Ruleset from "./Ruleset";
import ClearPlayers from "../../ui/CustomIcons/ClearPlayers";
import { TeamSelector } from "../teams";
import { useMyTeams } from "../teams/useTeams";
import SpinnerMini from "../../ui/SpinnerMini";

const StyledChooseTeamsMobile = styled.div`
    display: flex;
    flex-direction: column;
    padding: 0rem 2.4rem;
    gap: 2.4rem;
`;

const TeamContainer = styled(ContentBox)``;

const SubmitContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;

    & button {
        width: 100%;
    }
`;

const MidButtonsContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2.4rem;
`;

const MidButton = styled(Button)`
    height: fit-content;
    padding: 1.4rem;
    align-self: center;
    margin: -1.2rem 0;

    & svg {
        font-size: 2.6rem;
    }
`;

const TeamSelectorContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.4rem;
    width: 100%;
`;

const SelectedTeamInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    padding: 1.2rem;
    background-color: var(--secondary-background-color);
    border-radius: var(--border-radius-sm);

    & img {
        width: 5rem;
        height: 5rem;
        border-radius: 50%;
        object-fit: cover;
    }
`;

const TeamMmr = styled.span`
    font-size: 1.4rem;
    color: var(--color-grey-400);
`;

const TeamPlayers = styled.span`
    font-size: 1.2rem;
    color: var(--color-grey-500);
`;

const NoTeamsMessage = styled.p`
    color: var(--color-grey-400);
    font-style: italic;
    text-align: center;
    padding: 2rem;
`;

const LoadingContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
`;

function ChooseTeamsMobile() {
    const {
        startCountdown,
        isStarting,
        timer,
        cancelTimer,
        selectedTeam1,
        selectedTeam2,
        selectTeam,
        clearTeams,
    } = useChoosePlayers();

    const { teams, isLoading } = useMyTeams();

    // Filter available teams for each selector (exclude already selected team)
    const availableTeamsForTeam1 = teams?.filter(
        (team) => team.id !== selectedTeam2?.id
    );
    const availableTeamsForTeam2 = teams?.filter(
        (team) => team.id !== selectedTeam1?.id
    );

    function switchTeams() {
        const temp1 = selectedTeam1;
        const temp2 = selectedTeam2;
        selectTeam(temp2, 1);
        selectTeam(temp1, 2);
    }

    if (isLoading) {
        return (
            <StyledChooseTeamsMobile>
                <LoadingContainer>
                    <SpinnerMini />
                </LoadingContainer>
            </StyledChooseTeamsMobile>
        );
    }

    // Check if user has enough teams to play a team match
    const activeTeams = teams?.filter((t) => t.status === "active") || [];
    if (activeTeams.length < 2) {
        return (
            <StyledChooseTeamsMobile>
                <NoTeamsMessage>
                    You need at least 2 active teams to start a Team Match.
                    Create teams in the Teams section first.
                </NoTeamsMessage>
            </StyledChooseTeamsMobile>
        );
    }

    return (
        <>
            <StyledChooseTeamsMobile>
                <TeamContainer>
                    <TeamSelectorContainer>
                        <Heading as="h2">
                            Team 1
                            {selectedTeam1 &&
                                ` (MMR ${Math.round(selectedTeam1.mmr)})`}
                        </Heading>
                        <TeamSelector
                            teams={availableTeamsForTeam1}
                            selectedTeam={selectedTeam1}
                            onSelect={(team) => selectTeam(team, 1)}
                            placeholder="Choose team 1..."
                        />
                        {selectedTeam1 && (
                            <SelectedTeamInfo>
                                {selectedTeam1.logo_url && (
                                    <img
                                        src={selectedTeam1.logo_url}
                                        alt={selectedTeam1.name}
                                    />
                                )}
                                <TeamPlayers>
                                    {selectedTeam1.player1?.name} &{" "}
                                    {selectedTeam1.player2?.name}
                                </TeamPlayers>
                                <TeamMmr>
                                    Record: {selectedTeam1.wins}W -{" "}
                                    {selectedTeam1.losses}L
                                </TeamMmr>
                            </SelectedTeamInfo>
                        )}
                    </TeamSelectorContainer>
                </TeamContainer>

                <MidButtonsContainer>
                    <MidButton
                        onClick={switchTeams}
                        disabled={
                            isStarting || (!selectedTeam1 && !selectedTeam2)
                        }
                        title="Switch Teams"
                    >
                        <HiArrowsUpDown />
                    </MidButton>
                    <MidButton
                        onClick={clearTeams}
                        disabled={isStarting}
                        title="Clear Teams"
                    >
                        <ClearPlayers />
                    </MidButton>
                </MidButtonsContainer>

                <TeamContainer>
                    <TeamSelectorContainer>
                        <Heading as="h2">
                            Team 2
                            {selectedTeam2 &&
                                ` (MMR ${Math.round(selectedTeam2.mmr)})`}
                        </Heading>
                        <TeamSelector
                            teams={availableTeamsForTeam2}
                            selectedTeam={selectedTeam2}
                            onSelect={(team) => selectTeam(team, 2)}
                            placeholder="Choose team 2..."
                        />
                        {selectedTeam2 && (
                            <SelectedTeamInfo>
                                {selectedTeam2.logo_url && (
                                    <img
                                        src={selectedTeam2.logo_url}
                                        alt={selectedTeam2.name}
                                    />
                                )}
                                <TeamPlayers>
                                    {selectedTeam2.player1?.name} &{" "}
                                    {selectedTeam2.player2?.name}
                                </TeamPlayers>
                                <TeamMmr>
                                    Record: {selectedTeam2.wins}W -{" "}
                                    {selectedTeam2.losses}L
                                </TeamMmr>
                            </SelectedTeamInfo>
                        )}
                    </TeamSelectorContainer>
                </TeamContainer>

                <SubmitContainer>
                    {!isStarting && (
                        <Button
                            $size="large"
                            onClick={startCountdown}
                            disabled={!selectedTeam1 || !selectedTeam2}
                        >
                            Start Team Match
                        </Button>
                    )}
                    {isStarting && timer > 0 && (
                        <Button
                            $size="large"
                            $variation="secondary"
                            type="button"
                            onClick={cancelTimer}
                        >
                            Cancel ({timer})
                        </Button>
                    )}
                    {isStarting && timer <= 0 && (
                        <Button $size="large" disabled>
                            Good luck have fun!
                        </Button>
                    )}
                </SubmitContainer>
            </StyledChooseTeamsMobile>
            <Ruleset />
        </>
    );
}

export default ChooseTeamsMobile;
