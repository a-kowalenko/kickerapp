export const PAGE_SIZE = 10;
export const K_FACTOR = 32;
export const START_MATCH_COUNTDOWN = 10;
export const DEFAULT_AVATAR = "/default-user.jpg";
export const ACTIVE_MATCH_REFETCH_INTERVAL = 1000 * 1;
export const CHECK_FOR_ACTIVE_MATCH_INTERVAL = 1000 * 3;
export const FATALITY_FAKTOR = 2;

// MEDIA QUERIES
export const MAX_MOBILE_WIDTH = 480;
export const MAX_TABLET_WIDTH = 768;
export const MIN_DESKTOP_WIDTH = 769;

export const media = {
    maxMobile: MAX_MOBILE_WIDTH,
    maxTablet: MAX_TABLET_WIDTH,
    mobile: `@media(max-width: ${MAX_MOBILE_WIDTH}px)`,
    tablet: `@media(max-width: ${MAX_TABLET_WIDTH}px)`,
    desktop: `@media(min-width: ${MIN_DESKTOP_WIDTH}px)`,
};

// MATCH CONSTANTS
export const GAMEMODE_1ON1 = "1on1";
export const GAMEMODE_2ON2 = "2on2";
export const GAMEMODE_2ON1 = "2on1";
export const MATCH_ACTIVE = "active";
export const MATCH_ENDED = "ended";
export const MATCH_ENDED_BY_CRON = "ended_by_cron";
export const END_MATCH_PRESS_DELAY = 1000 * 1;

// GOAL TYPES
export const STANDARD_GOAL = "standard_goal";
export const OWN_GOAL = "own_goal";
export const GENERATED_GOAL = "generated_goal";

// LOGIN CONSTANTS
export const ENTER_KICKER_RETRY_ATTEMPTS = 2;
export const ENTER_KICKER_RETRY_INTERVAL = 333;

// DATABASE CONSTANTS
export const DEFAULT_DATABASE_SCHEMA = "kopecht";
export const MATCHES = "matches";
export const PLAYER = "player";
export const KICKER = "kicker";
export const GOALS = "goals";
export const SEASONS = "seasons";
export const SEASON_RANKINGS = "season_rankings";
export const MATCH_COMMENTS = "match_comments";
export const MATCH_REACTIONS = "match_reactions";
export const COMMENT_REACTIONS = "comment_reactions";

// COMMENT CONSTANTS
export const MAX_COMMENT_LENGTH = 1000;

// SEASON FILTER VALUES
export const SEASON_ALL_TIME = "all-time";
export const SEASON_OFF_SEASON = "off-season";

// COLORS
export const colorsLight = [
    "#84cc16",
    "#ef4444",
    "#3b82f6",
    "#eab308",
    "#22c55e",
    "#f97316",
    "#14b8a6",
    "#a855f7",
];

export const colorsDark = [
    "#b91c1c",
    "#c2410c",
    "#a16207",
    "#4d7c0f",
    "#15803d",
    "#0f766e",
    "#1d4ed8",
    "#7e22ce",
];
