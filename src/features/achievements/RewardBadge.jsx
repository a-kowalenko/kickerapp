import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import styled, { keyframes } from "styled-components";
import { HiOutlineGift } from "react-icons/hi2";
import Spinner from "../../ui/Spinner";
import { useOwnPlayer } from "../../hooks/useOwnPlayer";

const fadeIn = keyframes`
    from {
        opacity: 0;
        transform: translateY(4px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`;

const RewardBadgeContainer = styled.span`
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 1rem;
    padding: 0.2rem 0.6rem;
    background-color: var(--color-brand-100);
    color: var(--color-brand-700);
    border-radius: var(--border-radius-sm);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background-color: var(--color-brand-200);
        transform: scale(1.05);
    }

    & svg {
        width: 1.2rem;
        height: 1.2rem;
        transition: transform 0.2s ease;
    }

    &:hover svg {
        transform: rotate(-10deg) scale(1.1);
    }
`;

const TooltipContainer = styled.div`
    position: fixed;
    z-index: 10000;
    animation: ${fadeIn} 0.2s ease;
    pointer-events: none;
`;

const TooltipContent = styled.div`
    background-color: var(--color-grey-0);
    border: 1px solid var(--secondary-border-color);
    border-radius: var(--border-radius-md);
    padding: 1.2rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1);
    min-width: 20rem;
    max-width: 28rem;
`;

const TooltipHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    margin-bottom: 0.8rem;
    padding-bottom: 0.8rem;
    border-bottom: 1px solid var(--secondary-border-color);
`;

const TooltipIcon = styled.div`
    width: 3.6rem;
    height: 3.6rem;
    border-radius: 50%;
    background: linear-gradient(
        135deg,
        var(--color-brand-500),
        var(--color-brand-700)
    );
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

const TooltipTitle = styled.div`
    flex: 1;
`;

const TooltipLabel = styled.span`
    display: block;
    font-size: 1rem;
    color: var(--color-brand-600);
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.5px;
    margin-bottom: 0.2rem;
`;

const TooltipName = styled.span`
    display: block;
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--primary-text-color);
`;

const TooltipDescription = styled.p`
    font-size: 1.2rem;
    color: var(--secondary-text-color);
    margin: 0 0 1rem 0;
    line-height: 1.4;
`;

const TooltipPreview = styled.div`
    background-color: var(--color-grey-50);
    border: 1px dashed var(--secondary-border-color);
    border-radius: var(--border-radius-sm);
    padding: 0.8rem 1rem;
    text-align: center;
`;

const PreviewLabel = styled.span`
    display: block;
    font-size: 1rem;
    color: var(--tertiary-text-color);
    margin-bottom: 0.4rem;
`;

const PreviewText = styled.span`
    display: block;
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--color-brand-700);
    font-style: italic;
`;

const TooltipArrow = styled.div`
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-bottom: 6px solid var(--secondary-border-color);

    &::after {
        content: "";
        position: absolute;
        top: 1px;
        left: -5px;
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-bottom: 5px solid var(--color-grey-0);
    }
`;

/**
 * RewardBadge - Shows a badge indicating an achievement unlocks a reward
 * with a beautiful tooltip on hover
 *
 * @param {Object} props
 * @param {Object} props.reward - The reward object from API
 * @param {string} props.reward.name - Reward name
 * @param {string} props.reward.type - 'title' or 'frame'
 * @param {string} props.reward.description - Reward description
 * @param {string} props.reward.display_value - The actual reward value
 * @param {string} props.reward.display_position - 'prefix' or 'suffix' for titles
 * @param {string} props.reward.icon - Emoji icon
 */
function RewardBadge({ reward }) {
    const [isHovered, setIsHovered] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
    const badgeRef = useRef(null);
    const { data: player, isLoading: isLoadingPlayer } = useOwnPlayer();

    if (isLoadingPlayer) {
        return <Spinner />;
    }

    const handleMouseEnter = () => {
        if (badgeRef.current) {
            const rect = badgeRef.current.getBoundingClientRect();
            const tooltipWidth = 240; // approximate width
            let left = rect.left + rect.width / 2 - tooltipWidth / 2;

            // Keep tooltip within viewport
            if (left < 8) left = 8;
            if (left + tooltipWidth > window.innerWidth - 8) {
                left = window.innerWidth - tooltipWidth - 8;
            }

            setTooltipPos({
                top: rect.bottom + 8,
                left,
            });
        }
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    const getPreviewText = () => {
        if (reward.type === "title") {
            if (reward.display_position === "prefix") {
                return `"${reward.display_value} ${player.name}"`;
            }
            return `"${player.name}, ${reward.display_value}"`;
        }
        return null;
    };

    const typeLabel = reward.type === "title" ? "Title" : "Frame";

    return (
        <>
            <RewardBadgeContainer
                ref={badgeRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <HiOutlineGift />
                {typeLabel}
            </RewardBadgeContainer>

            {isHovered &&
                createPortal(
                    <TooltipContainer
                        style={{
                            top: tooltipPos.top,
                            left: tooltipPos.left,
                        }}
                    >
                        <TooltipContent>
                            <TooltipArrow />
                            <TooltipHeader>
                                <TooltipIcon>{reward.icon || "🎁"}</TooltipIcon>
                                <TooltipTitle>
                                    <TooltipLabel>
                                        Unlocks {typeLabel}
                                    </TooltipLabel>
                                    <TooltipName>{reward.name}</TooltipName>
                                </TooltipTitle>
                            </TooltipHeader>

                            {reward.description && (
                                <TooltipDescription>
                                    {reward.description}
                                </TooltipDescription>
                            )}

                            {reward.type === "title" && (
                                <TooltipPreview>
                                    <PreviewLabel>Preview</PreviewLabel>
                                    <PreviewText>
                                        {getPreviewText()}
                                    </PreviewText>
                                </TooltipPreview>
                            )}

                            {reward.type === "frame" &&
                                reward.display_value && (
                                    <TooltipPreview>
                                        <PreviewLabel>
                                            Frame Preview
                                        </PreviewLabel>
                                        <img
                                            src={reward.display_value}
                                            alt={reward.name}
                                            style={{
                                                width: "6rem",
                                                height: "6rem",
                                                objectFit: "contain",
                                            }}
                                        />
                                    </TooltipPreview>
                                )}
                        </TooltipContent>
                    </TooltipContainer>,
                    document.body
                )}
        </>
    );
}

export default RewardBadge;
