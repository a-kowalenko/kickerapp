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
   Status Colors - Einzigartige, ikonische Farbpalette
   
   Win Streaks (Warm → Hot):
   - warmingUp: Amber/Sonnenaufgang
   - hotStreak: Coral/Energie
   - onFire: Feuerrot/Intensiv
   - legendary: Gold/Majestätisch
   
   Loss Streaks (Cool → Frozen):
   - cold: Himmelblau/Kühl
   - iceCold: Tiefblau/Eiskalt
   - frozen: Violett-Blau/Tiefgefroren
   - humiliated: Anthrazit/Dunkel
   
   Special Status:
   - dominator: Königspurpur
   - comeback: Smaragdgrün/Triumph
   - underdog: Türkis/Cyan
   - giantSlayer: Magenta/Pink
----------------------------------------- */
const STATUS_COLORS = {
    // Win Streaks - Warme aufsteigende Intensität (dunklere secondary für Kontrast)
    warmingUp: { primary: "#F59E0B", secondary: "#B45309" },
    hotStreak: { primary: "#EF4444", secondary: "#B91C1C" },
    onFire: { primary: "#DC2626", secondary: "#991B1B" },
    legendary: { primary: "#F59E0B", secondary: "#92400E" },

    // Loss Streaks - Kalte absteigende Intensität
    cold: { primary: "#3B82F6", secondary: "#1D4ED8" },
    iceCold: { primary: "#2563EB", secondary: "#1E40AF" },
    frozen: { primary: "#7C3AED", secondary: "#5B21B6" },
    humiliated: { primary: "#6B7280", secondary: "#374151" },

    // Special Status - Einzigartige Farben
    dominator: { primary: "#8B5CF6", secondary: "#6D28D9" },
    comeback: { primary: "#10B981", secondary: "#047857" },
    underdog: { primary: "#14B8A6", secondary: "#0F766E" },
    giantSlayer: { primary: "#EC4899", secondary: "#BE185D" },
};

/* ----------------------------------------
   Status Labels (German)
----------------------------------------- */
const STATUS_LABELS = {
    warmingUp: "Warming Up",
    hotStreak: "Hot Streak",
    onFire: "On Fire!",
    legendary: "Legendary",
    cold: "Cold",
    iceCold: "Ice Cold",
    frozen: "Frozen",
    humiliated: "Humiliated",
    dominator: "Dominator",
    comeback: "Comeback",
    underdog: "Underdog",
    giantSlayer: "Giant Slayer",
};

/* ----------------------------------------
   Animations - Subtil und nicht ablenkend
----------------------------------------- */
const shimmer = keyframes`
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
`;

const subtleGlow = keyframes`
    0%, 100% { 
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15),
                    inset 0 1px 0 rgba(255, 255, 255, 0.15);
    }
    50% { 
        box-shadow: 0 2px 8px var(--status-primary),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }
`;

const gentlePulse = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.85; }
`;

/* ----------------------------------------
   Styled Components
----------------------------------------- */
const sizes = {
    small: css`
        font-size: 0.85rem;
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
    font-weight: 700;
    white-space: nowrap;
    letter-spacing: 0.01em;

    ${(props) => sizes[props.$size || "medium"]}

    /* Gradient Background */
    background: linear-gradient(
        135deg,
        var(--status-primary) 0%,
        var(--status-secondary) 100%
    );

    /* Bessere Textlesbarkeit */
    color: white;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.5), 0 0 2px rgba(0, 0, 0, 0.3);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.15);

    /* Legendary - Goldener Shimmer (subtil) */
    ${(props) =>
        props.$status === "legendary" &&
        css`
            background-size: 300% 100%;
            animation: ${shimmer} 4s ease-in-out infinite;
            background-image: linear-gradient(
                90deg,
                var(--status-secondary) 0%,
                var(--status-primary) 25%,
                #fde68a 50%,
                var(--status-primary) 75%,
                var(--status-secondary) 100%
            );
        `}

    /* Hot Statuses - Subtiler Glow */
    ${(props) =>
        ["hotStreak", "onFire"].includes(props.$status) &&
        css`
            animation: ${subtleGlow} 2.5s ease-in-out infinite;
        `}

    /* Cold Statuses - Subtiler Glow */
    ${(props) =>
        ["cold", "iceCold", "frozen"].includes(props.$status) &&
        css`
            animation: ${subtleGlow} 3s ease-in-out infinite;
        `}

    /* Special Statuses - Subtiler Glow */
    ${(props) =>
        ["dominator", "giantSlayer"].includes(props.$status) &&
        css`
            animation: ${subtleGlow} 2.5s ease-in-out infinite;
        `}

    /* Comeback & Underdog - Sanftes Pulsieren */
    ${(props) =>
        ["comeback", "underdog", "warmingUp"].includes(props.$status) &&
        css`
            animation: ${gentlePulse} 3s ease-in-out infinite;
        `}

    /* Humiliated - Gedämpft, keine Animation */
    ${(props) =>
        props.$status === "humiliated" &&
        css`
            opacity: 0.85;
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
    font-weight: 700;

    background: ${(props) =>
        props.$streak > 0
            ? "linear-gradient(135deg, #EF4444, #B91C1C)"
            : "linear-gradient(135deg, #3B82F6, #1D4ED8)"};
    color: white;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.4);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

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
