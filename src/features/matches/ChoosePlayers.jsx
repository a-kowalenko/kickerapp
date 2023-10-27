import { useState } from "react";
import styled from "styled-components";
import PlayerDropdown from "./PlayerDropdown";
import { HiOutlinePlus } from "react-icons/hi2";

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
    padding: 4.8rem 6.4rem;

    background-color: var(--color-grey-0);
    border: 1px solid var(--color-grey-100);
    border-radius: var(--border-radius-md);
`;

const AddPlayerButton = styled.button`
    display: flex;
    justify-content: flex-start;
    align-items: center;
    font-family: "Poppins", sans-serif;
    font-size: 16px;
    padding: 0.8rem 1.2rem;
    width: 180px;
    background-color: var(--color-grey-0);
    border: 1px solid var(--color-grey-100);
    border-radius: var(--border-radius-md);

    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
        background-color: var(--color-grey-200);
    }
`;

const SubmitRow = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 2.4rem;

    background-color: white;
`;

const fakePlayers = [
    { id: 1, name: "Andy" },
    { id: 2, name: "Frank" },
    { id: 3, name: "Maxim" },
    { id: 4, name: "Sergej" },
];

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

    function handleSelect(key, player) {
        setSelectedPlayers((state) => ({ ...state, [key]: player }));
        if (player === null && (key === "player3" || key === "player4")) {
            setDisplayDropdowns((prev) => ({ ...prev, [key]: false }));
        }
    }

    function toggleDropdownDisplay(key) {
        setDisplayDropdowns((prev) => ({ ...prev, [key]: !prev[key] }));
    }

    return (
        <Container>
            <PlayersContainer>
                {Object.keys(selectedPlayers).map((key) => {
                    const options = fakePlayers.filter(
                        (player) =>
                            !Object.values(selectedPlayers).includes(player) ||
                            selectedPlayers[key] === player
                    );

                    return (
                        <PlayerBox key={key}>
                            {displayDropdowns[key] ? (
                                <PlayerDropdown
                                    id={key}
                                    options={options}
                                    selectedPlayer={selectedPlayers[key]}
                                    onSelect={(player) =>
                                        handleSelect(key, player)
                                    }
                                />
                            ) : (
                                <AddPlayerButton
                                    onClick={() => toggleDropdownDisplay(key)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    <HiOutlinePlus
                                        style={{ marginRight: "8px" }}
                                    />
                                    Add {key}
                                </AddPlayerButton>
                            )}
                        </PlayerBox>
                    );
                })}
            </PlayersContainer>
            <SubmitRow>
                <div>
                    <input type="checkbox" />
                    <input type="checkbox" />
                </div>
                <button>Start match</button>
            </SubmitRow>
        </Container>
    );
}

export default ChoosePlayers;
