import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { HiOutlinePlusCircle } from "react-icons/hi2";
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

const Container = styled.div`
    max-width: 120rem;
    margin: 0px auto;
    display: flex;
    flex-direction: column;
    gap: 3.2rem;
`;

const PlayersContainer = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6rem 24rem;
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

const AddPlayerButton = styled.button`
    display: flex;
    justify-content: flex-start;
    align-items: center;
    font-family: "Poppins", sans-serif;
    font-size: 16px;
    padding: 0.8rem 1.2rem;
    width: 180px;
    background-color: var(--color-amber-100);
    border: 1px solid var(--color-grey-100);
    border-radius: var(--border-radius-md);

    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
        background-color: var(--color-amber-200);
    }

    &:active {
        background-color: var(--color-amber-300);
    }
`;

const SubmitRow = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 2.4rem;
    background-color: white;
    border-radius: var(--border-radius-sm);
    box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.4);
`;

const CheckboxContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
`;

const StyledCheckbox = styled.input.attrs({ type: "checkbox" })`
    margin-right: 1rem;
    cursor: pointer;
`;

const StartMatchButton = styled.button`
    padding: 1.4rem 2.8rem;
    background-color: var(--color-amber-200);
    border: none;
    border-radius: var(--border-radius-md);
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.2s;

    &:hover {
        background-color: var(--color-amber-300);
        transform: translateY(-3px);
    }

    &:active {
        transform: translateY(0);
    }
`;

const AddIcon = styled(HiOutlinePlusCircle)`
    font-size: 60px;
`;

const AddLabel = styled.label`
    font-size: 28px;
`;

function ChoosePlayers() {
    const [selectedPlayers, setSelectedPlayers] = useState({
        player1: null,
        player2: null,
        player3: null,
        player4: null,
    });

    const [displayDropdowns, setDisplayDropdowns] = useState({
        player1: true,
        player2: true,
        player3: false,
        player4: false,
    });

    const [isStarting, setIsStarting] = useState(false);
    const [timer, setTimer] = useState(START_MATCH_COUNTDOWN);

    const { players, isLoading, error } = usePlayers();
    const { createMatch } = useCreateMatch();

    const countdownAudio = useMemo(() => new Audio("/startMatchSound.mp3"), []);

    useEffect(() => {
        let timerId;

        if (timer >= 0 && isStarting) {
            if (timer === 3) {
                countdownAudio.play();
            }
            timerId = setTimeout(() => setTimer(timer - 1), 1000);
        } else if (timer === -1) {
            console.log("GAME STARTED!");
            createMatch(selectedPlayers);
        }

        return () => {
            clearTimeout(timerId);
        };
    }, [timer, isStarting, createMatch, selectedPlayers, countdownAudio]);

    function startTimer() {
        setIsStarting(true);
        setTimer(START_MATCH_COUNTDOWN);
    }

    function cancelTimer() {
        setIsStarting(false);
        setTimer(START_MATCH_COUNTDOWN);
        countdownAudio.pause();
        countdownAudio.currentTime = 0;
    }

    if (isLoading) {
        return <Spinner />;
    }

    function handleSelect(key, player) {
        setSelectedPlayers((state) => ({ ...state, [key]: player }));
        if (player === null && (key === "player3" || key === "player4")) {
            setDisplayDropdowns((prev) => ({ ...prev, [key]: false }));
        }
    }

    function toggleDropdownDisplay(key) {
        setDisplayDropdowns((prev) => ({ ...prev, [key]: !prev[key] }));
    }

    function handleSubmit() {
        if (!selectedPlayers.player1 || !selectedPlayers.player2) {
            toast.error("You must select player 1 and player 2");
            return;
        }

        startTimer(selectedPlayers);
    }

    return (
        <Container>
            <Row type="horizontal">
                <Heading as="h1">Team 1</Heading>
                <Heading as="h1">Team 2</Heading>
            </Row>
            <PlayersContainer>
                {Object.keys(selectedPlayers).map((key) => {
                    const options = players.filter(
                        (player) =>
                            !Object.values(selectedPlayers).includes(player) ||
                            selectedPlayers[key] === player
                    );

                    return (
                        <PlayerBox
                            key={key}
                            onClick={
                                !displayDropdowns[key]
                                    ? () => toggleDropdownDisplay(key)
                                    : undefined
                            }
                        >
                            {displayDropdowns[key] ? (
                                <>
                                    {selectedPlayers[key] && (
                                        <Avatar
                                            src={
                                                selectedPlayers[key].avatar ||
                                                DEFAULT_AVATAR
                                            }
                                            alt={`Avatar of ${selectedPlayers[key].name}`}
                                        />
                                    )}
                                    <PlayerDropdown
                                        id={key}
                                        options={options}
                                        selectedPlayer={selectedPlayers[key]}
                                        onSelect={(player) =>
                                            handleSelect(key, player)
                                        }
                                    />
                                </>
                            ) : (
                                <>
                                    <AddIcon style={{ marginRight: "8px" }} />
                                    <AddLabel>Add {key}</AddLabel>
                                </>
                            )}
                        </PlayerBox>
                    );
                })}
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
                        <Button $size="large" onClick={handleSubmit}>
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
