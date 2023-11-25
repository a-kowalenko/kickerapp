import { K_FACTOR } from "./constants";

export function calculateMmrChange(playerMmr, opponentMmr, result) {
    const expectedOutcome =
        1 / (1 + Math.pow(10, (opponentMmr - playerMmr) / 400));
    return Math.round(K_FACTOR * (result - expectedOutcome));
}

export function getBaseUrl() {
    if (window.location.hostname === "localhost") {
        return "http://localhost:5173";
    } else if (window.location.hostname === "zero-hero-dev.vercel.app") {
        return "https://zero-hero-dev.vercel.app";
    } else {
        return "https://zero-hero.vercel.app";
    }
}

export function formatTime(milliseconds) {
    let seconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);

    seconds = seconds % 60;
    minutes = minutes % 60;

    const pad = (num) => num.toString().padStart(2, "0");

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function isTouchDevice() {
    return (
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0
    );
}

export function hasPlayerWonMatch(playerId, match) {
    const { player1, player2, player3, player4 } = match;
    const isMatchParticipant =
        playerId === player1.id ||
        playerId === player2.id ||
        playerId === player3?.id ||
        playerId === player4?.id;

    if (!isMatchParticipant) {
        throw new Error("Player is not a participant of this match");
    }

    const isTeam1 = playerId === player1.id || playerId === player3?.id;

    return (
        (isTeam1 && match.scoreTeam1 > match.scoreTeam2) ||
        (!isTeam1 && match.scoreTeam1 < match.scoreTeam2)
    );
}

export function getPlayersNumberFromMatch(username, match) {
    for (let i = 1; i <= 4; i++) {
        if (match[`player${i}`]?.name === username) {
            return i;
        }
    }

    return null;
}

export function isPlayerInTeam(playerId, ...teamPlayers) {
    return teamPlayers.some((player) => player?.id === playerId);
}
