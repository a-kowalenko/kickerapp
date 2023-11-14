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
