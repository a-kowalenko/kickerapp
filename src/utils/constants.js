export const PAGE_SIZE = 10;
export const K_FACTOR = 32;
export const START_MATCH_COUNTDOWN = 10;
export const DEFAULT_AVATAR = "/default-user.jpg";
export const ACTIVE_MATCH_REFETCH_INTERVAL = 1000 * 1;
export const CHECK_FOR_ACTIVE_MATCH_INTERVAL = 1000 * 3;
export const DISGRACE_FAKTOR = 2;

// MEDIA QUERIES
export const maxMobileWidth = 480;
export const maxTabletWidth = 768;
export const minDesktopWidth = 769;

export const media = {
    maxMobile: maxMobileWidth,
    maxTablet: maxTabletWidth,
    mobile: `@media(max-width: ${maxMobileWidth}px)`,
    tablet: `@media(max-width: ${maxTabletWidth}px)`,
    desktop: `@media(min-width: ${minDesktopWidth}px)`,
};

// MATCH CONSTANTS
export const GAMEMODE_1ON1 = "1on1";
export const GAMEMODE_2ON2 = "2on2";
export const GAMEMODE_2ON1 = "2on1";

// GOAL TYPES
export const STANDARD_GOAL = "standard_goal";
export const OWN_GOAL = "own_goal";

// DATABASE CONSTANTS
export const DEFAULT_DATABASE_SCHEMA = "kopecht";

export const MATCHES = "matches";
export const PLAYER = "player";
export const KICKER = "kicker";
export const GOALS = "goals";
