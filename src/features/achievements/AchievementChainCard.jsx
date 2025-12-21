import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import styled, { keyframes } from "styled-components";
import {
    HiOutlineTrophy,
    HiLockClosed,
    HiCheck,
    HiChevronDown,
    HiChevronUp,
} from "react-icons/hi2";
import { media } from "../../utils/constants";
import { useAchievementReward } from "./usePlayerRewards";
import RewardBadge from "./RewardBadge";

const fadeIn = keyframes`
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`;

const Container = styled.div`
    border-radius: var(--border-radius-md);
    overflow: visible;
    border: 1px solid
        ${(props) =>
            props.$isUnlocked
                ? "var(--achievement-unlocked-border, var(--color-brand-500))"
                : "var(--secondary-border-color)"};
    background-color: ${(props) =>
        props.$isUnlocked
            ? "var(--achievement-unlocked-bg, var(--color-grey-50))"
            : "var(--color-grey-0)"};
    position: relative;
`;

const MainCard = styled.div`
    display: flex;
    gap: 1.6rem;
    padding: 1.6rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background-color: var(--color-grey-50);
    }

    ${media.mobile} {
        padding: 1.2rem;
        gap: 1.2rem;
    }
`;

const IconContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 6rem;
    height: 6rem;
    min-width: 6rem;
    border-radius: 50%;
    background: ${(props) =>
        props.$isUnlocked
            ? "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700))"
            : props.$isAvailable
            ? "var(--color-grey-200)"
            : "var(--color-grey-300)"};
    color: ${(props) =>
        props.$isUnlocked ? "white" : "var(--color-grey-500)"};
    font-size: 2.4rem;
    position: relative;

    ${media.mobile} {
        width: 4.8rem;
        height: 4.8rem;
        min-width: 4.8rem;
        font-size: 2rem;
    }
`;

const CheckBadge = styled.div`
    position: absolute;
    bottom: -4px;
    right: -4px;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background-color: var(--color-green-700);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 0.4rem;
`;

const Name = styled.h3`
    font-size: 1.6rem;
    font-weight: 600;
    color: ${(props) =>
        props.$isUnlocked
            ? "var(--color-brand-700)"
            : "var(--primary-text-color)"};
    margin: 0;

    ${media.mobile} {
        font-size: 1.4rem;
    }
`;

const Points = styled.span`
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 1.4rem;
    font-weight: 600;
    color: ${(props) =>
        props.$isUnlocked ? "var(--color-brand-600)" : "var(--color-grey-500)"};
    white-space: nowrap;

    & svg {
        width: 1.6rem;
        height: 1.6rem;
    }

    ${media.mobile} {
        font-size: 1.2rem;
    }
`;

const Description = styled.p`
    font-size: 1.4rem;
    color: var(--secondary-text-color);
    margin: 0 0 0.8rem 0;
    line-height: 1.4;

    ${media.mobile} {
        font-size: 1.2rem;
    }
`;

const ChainIndicator = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    margin-top: 0.4rem;
`;

const ChainBadge = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 1.2rem;
    padding: 0.3rem 0.8rem;
    background: linear-gradient(
        135deg,
        var(--color-brand-100),
        var(--color-brand-200)
    );
    color: var(--color-brand-700);
    border-radius: 9999px;
    font-weight: 500;

    & svg {
        width: 1.4rem;
        height: 1.4rem;
    }
`;

const ChainDots = styled.div`
    display: flex;
    align-items: center;
    gap: 0.4rem;
`;

const ChainDot = styled.div`
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 50%;
    background-color: ${(props) =>
        props.$filled ? "var(--color-brand-500)" : "var(--color-grey-300)"};
    transition: background-color 0.2s ease;
`;

const ExpandIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-grey-400);
    margin-left: auto;
    transition: transform 0.2s ease;

    & svg {
        width: 2rem;
        height: 2rem;
    }
`;

const ProgressContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
`;

const ProgressBar = styled.div`
    width: 100%;
    height: 0.8rem;
    background-color: var(--color-grey-200);
    border-radius: 9999px;
    overflow: hidden;
`;

const ProgressFill = styled.div`
    height: 100%;
    width: ${(props) => props.$percent}%;
    background: ${(props) =>
        props.$isComplete
            ? "var(--color-green-500)"
            : "linear-gradient(90deg, var(--color-brand-500), var(--color-brand-600))"};
    border-radius: 9999px;
    transition: width 0.3s ease;
`;

const ProgressText = styled.span`
    font-size: 1.2rem;
    color: var(--tertiary-text-color);
    text-align: right;
`;

const UnlockedDate = styled.span`
    font-size: 1.2rem;
    color: var(--tertiary-text-color);
    margin-top: 0.4rem;
`;

// Expanded chain view - Dropdown overlay
const DropdownOverlay = styled.div`
    position: fixed;
    background-color: var(--color-grey-0);
    border: 1px solid var(--color-brand-300);
    border-radius: var(--border-radius-md);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    animation: ${fadeIn} 0.2s ease;
    max-height: 70vh;
    overflow-y: auto;
    will-change: transform;
`;

const DropdownBackdrop = styled.div`
    position: fixed;
    inset: 0;
    z-index: 999;
`;

const ExpandedSection = styled.div`
    padding: 1.2rem;
`;

const ChainTitle = styled.div`
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--secondary-text-color);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;
`;

const ChainList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0;
`;

const ChainItemRow = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.8rem;
    border-radius: var(--border-radius-sm);
    background-color: ${(props) =>
        props.$isCurrent ? "var(--color-grey-100)" : "transparent"};
    border: ${(props) =>
        props.$isCurrent
            ? "1px solid var(--color-brand-300)"
            : "1px solid transparent"};
    opacity: ${(props) => (props.$isFuture ? 0.5 : 1)};
    position: relative;

    /* Connector line */
    &:not(:last-child)::after {
        content: "";
        position: absolute;
        left: 1.9rem;
        top: 100%;
        height: 0.8rem;
        width: 2px;
        background-color: ${(props) =>
            props.$isUnlocked
                ? "var(--color-brand-400)"
                : "var(--color-grey-300)"};
    }
`;

const ChainItemIcon = styled.div`
    width: 2.4rem;
    height: 2.4rem;
    min-width: 2.4rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    background: ${(props) =>
        props.$isUnlocked
            ? "var(--color-brand-500)"
            : props.$isCurrent
            ? "var(--color-grey-0)"
            : props.$isFuture
            ? "var(--color-grey-100)"
            : "var(--color-grey-200)"};
    color: ${(props) =>
        props.$isUnlocked ? "white" : "var(--color-grey-500)"};
    border: 2px solid
        ${(props) =>
            props.$isUnlocked
                ? "var(--color-brand-600)"
                : props.$isCurrent
                ? "var(--color-brand-400)"
                : "var(--color-grey-300)"};

    & svg {
        width: 1.2rem;
        height: 1.2rem;
    }
`;

const ChainItemContent = styled.div`
    flex: 1;
    min-width: 0;
`;

const ChainItemName = styled.span`
    font-size: 1.3rem;
    font-weight: ${(props) => (props.$isCurrent ? "600" : "500")};
    color: ${(props) =>
        props.$isUnlocked
            ? "var(--color-brand-700)"
            : props.$isCurrent
            ? "var(--primary-text-color)"
            : props.$isFuture
            ? "var(--color-grey-400)"
            : "var(--color-grey-500)"};
    display: block;
`;

const ChainItemDesc = styled.span`
    font-size: 1.1rem;
    color: ${(props) =>
        props.$isFuture
            ? "var(--color-grey-400)"
            : "var(--tertiary-text-color)"};
    display: block;
    margin-top: 0.2rem;
