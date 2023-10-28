import { K_FACTOR } from "./constants";

export function calculateMmrChange(playerMmr, opponentMmr, result) {
    const expectedOutcome =
        1 / (1 + Math.pow(10, (opponentMmr - playerMmr) / 400));
    return Math.round(K_FACTOR * (result - expectedOutcome));
}
