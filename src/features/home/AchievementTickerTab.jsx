import styled from "styled-components";
import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { HiOutlineTrophy, HiChevronDoubleDown } from "react-icons/hi2";
import { useAchievementFeed } from "./useAchievementFeed";
import AchievementTickerItem from "./AchievementTickerItem";
import LoadingSpinner from "../../ui/LoadingSpinner";
import SpinnerMini from "../../ui/SpinnerMini";
import JumpToLatestButton from "../../ui/JumpToLatestButton";
import { media } from "../../utils/constants";

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    position: relative;
    min-height: 0;
    overflow: hidden;
`;

const FeedContainer = styled.div`
    display: flex;
    flex-direction: column-reverse;
    gap: 0.8rem;
    overflow-y: auto;
    overflow-x: hidden;
    flex: 1;
    padding: 1rem;
    position: relative;

    /* Custom scrollbar */
    &::-webkit-scrollbar {
        width: 0.6rem;
    }

    &::-webkit-scrollbar-track {
        background: var(--tertiary-background-color);
        border-radius: var(--border-radius-sm);
    }

    &::-webkit-scrollbar-thumb {
        background: var(--primary-border-color);
        border-radius: var(--border-radius-sm);
    }

    &::-webkit-scrollbar-thumb:hover {
        background: var(--secondary-text-color);
    }
`;

const LoadMoreTrigger = styled.div`
    display: flex;
    justify-content: center;
    padding: 0.5rem;
    color: var(--tertiary-text-color);
    font-size: 1.2rem;
`;

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: 3rem;
    color: var(--tertiary-text-color);
    text-align: center;
    gap: 1rem;

    & svg {
        font-size: 4rem;
        opacity: 0.5;
    }
`;

const EmptyText = styled.p`
    font-size: 1.4rem;
`;

const NewAchievementsBadge = styled.span`
    position: absolute;
    top: -0.4rem;
    right: -0.4rem;
    background-color: var(--color-brand-500);
    color: white;
    padding: 0.2rem 0.5rem;
    border-radius: var(--border-radius-pill);
    font-size: 1rem;
    font-weight: 600;
    min-width: 1.8rem;
    text-align: center;
`;

function AchievementTickerTab() {
    const feedContainerRef = useRef(null);
    const loadMoreRef = useRef(null);
    const [showJumpToLatest, setShowJumpToLatest] = useState(false);
    const [newAchievementsCount, setNewAchievementsCount] = useState(0);
    const [hasInitiallyScrolled, setHasInitiallyScrolled] = useState(false);
    const prevGroupCountRef = useRef(0);
    const isNearBottomRef = useRef(true);
    const prevFirstGroupIdRef = useRef(null);

    // Hook for achievement feed
    const {
        groupedAchievements,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useAchievementFeed();

    // Track new achievements and auto-scroll
    useEffect(() => {
        if (!groupedAchievements?.length) return;

        const currentCount = groupedAchievements.length;
        const prevCount = prevGroupCountRef.current;
        const firstGroupId =
            groupedAchievements[0]?.matchId ||
            groupedAchievements[0]?.latestUnlockedAt;

        // Check if this is a new achievement (not from pagination)
        const isNewAchievement =
            prevCount > 0 &&
            currentCount > prevCount &&
            prevFirstGroupIdRef.current !== firstGroupId;

        if (isNewAchievement) {
            if (isNearBottomRef.current) {
                // Auto-scroll to show new achievement
                setTimeout(() => {
                    if (feedContainerRef.current) {
                        feedContainerRef.current.scrollTop = 0;
                    }
                }, 100);
            } else {
                // User is scrolled up, show badge
                setNewAchievementsCount((prev) => prev + 1);
            }
        }

        prevGroupCountRef.current = currentCount;
        prevFirstGroupIdRef.current = firstGroupId;
    }, [groupedAchievements]);

    // Handle scroll for showing/hiding jump to latest
    const handleScroll = useCallback(() => {
        if (!feedContainerRef.current) return;

        const { scrollTop } = feedContainerRef.current;
        // For column-reverse, scrollTop 0 = bottom, negative = scrolled up
        const distanceFromBottom = Math.abs(scrollTop);
        const threshold = 200;

        isNearBottomRef.current = distanceFromBottom < threshold;

        if (distanceFromBottom > threshold) {
            setShowJumpToLatest(true);
        } else {
            setShowJumpToLatest(false);
            setNewAchievementsCount(0);
        }
    }, []);

    // Infinite scroll - load more when scrolling to top
    useEffect(() => {
        if (!loadMoreRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0].isIntersecting &&
                    hasNextPage &&
                    !isFetchingNextPage
                ) {
                    fetchNextPage();
                }
            },
            {
                root: feedContainerRef.current,
                threshold: 0.1,
            }
        );

        observer.observe(loadMoreRef.current);

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Initial scroll
    useEffect(() => {
        if (
            !isLoading &&
            groupedAchievements?.length &&
            !hasInitiallyScrolled
        ) {
            setHasInitiallyScrolled(true);
            // Scroll to bottom (newest) - for column-reverse this is scrollTop = 0
            if (feedContainerRef.current) {
                feedContainerRef.current.scrollTop = 0;
            }
        }
    }, [isLoading, groupedAchievements?.length, hasInitiallyScrolled]);

    function handleJumpToLatest() {
        if (feedContainerRef.current) {
            feedContainerRef.current.scrollTop = 0;
        }
        setShowJumpToLatest(false);
        setNewAchievementsCount(0);
    }

    // Check which groups are new (for animation)
    const groupsWithNewFlag = useMemo(() => {
        return groupedAchievements.map((group) => ({
            ...group,
            // Mark as new if it has any achievement with isNew flag
            isNew: group.players.some((p) =>
                p.achievements.some((a) => a.isNew)
            ),
        }));
    }, [groupedAchievements]);

    // Loading state
    if (isLoading) {
        return (
            <ContentWrapper>
                <LoadingSpinner />
            </ContentWrapper>
        );
    }

    // Empty state
    if (!groupedAchievements?.length) {
        return (
            <ContentWrapper>
                <EmptyState>
                    <HiOutlineTrophy />
                    <EmptyText>
                        No achievements unlocked in this season yet.
                    </EmptyText>
                </EmptyState>
            </ContentWrapper>
        );
    }

    return (
        <ContentWrapper>
            <FeedContainer ref={feedContainerRef} onScroll={handleScroll}>
                {/* Load more trigger at the "top" (end in column-reverse) */}
                <LoadMoreTrigger ref={loadMoreRef}>
                    {isFetchingNextPage && <SpinnerMini />}
                    {!isFetchingNextPage && hasNextPage && "Scroll for more..."}
                </LoadMoreTrigger>

                {/* Achievement groups */}
                {groupsWithNewFlag.map((group) => (
                    <AchievementTickerItem
                        key={group.matchId || group.latestUnlockedAt}
                        group={group}
                        isNew={group.isNew}
                    />
                ))}
            </FeedContainer>

            {/* Jump to latest button */}
            {showJumpToLatest && (
                <JumpToLatestButton onClick={handleJumpToLatest}>
                    <HiChevronDoubleDown />
                    {newAchievementsCount > 0 && (
                        <NewAchievementsBadge>
                            {newAchievementsCount}
                        </NewAchievementsBadge>
                    )}
                </JumpToLatestButton>
            )}
        </ContentWrapper>
    );
}

export default AchievementTickerTab;
