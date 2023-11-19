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
