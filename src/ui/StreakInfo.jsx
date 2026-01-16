import styled, { css } from "styled-components";
import { HiOutlineFire } from "react-icons/hi2";
import { TbSnowflake } from "react-icons/tb";
import { StreakTooltip, useBountyTooltip } from "./BountyTooltip";

/* ----------------------------------------
   Size Configuration
----------------------------------------- */
const sizeConfig = {
    xs: { fontSize: "0.75rem" },
    small: { fontSize: "1.4rem" },
    medium: { fontSize: "0.85rem" },
    large: { fontSize: "1rem" },
};

/* ----------------------------------------
   Styled Components
----------------------------------------- */
const Container = styled.div`
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: ${(props) =>
        sizeConfig[props.$size]?.fontSize || sizeConfig.medium.fontSize};
    color: var(--secondary-text-color);
    cursor: ${(props) => (props.$hoverable ? "pointer" : "default")};
    transition: transform 0.2s ease;

    ${(props) =>
        props.$hoverable &&
        css`
            &:hover {
                transform: scale(1.08);
            }
        `}

    svg {
        color: ${(props) => (props.$cold ? "#3B82F6" : "#EF4444")};
        font-size: 1.4em;
    }
`;

/* ----------------------------------------
   StreakInfo Component
   
   Zeigt Streak-Informationen mit optionalem Tooltip
   
   Props:
   - streak: number - Aktuelle Streak (positiv = Siege, negativ = Niederlagen)
   - streak1on1: number - Streak für 1on1 (für Tooltip)
   - streak2on2: number - Streak für 2on2 (für Tooltip)
   - size: 'xs' | 'small' | 'medium' | 'large'
   - showLabel: boolean - Zeige Text-Label neben Icon
   - showTooltip: boolean - Zeige Tooltip bei Hover
   - gamemode: string - '1on1' oder '2on2' (für Label mit Gamemode)
   - showGamemode: boolean - Zeige Gamemode im Label
   - labelVariant: 'short' | 'long' - 'short' = "Win/Loss Streak", 'long' = "Siege/Niederlagen in Folge"
----------------------------------------- */
export function StreakInfo({
    streak = 0,
    streak1on1 = 0,
    streak2on2 = 0,
    size = "medium",
    showLabel = true,
    showTooltip = true,
    gamemode,
    showGamemode = false,
    labelVariant = "short",
}) {
    // Tooltip hook
    const {
        isHovered,
        tooltipPos,
        handleMouseEnter,
        handleMouseLeave,
        triggerRef,
    } = useBountyTooltip(140);

    const hasStreak = Math.abs(streak) >= 3;
    const isCold = streak < 0;

    // Determine tooltip data availability
    const tooltipStreak1on1 = streak1on1 || (gamemode === "1on1" ? streak : 0);
    const tooltipStreak2on2 = streak2on2 || (gamemode === "2on2" ? streak : 0);
    const hasTooltipData =
        Math.abs(tooltipStreak1on1) >= 3 || Math.abs(tooltipStreak2on2) >= 3;

    // Don't render if no significant streak
    if (!hasStreak) return null;

    const isHoverable = showTooltip && hasTooltipData;

    // Build label text
    const buildLabel = () => {
        if (!showLabel) return null;

        const absStreak = Math.abs(streak);
        const isWin = streak > 0;

        if (labelVariant === "long") {
            const suffix = showGamemode && gamemode ? ` (${gamemode})` : "";
            return `${absStreak} ${
                isWin ? "Siege" : "Niederlagen"
            } in Folge${suffix}`;
        }

        // short variant
        return `${absStreak} ${isWin ? "Win" : "Loss"} Streak`;
    };

    return (
        <>
            <Container
                $size={size}
                $cold={isCold}
                $hoverable={isHoverable}
                ref={isHoverable ? triggerRef : null}
                onMouseEnter={isHoverable ? handleMouseEnter : undefined}
                onMouseLeave={isHoverable ? handleMouseLeave : undefined}
            >
                {streak > 0 ? <HiOutlineFire /> : <TbSnowflake />}
                {buildLabel()}
            </Container>

            {/* Streak Tooltip */}
            {showTooltip && hasTooltipData && (
                <StreakTooltip
                    isVisible={isHovered}
                    position={tooltipPos}
                    streak1on1={tooltipStreak1on1}
                    streak2on2={tooltipStreak2on2}
                />
            )}
        </>
    );
}

export default StreakInfo;
