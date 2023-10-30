import { useState } from "react";
import styled from "styled-components";
import { HiOutlinePlus, HiOutlinePlusCircle } from "react-icons/hi2";
import { usePlayers } from "../../hooks/usePlayers";
import { useCreateMatch } from "./useCreateMatch";
import PlayerDropdown from "./PlayerDropdown";
import Avatar from "../../ui/Avatar";
import toast from "react-hot-toast";
import Spinner from "../../ui/Spinner";
import Button from "../../ui/Button";
import SwitchButton from "../../ui/SwitchButton";

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
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    gap: 1.8rem;
    min-width: 400px;
    min-height: 170px;

    &:hover {
        background-color: var(--color-grey-300);
        transform: scale(1.05);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
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
    border-top: 1px solid var(--color-grey-200);
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
    transition:
        background-color 0.2s,
        transform 0.2s;

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

    const { players, isLoading, error } = usePlayers();
    const { createMatch } = useCreateMatch();

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

        createMatch(selectedPlayers);
    }

    return (
        <Container>
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
                                                "/default-user.jpg"
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
                <Button $size="large" onClick={handleSubmit}>
                    Start match
                </Button>
            </SubmitRow>
        </Container>
    );
}

export default ChoosePlayers;
