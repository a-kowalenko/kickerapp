import styled, { css, keyframes } from "styled-components";
import { HiOutlineFire, HiOutlineSparkles } from "react-icons/hi2";
import {
    TbSnowflake,
    TbCrown,
    TbSwords,
    TbMoodSad,
    TbArrowBigUp,
    TbFlame,
} from "react-icons/tb";
import { GiLaurelsTrophy, GiFrozenBlock } from "react-icons/gi";

/* ----------------------------------------
   Status Icon Mapping
----------------------------------------- */
const STATUS_ICONS = {
    warmingUp: HiOutlineSparkles,
    hotStreak: HiOutlineFire,
    onFire: TbFlame,
    legendary: GiLaurelsTrophy,
    cold: TbSnowflake,
    iceCold: TbSnowflake,
    frozen: GiFrozenBlock,
    humiliated: TbMoodSad,
    dominator: TbCrown,
    comeback: TbArrowBigUp,
    underdog: TbArrowBigUp,
    giantSlayer: TbSwords,
};

/* ----------------------------------------
   Status Colors
----------------------------------------- */
const STATUS_COLORS = {
    warmingUp: { primary: "#ffc864", secondary: "#ff9f1c" },
    hotStreak: { primary: "#ff6432", secondary: "#ff3c00" },
    onFire: { primary: "#ff3200", secondary: "#ff0000" },
    legendary: { primary: "#ffd700", secondary: "#ffaa00" },
    cold: { primary: "#64b4ff", secondary: "#3296ff" },
    iceCold: { primary: "#3296ff", secondary: "#0064ff" },
    frozen: { primary: "#0064ff", secondary: "#0032c8" },
    humiliated: { primary: "#808080", secondary: "#606060" },
    dominator: { primary: "#ff3232", secondary: "#c80000" },
    comeback: { primary: "#64ff96", secondary: "#32c864" },
    underdog: { primary: "#ffc864", secondary: "#ff9f1c" },
    giantSlayer: { primary: "#c832ff", secondary: "#9600c8" },
};

/* ----------------------------------------
   Status Labels (German)
----------------------------------------- */
const STATUS_LABELS = {
    warmingUp: "Aufwärmen",
    hotStreak: "Heiße Serie",
    onFire: "On Fire!",
    legendary: "Legendär",
    cold: "Kalt",
    iceCold: "Eiskalt",
    frozen: "Eingefroren",
    humiliated: "Gedemütigt",
    dominator: "Dominator",
    comeback: "Comeback",
    underdog: "Underdog",
    giantSlayer: "Riesenbezwinger",
};

/* ----------------------------------------
   Animations
----------------------------------------- */
const pulse = keyframes`
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
`;

const shimmer = keyframes`
    0% { background-position: -100% 0; }
    100% { background-position: 200% 0; }
`;

const fireGlow = keyframes`
    0%, 100% { 
        filter: drop-shadow(0 0 4px var(--status-primary));
    }
    50% { 
        filter: drop-shadow(0 0 8px var(--status-primary)) drop-shadow(0 0 12px var(--status-secondary));
    }
`;

/* ----------------------------------------
   Styled Components
----------------------------------------- */
const sizes = {
    small: css`
        font-size: 0.7rem;
        padding: 0.2rem 0.5rem;
        gap: 0.25rem;

        svg {
            font-size: 0.8rem;
        }
    `,
    medium: css`
        font-size: 0.8rem;
        padding: 0.3rem 0.7rem;
        gap: 0.35rem;

        svg {
            font-size: 1rem;
        }
    `,
    large: css`
        font-size: 0.9rem;
        padding: 0.4rem 0.9rem;
        gap: 0.4rem;

        svg {
            font-size: 1.2rem;
        }
    `,
};

