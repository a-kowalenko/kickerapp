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
import { useActiveTeams } from "../teams/useTeams";
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
    align-items: center;
    gap: 1.6rem;
    padding: 1.6rem;
    background: linear-gradient(
        135deg,
        var(--secondary-background-color) 0%,
        var(--tertiary-background-color) 100%
    );
    border-radius: var(--border-radius-md);
    border: 1px solid var(--color-grey-200);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const TeamLogo = styled.img`
    width: 6rem;
    height: 6rem;
    border-radius: var(--border-radius-md);
    object-fit: cover;
    border: 2px solid var(--color-brand-200);
    flex-shrink: 0;
`;

const DefaultLogo = styled.div`
    width: 6rem;
    height: 6rem;
    border-radius: var(--border-radius-md);
    background: linear-gradient(
        135deg,
        var(--color-brand-100) 0%,
        var(--color-brand-200) 100%
    );
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-brand-600);
    border: 2px solid var(--color-brand-200);
    flex-shrink: 0;
`;

const TeamInfoContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    flex: 1;
    min-width: 0;
`;

const TeamInfoName = styled.span`
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--primary-text-color);
`;

const TeamPlayers = styled.span`
    font-size: 1.3rem;
    color: var(--color-grey-500);
`;

const TeamStatsContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.4rem;
    flex-shrink: 0;
`;

const TeamMmr = styled.span`
    font-family: "Sono";
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--color-brand-600);
`;

const TeamStats = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
`;

const StatBadge = styled.span`
    font-size: 1.2rem;
    font-weight: 500;
    padding: 0.3rem 0.8rem;
    border-radius: var(--border-radius-sm);
    background-color: ${(props) =>
        props.$type === "wins"
            ? "var(--color-green-100)"
            : props.$type === "losses"
            ? "var(--color-red-100)"
            : "var(--color-grey-100)"};
    color: ${(props) =>
        props.$type === "wins"
            ? "var(--color-green-700)"
            : props.$type === "losses"
            ? "var(--color-red-700)"
            : "var(--color-grey-600)"};
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

    const { teams, isLoading } = useActiveTeams();

    // Helper to get player IDs from a team (handle both flat and nested formats)
    const getPlayerIds = (team) => {
        if (!team) return [];
        return [team.player1_id, team.player2_id].filter(Boolean);
    };

    // Helper to check if two teams share any players
    const teamsSharePlayers = (team1, team2) => {
        if (!team1 || !team2) return false;
        const team1Players = getPlayerIds(team1);
        const team2Players = getPlayerIds(team2);
        return team1Players.some((id) => team2Players.includes(id));
    };

    // Helper to get player names (handle both flat and nested formats)
    const getPlayer1Name = (team) => team?.player1_name || team?.player1?.name;
    const getPlayer2Name = (team) => team?.player2_name || team?.player2?.name;

    // Filter available teams for each selector:
    // - Exclude already selected team
    // - Exclude teams that share players with the selected team (can't play against yourself)
    const availableTeamsForTeam1 = teams?.filter(
        (team) =>
            team.id !== selectedTeam2?.id &&
            !teamsSharePlayers(team, selectedTeam2)
    );
    const availableTeamsForTeam2 = teams?.filter(
        (team) =>
            team.id !== selectedTeam1?.id &&
            !teamsSharePlayers(team, selectedTeam1)
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

    // Check if there are enough teams to play a team match
    if (teams.length < 2) {
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
                                {selectedTeam1.logo_url ? (
                                    <TeamLogo
                                        src={selectedTeam1.logo_url}
                                        alt={selectedTeam1.name}
                                    />
                                ) : (
                                    <DefaultLogo>
                                        {selectedTeam1.name
                                            ?.slice(0, 2)
                                            .toUpperCase()}
                                    </DefaultLogo>
                                )}
                                <TeamInfoContent>
                                    <TeamInfoName>
                                        {selectedTeam1.name}
                                    </TeamInfoName>
                                    <TeamPlayers>
                                        {getPlayer1Name(selectedTeam1)} &{" "}
                                        {getPlayer2Name(selectedTeam1)}
                                    </TeamPlayers>
                                </TeamInfoContent>
                                <TeamStatsContainer>
                                    <TeamMmr>{selectedTeam1.mmr} MMR</TeamMmr>
                                    <TeamStats>
                                        <StatBadge $type="wins">
                                            {selectedTeam1.wins}W
                                        </StatBadge>
                                        <StatBadge $type="losses">
                                            {selectedTeam1.losses}L
                                        </StatBadge>
                                    </TeamStats>
                                </TeamStatsContainer>
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
                                {selectedTeam2.logo_url ? (
                                    <TeamLogo
                                        src={selectedTeam2.logo_url}
                                        alt={selectedTeam2.name}
                                    />
                                ) : (
                                    <DefaultLogo>
                                        {selectedTeam2.name
                                            ?.slice(0, 2)
                                            .toUpperCase()}
                                    </DefaultLogo>
                                )}
                                <TeamInfoContent>
                                    <TeamInfoName>
                                        {selectedTeam2.name}
                                    </TeamInfoName>
                                    <TeamPlayers>
                                        {getPlayer1Name(selectedTeam2)} &{" "}
                                        {getPlayer2Name(selectedTeam2)}
                                    </TeamPlayers>
                                </TeamInfoContent>
                                <TeamStatsContainer>
                                    <TeamMmr>{selectedTeam2.mmr} MMR</TeamMmr>
                                    <TeamStats>
                                        <StatBadge $type="wins">
                                            {selectedTeam2.wins}W
                                        </StatBadge>
                                        <StatBadge $type="losses">
                                            {selectedTeam2.losses}L
                                        </StatBadge>
                                    </TeamStats>
                                </TeamStatsContainer>
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
