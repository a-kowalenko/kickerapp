import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { HiOutlinePlusCircle, HiPlus } from "react-icons/hi2";
import { usePlayers } from "../../hooks/usePlayers";
import { useCreateMatch } from "./useCreateMatch";
import PlayerDropdown from "./PlayerDropdown";
import Avatar from "../../ui/Avatar";
import toast from "react-hot-toast";
import Spinner from "../../ui/Spinner";
import Button from "../../ui/Button";
import SwitchButton from "../../ui/SwitchButton";
import FormRow from "../../ui/FormRow";
import { DEFAULT_AVATAR, START_MATCH_COUNTDOWN } from "../../utils/constants";
import Heading from "../../ui/Heading";
import Row from "../../ui/Row";
import { useSound } from "../../contexts/SoundContext";
import Dropdown from "../../ui/Dropdown";
import ContentBox from "../../ui/ContentBox";
import { useChoosePlayers } from "../../contexts/ChoosePlayerContext";

const Container = styled.div`
    max-width: 120rem;
    margin: 0px auto;
    display: flex;
    flex-direction: column;
    gap: 3.2rem;
`;

const PlayersContainer = styled.div`
    display: flex;
    gap: 5.4rem;
    justify-items: space-evenly;
`;

const PlayerBox = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 3.2rem 4.5rem;
    background-color: var(--color-grey-100);
    border: 1px solid var(--color-grey-200);
    border-radius: 10px;
    box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.4);
    transition: all 0.3s ease;
    gap: 1.8rem;
    min-width: 400px;
    min-height: 170px;

    &:hover {
        background-color: var(--color-grey-300);
        transform: scale(1.05);
        box-shadow: 2px 2px 2px 2px rgba(0, 0, 0, 0.4);
    }
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

const AddIcon = styled(HiOutlinePlusCircle)`
    font-size: 60px;
`;

const AddLabel = styled.label`
    font-size: 28px;
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
    } = useChoosePlayers();

    if (isLoading) {
        return <Spinner />;
    }

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
                            options={filteredPlayers}
                            onSelect={(playerId) => handleSelect(playerId, 0)}
                        />
                    </PlayerContainer>
                    {isPlayer3Active ? (
                        <PlayerContainer>
                            <Heading as="h3">Player 3</Heading>
                            <Dropdown
                                options={filteredForPlayer3And4}
                                onSelect={(playerId) =>
                                    handleSelect(playerId, 2)
                                }
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

                <TeamContainer>
                    <PlayerContainer>
                        <Heading as="h3">Player 2</Heading>
                        <Dropdown
                            options={filteredPlayers}
                            onSelect={(playerId) => handleSelect(playerId, 1)}
                        />
                    </PlayerContainer>
                    {isPlayer4Active ? (
                        <PlayerContainer>
                            <Heading as="h3">Player 4</Heading>
                            <Dropdown
                                options={filteredForPlayer3And4}
                                onSelect={(playerId) =>
                                    handleSelect(playerId, 3)
                                }
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
        </Container>
    );
}

export default ChoosePlayers;