`;

const ChainItemPoints = styled.span`
    font-size: 1.2rem;
    font-weight: 600;
    color: ${(props) =>
        props.$isUnlocked
            ? "var(--color-brand-600)"
            : props.$isFuture
            ? "var(--color-grey-300)"
            : "var(--color-grey-400)"};
    display: flex;
    align-items: center;
    gap: 0.3rem;

    & svg {
        width: 1.2rem;
        height: 1.2rem;
    }
`;

const ChainItemRewardWrapper = styled.div`
    margin-top: 0.4rem;
`;

// Sub-component for each chain item that fetches its own reward
function ChainItem({ achievement, index, currentAchievementId }) {
    const { reward } = useAchievementReward(achievement.key);
    const isCurrent = achievement.id === currentAchievementId;
    const isFuture = !achievement.isUnlocked && !isCurrent;

    return (
        <ChainItemRow
            $isUnlocked={achievement.isUnlocked}
            $isCurrent={isCurrent}
            $isFuture={isFuture}
        >
            <ChainItemIcon
                $isUnlocked={achievement.isUnlocked}
                $isCurrent={isCurrent}
                $isFuture={isFuture}
            >
                {achievement.isUnlocked ? (
                    <HiCheck />
                ) : isFuture ? (
                    <HiLockClosed />
                ) : (
                    index + 1
                )}
            </ChainItemIcon>
            <ChainItemContent>
                <ChainItemName
                    $isUnlocked={achievement.isUnlocked}
                    $isCurrent={isCurrent}
                    $isFuture={isFuture}
                >
                    {achievement.name}
                </ChainItemName>
                <ChainItemDesc $isFuture={isFuture}>
                    {achievement.description}
                </ChainItemDesc>
                {reward && (
                    <ChainItemRewardWrapper>
                        <RewardBadge reward={reward} />
                    </ChainItemRewardWrapper>
                )}
            </ChainItemContent>
            <ChainItemPoints
                $isUnlocked={achievement.isUnlocked}
                $isFuture={isFuture}
            >
                <HiOutlineTrophy />
                {achievement.points}
            </ChainItemPoints>
        </ChainItemRow>
    );
}

function AchievementChainCard({ chain, currentAchievementId }) {
    // Debug: Log the chain data
    console.log("AchievementChainCard - chain:", chain);
    console.log("AchievementChainCard - chain length:", chain.length);
    console.log(
        "AchievementChainCard - chain names:",
        chain.map((a) => a.name)
    );

    const [isExpanded, setIsExpanded] = useState(false);
    const containerRef = useRef(null);
    const dropdownRef = useRef(null);
    const rafRef = useRef(null);

    // Find the current achievement to display
    const currentAchievement =
        chain.find((a) => a.id === currentAchievementId) || chain[0];

    // Fetch reward only for the CURRENT achievement in the chain
    const { reward: currentReward } = useAchievementReward(
        currentAchievement?.key
    );

    // Update dropdown position using requestAnimationFrame for smooth updates
    useEffect(() => {
        if (!isExpanded || !containerRef.current) return;

        const updatePosition = () => {
            if (!containerRef.current || !dropdownRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const dropdown = dropdownRef.current;

            // Use transform for GPU-accelerated positioning
            dropdown.style.top = `${rect.bottom + 4}px`;
            dropdown.style.left = `${rect.left}px`;
            dropdown.style.width = `${rect.width}px`;
        };

        const onScroll = () => {
            // Cancel any pending frame
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            // Schedule update on next frame
            rafRef.current = requestAnimationFrame(updatePosition);
        };

        // Initial position
        updatePosition();

        // Listen to scroll with passive for better performance
        window.addEventListener("scroll", onScroll, {
            passive: true,
            capture: true,
        });
        window.addEventListener("resize", onScroll, { passive: true });

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            window.removeEventListener("scroll", onScroll, { capture: true });
            window.removeEventListener("resize", onScroll);
        };
    }, [isExpanded]);

    // Close dropdown when clicking outside
    const handleBackdropClick = () => {
        setIsExpanded(false);
    };

    const unlockedCount = chain.filter((a) => a.isUnlocked).length;
    const totalPoints = chain.reduce((sum, a) => sum + (a.points || 0), 0);
    const earnedPoints = chain
        .filter((a) => a.isUnlocked)
        .reduce((sum, a) => sum + (a.points || 0), 0);

    const {
        name,
        description,
        points,
        icon,
        max_progress: maxProgress,
        currentProgress,
        isUnlocked,
        isAvailable,
        unlockedAt,
        progressPercent,
    } = currentAchievement;

    const showProgress = maxProgress > 1 && !isUnlocked;
    const displayIcon = icon || "🏆";
    const allCompleted = unlockedCount === chain.length;

    // Render the dropdown content
    const renderDropdown = () => {
        if (!isExpanded) return null;

        return createPortal(
            <>
                <DropdownBackdrop onClick={handleBackdropClick} />
                <DropdownOverlay ref={dropdownRef}>
                    <ExpandedSection>
                        <ChainTitle>
                            🏆 Chain Progress ({earnedPoints}/{totalPoints}{" "}
                            Points)
                        </ChainTitle>
                        <ChainList>
                            {chain.map((achievement, index) => (
                                <ChainItem
                                    key={achievement.id}
                                    achievement={achievement}
                                    index={index}
                                    currentAchievementId={currentAchievementId}
                                />
                            ))}
                        </ChainList>
                    </ExpandedSection>
                </DropdownOverlay>
            </>,
            document.body
        );
    };

    return (
        <Container $isUnlocked={allCompleted} ref={containerRef}>
            <MainCard onClick={() => setIsExpanded(!isExpanded)}>
                <IconContainer
                    $isUnlocked={isUnlocked}
                    $isAvailable={isAvailable}
                >
                    {!isAvailable && !isUnlocked ? (
                        <HiLockClosed />
                    ) : (
                        <span>{displayIcon}</span>
                    )}
                    {isUnlocked && (
                        <CheckBadge>
                            <HiCheck />
                        </CheckBadge>
                    )}
                </IconContainer>

                <Content>
                    <Header>
                        <div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.8rem",
                                    flexWrap: "wrap",
                                }}
                            >
                                <Name $isUnlocked={isUnlocked}>{name}</Name>
                                {currentReward && (
                                    <RewardBadge reward={currentReward} />
                                )}
                            </div>
                            <ChainIndicator>
                                <ChainBadge>
                                    🔗 {unlockedCount}/{chain.length}
                                </ChainBadge>
                                <ChainDots>
                                    {chain.map((a) => (
                                        <ChainDot
                                            key={a.id}
                                            $filled={a.isUnlocked}
                                        />
                                    ))}
                                </ChainDots>
                            </ChainIndicator>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.8rem",
                            }}
                        >
                            <Points $isUnlocked={isUnlocked}>
                                <HiOutlineTrophy />
                                {points}
                            </Points>
                            <ExpandIcon>
                                {isExpanded ? (
                                    <HiChevronUp />
                                ) : (
                                    <HiChevronDown />
                                )}
                            </ExpandIcon>
                        </div>
                    </Header>

                    <Description>{description}</Description>

                    {showProgress && isAvailable && (
                        <ProgressContainer>
                            <ProgressBar>
                                <ProgressFill
                                    $percent={progressPercent}
                                    $isComplete={isUnlocked}
                                />
                            </ProgressBar>
                            <ProgressText>
                                {currentProgress} / {maxProgress}
                            </ProgressText>
                        </ProgressContainer>
                    )}

                    {isUnlocked && unlockedAt && (
                        <UnlockedDate>
                            Unlocked:{" "}
                            {new Date(unlockedAt).toLocaleDateString()}
                        </UnlockedDate>
                    )}
                </Content>
            </MainCard>

            {renderDropdown()}
        </Container>
    );
}

export default AchievementChainCard;
