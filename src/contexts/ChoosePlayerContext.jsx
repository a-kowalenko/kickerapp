import { createContext, useContext, useEffect, useReducer } from "react";
import { START_MATCH_COUNTDOWN } from "../utils/constants";
import { useCreateMatch } from "../features/matches/useCreateMatch";
import { usePlayers } from "../hooks/usePlayers";
import toast from "react-hot-toast";
import { useAudio } from "../hooks/useAudio";
import { useSearchParams } from "react-router-dom";

const ChoosePlayerContext = createContext();

const initialState = {
    players: [],
    selectedPlayers: [null, null, null, null],
    filteredPlayers: [],
    filteredForPlayer3And4: [],
    isPlayer3Active: false,
    isPlayer4Active: false,
    isLoading: false,
    isStarting: false,
    timer: START_MATCH_COUNTDOWN,
    originalPlayersBeforeBalance: null,
};

function reducer(state, action) {
    switch (action.type) {
        case "loading_players":
            return {
                ...state,
                players: [],
                isLoading: true,
                filteredPlayers: [],
                filteredForPlayer3And4: [],
            };
        case "players_loaded":
            return {
                ...state,
                isLoading: false,
                players: action.payload.players,
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
                    action.payload.playerNumber === i + 1
                        ? action.payload.player
                        : selected
            );

            const isSelected = !!action.payload.player;

            let newState = {
                ...state,
                selectedPlayers: newSelectedPlayers,
                isPlayer3Active:
                    action.payload.playerNumber === 3
                        ? isSelected
                        : state.isPlayer3Active,
                isPlayer4Active:
                    action.payload.playerNumber === 4
                        ? isSelected
                        : state.isPlayer4Active,
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
        case "clear_selected":
            return {
                ...state,
                selectedPlayers: [null, null, null, null],
                isPlayer3Active: false,
                isPlayer4Active: false,
                originalPlayersBeforeBalance: null,
            };
        case "save_original_players":
            return {
                ...state,
                originalPlayersBeforeBalance: action.payload,
            };
        case "clear_original_players":
            return {
                ...state,
                originalPlayersBeforeBalance: null,
            };
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
            originalPlayersBeforeBalance,
        },
        dispatch,
    ] = useReducer(reducer, initialState);

    const countdownAudio = useAudio("/startMatchSound.mp3");
    const { createMatch } = useCreateMatch();
    const { players, isLoading: isLoadingPlayers } = usePlayers();
    const [searchParams, setSearchParams] = useSearchParams();

    // Loading players
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
                    payload: {
                        players,
                        filteredPlayers,
                        filteredForPlayer3And4,
                    },
                });
            }
        },
        [isLoadingPlayers, players, selectedPlayers]
    );

    // Setting match timer and starting match
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

    useEffect(() => {
        function getPlayerById(id) {
            return players?.find((player) => player.id === id);
        }

        function handleSelect(playerId, playerNumber) {
            if (isLoadingPlayers) {
                return;
            }

            const player = getPlayerById(playerId);

            dispatch({
                type: "player_selected",
                payload: { player, playerNumber },
            });
        }

        const p1Params = Number(searchParams.get("player1"));
        const p2Params = Number(searchParams.get("player2"));
        const p3Params = Number(searchParams.get("player3"));
        const p4Params = Number(searchParams.get("player4"));

        if (p1Params > 0 && p1Params !== selectedPlayers[0]?.id) {
            handleSelect(p1Params, 1);
        }
        if (p2Params > 0 && p2Params !== selectedPlayers[1]?.id) {
            handleSelect(p2Params, 2);
        }
        if (p3Params > 0 && p3Params !== selectedPlayers[2]?.id) {
            handleSelect(p3Params, 3);
        }
        if (p4Params > 0 && p4Params !== selectedPlayers[3]?.id) {
            handleSelect(p4Params, 4);
        }

        if (!p1Params && selectedPlayers[0]) {
            handleSelect(null, 1);
        }
        if (!p2Params && selectedPlayers[1]) {
            handleSelect(null, 2);
        }
        if (!p3Params && selectedPlayers[2]) {
            handleSelect(null, 3);
        }
        if (!p4Params && selectedPlayers[3]) {
            handleSelect(null, 4);
        }
    }, [searchParams, isLoadingPlayers, players, selectedPlayers]);

    function startTimer() {
        dispatch({ type: "timer_started" });
    }

    function cancelTimer() {
        dispatch({ type: "timer_canceled" });
        countdownAudio.pause();
        countdownAudio.currentTime = 0;
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

    function selectPlayer(playerId, playerNumber) {
        if (!playerId) {
            searchParams.delete(`player${playerNumber}`);
        } else {
            searchParams.set(`player${playerNumber}`, playerId);
        }
        setSearchParams(searchParams, { replace: true });
    }

    function switchTeams() {
        const p1Params = Number(searchParams.get("player1"));
        const p2Params = Number(searchParams.get("player2"));
        const p3Params = Number(searchParams.get("player3"));
        const p4Params = Number(searchParams.get("player4"));

        if (p1Params) {
            searchParams.set("player2", p1Params);
        } else {
            searchParams.delete("player2");
        }
        if (p2Params) {
            searchParams.set("player1", p2Params);
        } else {
            searchParams.delete("player1");
        }
        if (p3Params) {
            searchParams.set("player4", p3Params);
        } else {
            searchParams.delete("player4");
        }
        if (p4Params) {
            searchParams.set("player3", p4Params);
        } else {
            searchParams.delete("player3");
        }
        setSearchParams(searchParams, { replace: true });
    }

    function clearAllPlayers() {
        dispatch({ type: "clear_selected" });
        searchParams.delete("player1");
        searchParams.delete("player2");
        searchParams.delete("player3");
        searchParams.delete("player4");
        setSearchParams(searchParams, { replace: true });
    }

    // Check if all 4 players are selected for 2on2 balancing
    const [player1, player2, player3, player4] = selectedPlayers;
    const canBalanceTeams =
        isPlayer3Active &&
        isPlayer4Active &&
        player1 &&
        player2 &&
        player3 &&
        player4;

    // Calculate if teams are already optimally balanced
    function calculateBestBalance() {
        if (!canBalanceTeams) return { isBalanced: false, minDiff: Infinity };

        const playersArr = [player1, player2, player3, player4];

        // Current team setup: Team1 = p1+p3, Team2 = p2+p4
        const currentTeam1Mmr = player1.mmr2on2 + player3.mmr2on2;
        const currentTeam2Mmr = player2.mmr2on2 + player4.mmr2on2;
        const currentDiff = Math.abs(currentTeam1Mmr - currentTeam2Mmr);

        // All possible combinations (indices in playersArr)
        // Team1: [0,1] vs Team2: [2,3] → p1+p2 vs p3+p4
        // Team1: [0,2] vs Team2: [1,3] → p1+p3 vs p2+p4 (current)
        // Team1: [0,3] vs Team2: [1,2] → p1+p4 vs p2+p3
        const combinations = [
            { team1: [0, 1], team2: [2, 3] },
            { team1: [0, 2], team2: [1, 3] },
            { team1: [0, 3], team2: [1, 2] },
        ];

        let bestCombo = null;
        let minDiff = Infinity;

        for (const combo of combinations) {
            const team1Mmr =
                playersArr[combo.team1[0]].mmr2on2 +
                playersArr[combo.team1[1]].mmr2on2;
            const team2Mmr =
                playersArr[combo.team2[0]].mmr2on2 +
                playersArr[combo.team2[1]].mmr2on2;
            const diff = Math.abs(team1Mmr - team2Mmr);

            if (diff < minDiff) {
                minDiff = diff;
                bestCombo = combo;
            }
        }

        return {
            isBalanced: currentDiff === minDiff,
            minDiff: (minDiff / 2).toFixed(0),
            bestCombo,
            playersArr,
        };
    }

    const balanceResult = calculateBestBalance();
    const isAlreadyBalanced = canBalanceTeams && balanceResult.isBalanced;

    function balanceTeams() {
        if (!canBalanceTeams) {
            toast.error("All 4 players must be selected to balance teams");
            return;
        }

        // If already balanced and we have original players saved, restore them
        if (isAlreadyBalanced && originalPlayersBeforeBalance) {
            const [origP1, origP2, origP3, origP4] =
                originalPlayersBeforeBalance;
            searchParams.set("player1", origP1.id);
            searchParams.set("player2", origP2.id);
            searchParams.set("player3", origP3.id);
            searchParams.set("player4", origP4.id);
            setSearchParams(searchParams, { replace: true });
            dispatch({ type: "clear_original_players" });
            toast.success("Original teams restored");
            return;
        }

        // If already balanced but no original saved, nothing to do
        if (isAlreadyBalanced) {
            return;
        }

        const { bestCombo, playersArr, minDiff } = balanceResult;

        // Save current configuration before balancing
        dispatch({
            type: "save_original_players",
            payload: [player1, player2, player3, player4],
        });

        // Map indices back to player positions
        // Team 1 = player1 + player3, Team 2 = player2 + player4
        const newPlayer1 = playersArr[bestCombo.team1[0]];
        const newPlayer3 = playersArr[bestCombo.team1[1]];
        const newPlayer2 = playersArr[bestCombo.team2[0]];
        const newPlayer4 = playersArr[bestCombo.team2[1]];

        searchParams.set("player1", newPlayer1.id);
        searchParams.set("player2", newPlayer2.id);
        searchParams.set("player3", newPlayer3.id);
        searchParams.set("player4", newPlayer4.id);
        setSearchParams(searchParams, { replace: true });

        toast.success(`Teams balanced! MMR difference: ${minDiff}`);
    }

    return (
        <ChoosePlayerContext.Provider
            value={{
                isLoading,
                startCountdown,
                cancelTimer,
                timer,
                isStarting,
                activatePlayer,
                isPlayer3Active,
                isPlayer4Active,
                filteredPlayers,
                filteredForPlayer3And4,
                selectPlayer,
                switchTeams,
                selectedPlayers,
                clearAllPlayers,
                balanceTeams,
                canBalanceTeams,
                isAlreadyBalanced,
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
