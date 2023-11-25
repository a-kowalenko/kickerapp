import styled, { css } from "styled-components";
import { END_MATCH_PRESS_DELAY } from "../utils/constants";
import { useRef } from "react";
import { useState } from "react";

const ButtonContainer = styled.div`
    position: relative;
    display: inline-block;

    svg {
        pointer-events: none;
    }
`;

const Button = styled.button`
    border-radius: var(--border-radius-sm);
    box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.4);
    transition: box-shadow 0.2s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2.4rem;
    user-select: none;

    &:hover {
        box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.7);
        /* background-color: var(--primary-button-color-hover); */
    }

    &:active {
        box-shadow: 2px 2px 2px 2px rgba(0, 0, 0, 0.7);
    }

    ${(props) => {
        const size = props.$size;
        return sizes[size];
    }}

    ${(props) => {
        const variation = props.$variation;
        return variations[variation];
    }}
`;

const variations = {
    primary: css`
        color: var(--primary-button-color-text);
        border: 1px solid var(--primary-button-color);
        background-color: var(--primary-button-color);

        &:active {
            border: 1px solid var(--primary-button-color-active);
            background-color: var(--primary-button-color-active);
        }
    `,
    secondary: css`
        color: var(--secondary-button-color-text);
        border: 1px solid var(--secondary-button-color);
        background-color: var(--secondary-button-color);

        &:active {
            border: 1px solid var(--secondary-button-color-active);
            background-color: var(--secondary-button-color-active);
        }
    `,
    danger: css`
        color: var(--danger-button-color-text);
        border: 1px solid var(--danger-button-color);
        background-color: var(--danger-button-color);

        &:active {
            border: 1px solid var(--danger-button-color-active);
            background-color: var(--danger-button-color-active);
        }
    `,
};

const sizes = {
    small: css`
        padding: 0.3rem 0.6rem;
        font-weight: 600;
        font-size: 1.5rem;
    `,
    medium: css`
        padding: 0.6rem 1.2rem;
        font-weight: 500;
        font-size: 1.6rem;
    `,
    large: css`
        padding: 1.2rem 2.4rem;
        font-weight: 500;
        font-size: 1.6rem;
    `,
    xlarge: css`
        padding: 1.2rem 2.4rem;
        font-weight: 500;
        font-size: 1.8rem;

        & svg {
            font-size: 3.2rem;
        }
    `,
    huge: css`
        padding: 1.2rem 2.4rem;
        font-weight: 500;
        font-size: 3.2rem;
    `,
};

Button.defaultProps = {
    $size: "medium",
    $variation: "primary",
};

const ProgressBarStrokeWidth = "3.8";

const Svg = styled.svg`
    transform: rotate(-90deg);
    ${(props) => svgSizes[props.$size]}
`;

Svg.defaultProps = {
    $size: "medium",
};

const svgSizes = {
    medium: css`
        height: 2.6rem;
        width: 2.6rem;
        margin: -0.6rem;
    `,
    xlarge: css`
        height: 3.2rem;
        width: 3.2rem;
    `,
};

const CircleBackground = styled.circle`
    fill: none;
    stroke: var(--primary-text-color);
    stroke-width: ${ProgressBarStrokeWidth};
`;

const CircleProgress = styled.circle.attrs((props) => ({
    style: { strokeDashoffset: 100 - props.$percentageComplete },
}))`
    fill: none;
    stroke: var(--secondary-border-color);
    stroke-dasharray: 100 100;
    stroke-linecap: round;
    stroke-width: ${ProgressBarStrokeWidth};
`;

function DelayedButton({ action, children, icon, ...props }) {
    const [percentageComplete, setPercentageComplete] = useState(0);
    const timerRef = useRef(null);
    const startTimeRef = useRef(null);

    function handleMouseDown(e) {
        e.stopPropagation();
        startTimeRef.current = Date.now();
        timerRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            const progress = Math.min(elapsed / END_MATCH_PRESS_DELAY, 1) * 100;
            setPercentageComplete(progress);
            if (progress >= 100) {
                clearInterval(timerRef.current);
                action();
            }
        }, 10);
    }

    function handleMouseUp(e) {
        e.stopPropagation();
        clearInterval(timerRef.current);
        setPercentageComplete(0);
    }

    function handleMouseLeave(e) {
        e.stopPropagation();
        clearInterval(timerRef.current);
        setPercentageComplete(0);
    }

    return (
        <ButtonContainer>
            <Button
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleMouseDown}
                onTouchEnd={handleMouseUp}
                {...props}
            >
                {percentageComplete > 0 ? (
                    <Svg viewBox="-1 -1 34 34" $size={props.$size}>
                        <CircleBackground cx="16" cy="16" r="15.9155" />
                        <CircleProgress
                            cx="16"
                            cy="16"
                            r="15.9155"
                            $percentageComplete={percentageComplete}
                        />
                    </Svg>
                ) : (
                    icon
                )}
                {children}
            </Button>
        </ButtonContainer>
    );
}

export default DelayedButton;