const BadgeContainer = styled.div`
    --status-primary: ${(props) =>
        STATUS_COLORS[props.$status]?.primary || "#888"};
    --status-secondary: ${(props) =>
        STATUS_COLORS[props.$status]?.secondary || "#666"};

    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    font-weight: 600;
    white-space: nowrap;

    ${(props) => sizes[props.$size || "medium"]}

    /* Gradient Background */
    background: linear-gradient(
        135deg,
        var(--status-primary),
        var(--status-secondary)
    );

    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);

    /* Shimmer effect for legendary */
    ${(props) =>
        props.$status === "legendary" &&
        css`
            background-size: 200% 100%;
            animation: ${shimmer} 2s linear infinite;
            background-image: linear-gradient(
                90deg,
                var(--status-secondary) 0%,
                var(--status-primary) 25%,
                #fff 50%,
                var(--status-primary) 75%,
                var(--status-secondary) 100%
            );
        `}

    /* Fire glow for hot statuses */
    ${(props) =>
        ["hotStreak", "onFire"].includes(props.$status) &&
        css`
            animation: ${fireGlow} 1.5s ease-in-out infinite;
        `}

    /* Pulse for bounty-relevant statuses */
    ${(props) =>
        props.$showBounty &&
        props.$bounty > 0 &&
        css`
            animation: ${pulse} 2s ease-in-out infinite;
        `}
`;

const IconWrapper = styled.span`
    display: flex;
    align-items: center;
    justify-content: center;
`;

const BountyValue = styled.span`
    margin-left: 0.3rem;
    padding-left: 0.4rem;
    border-left: 1px solid rgba(255, 255, 255, 0.3);
    font-size: 0.85em;
    opacity: 0.9;
`;

const StreakValue = styled.span`
    font-variant-numeric: tabular-nums;
`;

/* ----------------------------------------
   Streak Badge (zeigt nur Streak-Zahl)
----------------------------------------- */
const StreakBadge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;

    background: ${(props) =>
        props.$streak > 0
            ? "linear-gradient(135deg, #ff6432, #ff3c00)"
            : "linear-gradient(135deg, #64b4ff, #3296ff)"};
    color: white;

    svg {
        font-size: 0.9rem;
    }
`;

/* ----------------------------------------
   StatusBadge Component
   
   Props:
   - status: string - Status key (z.B. 'hotStreak', 'iceCold')
   - streak: number - Aktuelle Streak-Zahl (optional)
   - bounty: number - Aktueller Bounty-Wert (optional)
   - showLabel: boolean - Zeige Text-Label (default: true)
   - showBounty: boolean - Zeige Bounty-Wert (default: false)
   - size: 'small' | 'medium' | 'large' (default: 'medium')
----------------------------------------- */
export function StatusBadge({
    status,
    streak,
    bounty = 0,
    showLabel = true,
    showBounty = false,
    size = "medium",
}) {
    const Icon = STATUS_ICONS[status];
    const label = STATUS_LABELS[status];

    if (!status || !Icon) return null;

    return (
        <BadgeContainer
            $status={status}
            $size={size}
            $showBounty={showBounty}
            $bounty={bounty}
        >
            <IconWrapper>
                <Icon />
            </IconWrapper>
            {showLabel && <span>{label}</span>}
            {streak !== undefined && streak !== 0 && (
                <StreakValue>
                    ({streak > 0 ? "+" : ""}
                    {streak})
                </StreakValue>
            )}
            {showBounty && bounty > 0 && (
                <BountyValue>+{bounty} MMR</BountyValue>
            )}
        </BadgeContainer>
    );
}

/* ----------------------------------------
   SimpleStreakBadge Component
   
   Einfaches Badge das nur die Streak-Zahl zeigt
   Props:
   - streak: number - Aktuelle Streak (positiv=Siege, negativ=Niederlagen)
----------------------------------------- */
export function SimpleStreakBadge({ streak }) {
    if (!streak || streak === 0) return null;

    const Icon = streak > 0 ? TbFlame : TbSnowflake;

    return (
        <StreakBadge $streak={streak}>
            <Icon />
            <span>
                {streak > 0 ? "+" : ""}
                {streak}
            </span>
        </StreakBadge>
    );
}

/* ----------------------------------------
   StatusBadgeList Component
   
   Zeigt mehrere Status-Badges in einer Reihe
   Props:
   - statuses: string[] - Array von Status-Keys
   - size: 'small' | 'medium' | 'large'
----------------------------------------- */
const BadgeList = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
`;

export function StatusBadgeList({ statuses = [], size = "small" }) {
    if (!statuses || statuses.length === 0) return null;

    return (
        <BadgeList>
            {statuses.map((status) => (
                <StatusBadge
                    key={status}
                    status={status}
                    showLabel={false}
                    size={size}
                />
            ))}
        </BadgeList>
    );
}

export default StatusBadge;
