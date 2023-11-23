import styled from "styled-components";
import { HiArrowsRightLeft, HiPlus } from "react-icons/hi2";
import Button from "../../ui/Button";
import SwitchButton from "../../ui/SwitchButton";
import FormRow from "../../ui/FormRow";
import Heading from "../../ui/Heading";
import Row from "../../ui/Row";
import Dropdown from "../../ui/Dropdown";
import ContentBox from "../../ui/ContentBox";
import { useChoosePlayers } from "../../contexts/ChoosePlayerContext";
import Ruleset from "./Ruleset";

const Container = styled.div`
    max-width: 120rem;
    margin: 0px auto;
    display: flex;
    flex-direction: column;
    gap: 3.2rem;
`;

const PlayersContainer = styled.div`
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

const CheckboxContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
`;

const TeamContainer = styled(ContentBox)`
    min-height: 30rem;
    justify-content: space-between;
`;

const PlayerContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.4rem;
`;

const AddButtonContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: flex-end;

    & button {
        width: 100%;
    }
`;

const SwitchTeamsButton = styled(Button)`
    height: fit-content;
    padding: 1.4rem;
    align-self: center;

    & svg {
        font-size: 2.6rem;
    }
`;

function ChoosePlayers() {
    const {
        isLoading,
        startCountdown,
        isStarting,
        timer,
        cancelTimer,
        handleSelect,
        activatePlayer,
        isPlayer3Active,
        isPlayer4Active,
        filteredPlayers,
        filteredForPlayer3And4,
        switchTeams,
        selectedPlayers: [player1, player2, player3, player4],
    } = useChoosePlayers();

    return (
        <Container>
            <Row type="horizontal">
                <Heading as="h1">Team 1</Heading>
                <Heading as="h1">Team 2</Heading>
            </Row>
            <PlayersContainer>
                <TeamContainer>
                    <PlayerContainer>
                        <Heading as="h3">Player 1</Heading>
                        <Dropdown
                            initSelected={{
                                text: player1?.name,
                                value: player1?.id,
                            }}
                            options={filteredPlayers}
                            onSelect={(playerId) => handleSelect(playerId, 0)}
                            isLoading={isLoading}
                        />
                    </PlayerContainer>
                    {isPlayer3Active ? (
                        <PlayerContainer>
                            <Heading as="h3">Player 3</Heading>
                            <Dropdown
                                initSelected={{
                                    text: player3?.name,
                                    value: player3?.id,
                                }}
                                options={filteredForPlayer3And4}
                                onSelect={(playerId) =>
                                    handleSelect(playerId, 2)
                                }
                                isLoading={isLoading}
                            />
                        </PlayerContainer>
                    ) : (
                        <AddButtonContainer>
                            <Button onClick={() => activatePlayer(3)}>
                                <HiPlus />
                                <span>Add Player 3</span>
                            </Button>
                        </AddButtonContainer>
                    )}
                </TeamContainer>

                <SwitchTeamsButton onClick={switchTeams}>
                    <HiArrowsRightLeft />
                </SwitchTeamsButton>

                <TeamContainer>
                    <PlayerContainer>
                        <Heading as="h3">Player 2</Heading>
                        <Dropdown
                            initSelected={{
                                text: player2?.name,
                                value: player2?.id,
                            }}
                            options={filteredPlayers}
                            onSelect={(playerId) => handleSelect(playerId, 1)}
                            isLoading={isLoading}
                        />
                    </PlayerContainer>
                    {isPlayer4Active ? (
                        <PlayerContainer>
                            <Heading as="h3">Player 4</Heading>
                            <Dropdown
                                initSelected={{
                                    text: player4?.name,
                                    value: player4?.id,
                                }}
                                options={filteredForPlayer3And4}
                                onSelect={(playerId) =>
                                    handleSelect(playerId, 3)
                                }
                                isLoading={isLoading}
                            />
                        </PlayerContainer>
                    ) : (
                        <AddButtonContainer>
                            <Button onClick={() => activatePlayer(4)}>
                                <HiPlus />
                                <span>Add Player 4</span>
                            </Button>
                        </AddButtonContainer>
                    )}
                </TeamContainer>
            </PlayersContainer>
            <SubmitRow>
                <CheckboxContainer>
                    <div>
                        <SwitchButton
                            label="Random teams (noch nicht implementiert)"
                            id="random-teams"
                            type="checkbox"
                            disabled={true}
                        />
                    </div>
                    <div>
                        <SwitchButton
                            label="Random sides (noch nicht implementiert)"
                            id="random-sides"
                            type="checkbox"
                            disabled={true}
                        />
                    </div>
                </CheckboxContainer>
                {!isStarting && (
                    <FormRow>
                        <Button $size="large" onClick={startCountdown}>
                            Start match
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

export default ChoosePlayers;
