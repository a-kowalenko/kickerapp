import { createContext, useContext, useEffect, useReducer } from "react";
import { START_MATCH_COUNTDOWN } from "../utils/constants";
import { useCreateMatch } from "../features/matches/useCreateMatch";
import { usePlayers } from "../hooks/usePlayers";
import toast from "react-hot-toast";
import { useAudio } from "../hooks/useAudio";

const ChoosePlayerContext = createContext();

const initialState = {
    selectedPlayers: [null, null, null, null],
    filteredPlayers: [],
    filteredForPlayer3And4: [],
    isPlayer3Active: false,
    isPlayer4Active: false,
    isLoading: false,
    isStarting: false,
    timer: START_MATCH_COUNTDOWN,
};

function reducer(state, action) {
    switch (action.type) {
        case "loading_players":
            return {
                ...state,
                isLoading: true,
                filteredPlayers: [],
                filteredForPlayer3And4: [],
            };
        case "players_loaded":
            return {
                ...state,
                isLoading: false,
                filteredPlayers: action.payload.filteredPlayers,
                filteredForPlayer3And4: action.payload.filteredForPlayer3And4,
            };
        case "timer_started":
            return {
                ...state,
                isStarting: true,
                timer: START_MATCH_COUNTDOWN,
            };
        case "timer_canceled":
            return {
                ...state,
                isStarting: false,
                timer: START_MATCH_COUNTDOWN,
            };
        case "update_timer":
            return {
                ...state,
                timer: action.payload,
            };
        case "player_selected": {
            const newSelectedPlayers = state.selectedPlayers.map(
                (selected, i) =>
                    action.payload.index === i
                        ? action.payload.player
                        : selected
            );

            let newState = {
                ...state,
                selectedPlayers: newSelectedPlayers,
            };

            if (action.payload.player === null) {
                newState = {
                    ...newState,
                    [`isPlayer${action.payload.index + 1}Active`]: false,
                };
            }
            return newState;
        }
        case "player_activated":
            return {
                ...state,
                [`isPlayer${action.payload}Active`]: true,
            };
        case "team_switch": {
            const player3Active = state.isPlayer3Active;
            const player4Active = state.isPlayer4Active;
            const [player1, player2, player3, player4] = state.selectedPlayers;
            const newPlayers = [player2, player1, player4, player3];
            return {
                ...state,
                isPlayer3Active: player4Active,
                isPlayer4Active: player3Active,
                selectedPlayers: newPlayers,
            };
        }
    }
}

function ChoosePlayerProvider({ children }) {
    const [
        {
            selectedPlayers,
            isPlayer3Active,
            isPlayer4Active,
            isLoading,
            timer,
            isStarting,
            filteredPlayers,
            filteredForPlayer3And4,
        },
        dispatch,
    ] = useReducer(reducer, initialState);

    const countdownAudio = useAudio("/startMatchSound.mp3");
    const { createMatch } = useCreateMatch();
    const { players, isLoading: isLoadingPlayers } = usePlayers();

    useEffect(
        function () {
            if (isLoadingPlayers) {
                dispatch({ type: "loading_players" });
            } else {
                const filteredPlayers = players
                    .filter((player) => !selectedPlayers.includes(player))
                    .map((player) => ({ text: player.name, value: player.id }));

                const filteredForPlayer3And4 = [...filteredPlayers];
                filteredForPlayer3And4.unshift({
                    text: "No player",
                    value: null,
                });
                dispatch({
                    type: "players_loaded",
                    payload: { filteredPlayers, filteredForPlayer3And4 },
                });
            }
        },
        [isLoadingPlayers, players, selectedPlayers]
    );

    useEffect(() => {
        let timerId;

        if (timer >= 0 && isStarting) {
            if (timer === 3) {
                countdownAudio.play();
            }
            timerId = setTimeout(
                () => dispatch({ type: "update_timer", payload: timer - 1 }),
                1000
            );
        } else if (timer === -1) {
            const finalPlayers = {
                player1: selectedPlayers[0],
                player2: selectedPlayers[1],
                player3: selectedPlayers[2],
                player4: selectedPlayers[3],
            };
            createMatch(finalPlayers);
        }

        return () => {
            clearTimeout(timerId);
        };
    }, [
        timer,
        isStarting,
        createMatch,
        selectedPlayers,
        countdownAudio,
        players,
    ]);

    function startTimer() {
        dispatch({ type: "timer_started" });
    }

    function cancelTimer() {
        dispatch({ type: "timer_canceled" });
        countdownAudio.pause();
        countdownAudio.currentTime = 0;
    }

    function handleSelect(playerId, index) {
        dispatch({
            type: "player_selected",
            payload: { player: getPlayerById(playerId), index },
        });
    }

    function getPlayerById(id) {
        return players.find((player) => player.id === id);
    }

    function activatePlayer(playerNumber) {
        dispatch({ type: "player_activated", payload: playerNumber });
    }

    function startCountdown() {
        if (!selectedPlayers[0] || !selectedPlayers[1]) {
            toast.error("You must select player 1 and player 2");
            return;
        }

        startTimer();
    }

    function switchTeams() {
        dispatch({ type: "team_switch" });
    }

    return (
        <ChoosePlayerContext.Provider
            value={{
                isLoading,
                startCountdown,
                cancelTimer,
                timer,
                isStarting,
                handleSelect,
                activatePlayer,
                isPlayer3Active,
                isPlayer4Active,
                filteredPlayers,
                filteredForPlayer3And4,
                switchTeams,
                selectedPlayers,
            }}
        >
            {children}
        </ChoosePlayerContext.Provider>
    );
}

function useChoosePlayers() {
    const context = useContext(ChoosePlayerContext);
    if (!context) {
        throw new Error(
            "ChoosePlayerContext cannot be used outside the ChoosePlayerProvider."
        );
    }

    return context;
}

export { ChoosePlayerProvider, useChoosePlayers };
