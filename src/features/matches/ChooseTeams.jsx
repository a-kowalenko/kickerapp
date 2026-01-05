import styled from "styled-components";
import { HiArrowsRightLeft } from "react-icons/hi2";
import Button from "../../ui/Button";
import FormRow from "../../ui/FormRow";
import Heading from "../../ui/Heading";
import Row from "../../ui/Row";
import ContentBox from "../../ui/ContentBox";
import { useChoosePlayers } from "../../contexts/ChoosePlayerContext";
import Ruleset from "./Ruleset";
import ClearPlayers from "../../ui/CustomIcons/ClearPlayers";
import { TeamSelector } from "../teams";
import { useMyTeams } from "../teams/useTeams";
import SpinnerMini from "../../ui/SpinnerMini";

const Container = styled.div`
    max-width: 120rem;
    margin: 0px auto;
    display: flex;
    flex-direction: column;
    gap: 3.2rem;
`;

const TeamsContainer = styled.div`
    margin-top: -3rem;
    display: flex;
    gap: 2.2rem;
    justify-items: space-evenly;
`;

const SubmitRow = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 2.4rem;
    background-color: var(--tertiary-background-color);
    border-radius: var(--border-radius-sm);
    box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.4);
`;

const TeamContainer = styled(ContentBox)`
    min-height: 20rem;
    justify-content: flex-start;
    gap: 1.6rem;
`;

const TeamSelectorContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.4rem;
    width: 100%;
`;

const MidButtonsContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2.4rem;
`;

const MidButton = styled(Button)`
    height: fit-content;
    padding: 1.4rem;
    align-self: center;

    & svg {
        font-size: 2.6rem;
    }
`;

const SelectedTeamInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    padding: 1.2rem;
    background-color: var(--secondary-background-color);
    border-radius: var(--border-radius-sm);

    & img {
        width: 6rem;
        height: 6rem;
        border-radius: 50%;
        object-fit: cover;
        margin-bottom: 0.8rem;
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

function ChooseTeams() {
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
            <Container>
                <SpinnerMini />
            </Container>
        );
    }

    // Check if user has enough teams to play a team match
    const activeTeams = teams?.filter((t) => t.status === "active") || [];
    if (activeTeams.length < 2) {
        return (
            <Container>
                <NoTeamsMessage>
                    You need at least 2 active teams to start a Team Match.
                    Create teams in the Teams section first.
                </NoTeamsMessage>
            </Container>
        );
    }

    return (
        <Container>
            <Row type="horizontal">
                <Heading as="h1">
                    Team 1
                    {selectedTeam1 && ` (MMR ${Math.round(selectedTeam1.mmr)})`}
                </Heading>
                <Heading as="h1">
                    Team 2
                    {selectedTeam2 && ` (MMR ${Math.round(selectedTeam2.mmr)})`}
                </Heading>
            </Row>
            <TeamsContainer>
                <TeamContainer>
                    <TeamSelectorContainer>
                        <Heading as="h3">Select Team 1</Heading>
                        <TeamSelector
                            teams={availableTeamsForTeam1}
                            selectedTeam={selectedTeam1}
                            onSelect={(team) => selectTeam(team, 1)}
                            placeholder="Choose a team..."
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
                        <HiArrowsRightLeft />
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
                        <Heading as="h3">Select Team 2</Heading>
                        <TeamSelector
                            teams={availableTeamsForTeam2}
                            selectedTeam={selectedTeam2}
                            onSelect={(team) => selectTeam(team, 2)}
                            placeholder="Choose a team..."
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
            </TeamsContainer>
            <SubmitRow>
                <div />
                {!isStarting && (
                    <FormRow>
                        <Button
                            $size="large"
                            onClick={startCountdown}
                            disabled={!selectedTeam1 || !selectedTeam2}
                        >
                            Start Team Match
                        </Button>
                    </FormRow>
                )}
                {isStarting && (
                    <FormRow
                        label={
                            timer <= 0
                                ? "Good luck have fun!"
                                : `Starting in ${timer}`
                        }
                    >
                        {timer > 0 && (
                            <Button
                                $size="large"
                                $variation="secondary"
                                type="button"
                                onClick={cancelTimer}
                            >
                                Cancel match
                            </Button>
                        )}
                    </FormRow>
                )}
            </SubmitRow>
            <Ruleset />
        </Container>
    );
}

export default ChooseTeams;
