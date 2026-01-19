import styled, { css, keyframes } from "styled-components";
import { useState, useEffect, useRef } from "react";

/**
 * CountBadge - A unified badge component for displaying notification counts
 *
 * @param {number|string} count - The count to display (auto-formats to "99+" if > 99)
 * @param {string} size - Badge size: "xs" | "sm" | "md" (default: "sm")
 * @param {string} position - Position mode: "inline" | "absolute" | "static" (default: "inline")
 * @param {string} top - Custom top position (for absolute positioning)
 * @param {string} right - Custom right position (for absolute positioning)
 * @param {string} left - Custom left position (for absolute positioning)
 * @param {string} bottom - Custom bottom position (for absolute positioning)
 * @param {boolean} pulse - Whether to show a subtle pulse animation (default: false)
 * @param {boolean} dot - Show as a simple dot without count (default: false)
 * @param {string} className - Additional CSS class
 */

// Spin-in pop animation with rotation
const spinIn = keyframes`
    0% {
        transform: scale(0) rotate(-180deg);
        opacity: 0;
    }
    60% {
        transform: scale(1.15) rotate(10deg);
        opacity: 1;
    }
    80% {
        transform: scale(0.95) rotate(-5deg);
    }
    100% {
        transform: scale(1) rotate(0deg);
        opacity: 1;
    }
`;

// Smooth spin-out fade animation
const spinOut = keyframes`
    0% {
        transform: scale(1) rotate(0deg);
        opacity: 1;
    }
    100% {
        transform: scale(0) rotate(180deg);
        opacity: 0;
    }
`;

// Subtle breathing pulse
const pulseAnimation = keyframes`
    0%, 100% {
        box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.5);
    }
    50% {
        box-shadow: 0 0 0 4px rgba(220, 38, 38, 0);
    }
`;

// Size presets - ensuring round appearance
const sizeStyles = {
    xs: css`
        min-width: 1.6rem;
        height: 1.6rem;
        padding: 0 0.45rem;
        font-size: 0.9rem;
    `,
    sm: css`
        min-width: 1.8rem;
        height: 1.8rem;
        padding: 0 0.5rem;
        font-size: 1rem;
    `,
    md: css`
        min-width: 2.2rem;
        height: 2.2rem;
        padding: 0 0.6rem;
        font-size: 1.1rem;
    `,
};

// Dot size presets (no text, just a circle)
const dotSizeStyles = {
    xs: css`
        width: 0.6rem;
        height: 0.6rem;
        min-width: unset;
        padding: 0;
    `,
    sm: css`
        width: 0.8rem;
        height: 0.8rem;
        min-width: unset;
        padding: 0;
    `,
    md: css`
        width: 1rem;
        height: 1rem;
        min-width: unset;
        padding: 0;
    `,
};

// Position presets
const positionStyles = {
    inline: css`
        position: relative;
    `,
    absolute: css`
        position: absolute;
    `,
    static: css`
        position: static;
    `,
};

const StyledBadge = styled.span`
    /* Base styles */
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-red-700);
    color: white;
    font-weight: 600;
    border-radius: 9999px; /* Perfectly round pill shape */
    pointer-events: none;
    white-space: nowrap;
    line-height: 1;
    flex-shrink: 0;

    /* Size - use dot styles if $dot is true */
    ${(props) =>
        props.$dot
            ? dotSizeStyles[props.$size] || dotSizeStyles.sm
            : sizeStyles[props.$size] || sizeStyles.sm}

    /* Position */
    ${(props) => positionStyles[props.$position] || positionStyles.inline}
    
    /* Custom positioning */
    ${(props) => props.$top && `top: ${props.$top};`}
    ${(props) => props.$right && `right: ${props.$right};`}
    ${(props) => props.$bottom && `bottom: ${props.$bottom};`}
    ${(props) => props.$left && `left: ${props.$left};`}
    
    /* Z-index for absolute positioning */
    ${(props) => props.$position === "absolute" && `z-index: 1;`}

    /* Pulse animation */
    ${(props) =>
        props.$pulse &&
        css`
            animation: ${pulseAnimation} 2s ease-in-out infinite;
        `}

    /* Enter/exit animations */
    ${(props) =>
        props.$isExiting
            ? css`
                  animation: ${spinOut} 0.25s ease-in forwards;
              `
            : css`
                  animation: ${spinIn} 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)
                      forwards;
              `}
`;

function CountBadge({
    count,
    size = "sm",
    position = "inline",
    top,
    right,
    left,
    bottom,
    pulse = false,
    dot = false,
    className,
    ...rest
}) {
    // Track visibility state for exit animation
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const prevCountRef = useRef(null);

    // Determine if badge should show
    const shouldShow = dot ? true : count && count !== 0;

    useEffect(() => {
        if (shouldShow && !isVisible) {
            // Entering: show immediately
            setIsExiting(false);
            setIsVisible(true);
        } else if (!shouldShow && isVisible) {
            // Exiting: start exit animation, then hide
            setIsExiting(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                setIsExiting(false);
            }, 250); // Match spinOut duration
            return () => clearTimeout(timer);
        }

        prevCountRef.current = count;
    }, [shouldShow, isVisible, count]);

    // Format count (max 99+)
    const displayCount =
        typeof count === "number" && count > 99 ? "99+" : count;

    // Don't render if not visible
    if (!isVisible) return null;

    // For dot mode
    if (dot) {
        return (
            <StyledBadge
                $size={size}
                $position={position}
                $top={top}
                $right={right}
                $left={left}
                $bottom={bottom}
                $pulse={pulse}
                $dot={dot}
                $isExiting={isExiting}
                className={className}
                {...rest}
            />
        );
    }

    return (
        <StyledBadge
            $size={size}
            $position={position}
            $top={top}
            $right={right}
            $left={left}
            $bottom={bottom}
            $pulse={pulse}
            $dot={dot}
            $isExiting={isExiting}
            className={className}
            {...rest}
        >
            {displayCount}
        </StyledBadge>
    );
}

export default CountBadge;
