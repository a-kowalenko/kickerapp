import styled from "styled-components";
import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { HiChatBubbleLeftRight, HiChevronDoubleDown } from "react-icons/hi2";
import { useKickerComments } from "./useKickerComments";
import { useKickerCommentReactions } from "./useKickerCommentReactions";
import { useToggleKickerCommentReaction } from "./useToggleKickerCommentReaction";
import { useOwnPlayer } from "../../hooks/useOwnPlayer";
import { useUser } from "../authentication/useUser";
import { useKicker } from "../../contexts/KickerContext";
import { useCommentReadStatus } from "../../hooks/useCommentReadStatus";
import { updateCommentReadStatus } from "../../services/apiComments";
import useUnreadBadge from "../../hooks/useUnreadBadge";
import { useUnreadCommentCount } from "./useUnreadCommentCount";
import MatchCommentItem from "./MatchCommentItem";
import LoadingSpinner from "../../ui/LoadingSpinner";
import SpinnerMini from "../../ui/SpinnerMini";
import JumpToLatestButton from "../../ui/JumpToLatestButton";
import CountBadge from "../../ui/CountBadge";
import { media } from "../../utils/constants";

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    position: relative;
    min-height: 0;
    height: 100%;

    ${media.tablet} {
        /* No fixed height on mobile - let flex take over */
        padding-bottom: calc(2rem + env(safe-area-inset-bottom, 0px));
    }
`;

const CommentsContainer = styled.div`
    display: flex;
    flex-direction: column-reverse;
    gap: 0.4rem;
    overflow-y: auto;
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

function MatchCommentsTab() {
    const commentsContainerRef = useRef(null);
    const loadMoreRef = useRef(null);
    const [showJumpToLatest, setShowJumpToLatest] = useState(false);
    const [newCommentsCount, setNewCommentsCount] = useState(0);
    const [hasInitiallyScrolled, setHasInitiallyScrolled] = useState(false);
    const prevCommentCountRef = useRef(0);
    const isNearBottomRef = useRef(true);
    const prevFirstCommentIdRef = useRef(null);
    const hasMarkedAsReadRef = useRef(false);

    // Hooks
    const {
        comments,
        isLoading: isLoadingComments,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useKickerComments();

    // User/Player info
    const { data: currentPlayer } = useOwnPlayer();
    const { user } = useUser();
    const { currentKicker } = useKicker();
    const currentPlayerId = currentPlayer?.id;

    // Unread badge hooks
    const { invalidateUnreadBadge } = useUnreadBadge(user?.id);
    const { invalidate: invalidateUnreadCount } = useUnreadCommentCount();

    // Get read status for unread markers
    const { lastReadAt, invalidate: invalidateCommentReadStatus } =
        useCommentReadStatus(currentKicker);

    // Mark comments as read
    const markAsRead = useCallback(async () => {
        if (!currentKicker) return;
        try {
            await updateCommentReadStatus(currentKicker);
            invalidateUnreadCount();
            invalidateUnreadBadge();
            // Invalidate comment read status so unread markers update immediately
            invalidateCommentReadStatus();
        } catch (error) {
            console.error("Error marking comments as read:", error);
        }
    }, [
        currentKicker,
        invalidateUnreadCount,
        invalidateUnreadBadge,
        invalidateCommentReadStatus,
    ]);

    // Get comment IDs for reactions
    const commentIds = useMemo(
        () => comments?.map((c) => c.id) || [],
        [comments],
    );
    const {
        groupedByComment: commentReactionsMap,
        isLoading: isLoadingReactions,
    } = useKickerCommentReactions(commentIds);
    const { toggleReaction, isToggling: isTogglingReaction } =
        useToggleKickerCommentReaction();

    // Handle scroll for showing/hiding jump to latest
    const handleScroll = useCallback(() => {
        const container = commentsContainerRef.current;
        if (!container) return;

        const threshold = 100;
        // With column-reverse, scrollTop increases as user scrolls UP
        const nearBottom = Math.abs(container.scrollTop) < threshold;
        const wasNearBottom = isNearBottomRef.current;
        isNearBottomRef.current = nearBottom;

        if (nearBottom) {
            setShowJumpToLatest(false);
            setNewCommentsCount(0);
            // Mark as read when scrolling to bottom
            if (!wasNearBottom && currentKicker) {
                markAsRead();
            }
        } else {
            setShowJumpToLatest(true);
        }
    }, [currentKicker, markAsRead]);

    // Infinite scroll - load more when scrolling to top
    useEffect(() => {
        const container = commentsContainerRef.current;
        if (!container || !hasNextPage) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { root: container, threshold: 0.1 },
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Track new comments and auto-scroll if near bottom
    useEffect(() => {
        if (!comments.length) return;

        const currentFirstCommentId = comments[0]?.id;
        const newCount = comments.length - prevCommentCountRef.current;

        const hasNewRecentComments =
            newCount > 0 &&
            prevCommentCountRef.current > 0 &&
            currentFirstCommentId !== prevFirstCommentIdRef.current;

        if (hasNewRecentComments) {
            const container = commentsContainerRef.current;
            const threshold = 100;
            const isCurrentlyNearBottom = container
                ? Math.abs(container.scrollTop) < threshold
                : true;

            if (isCurrentlyNearBottom) {
                if (container) {
                    setTimeout(() => {
                        container.scrollTop = 0;
                    }, 50);
                }
            } else {
                setNewCommentsCount((prev) => prev + newCount);
            }
        }

        prevCommentCountRef.current = comments.length;
        prevFirstCommentIdRef.current = currentFirstCommentId;
    }, [comments]);

    // Initial scroll
    useEffect(() => {
        if (isLoadingComments || !comments.length || hasInitiallyScrolled)
            return;

        if (isLoadingReactions) return;

        const container = commentsContainerRef.current;
        if (container) {
            container.scrollTop = 0;
            prevCommentCountRef.current = comments.length;
            setHasInitiallyScrolled(true);
        }
    }, [
        isLoadingComments,
        isLoadingReactions,
        comments.length,
        hasInitiallyScrolled,
    ]);

    // Mark as read after initial scroll with delay (only once)
    useEffect(() => {
        if (
            hasInitiallyScrolled &&
            currentKicker &&
            isNearBottomRef.current &&
            !hasMarkedAsReadRef.current
        ) {
            hasMarkedAsReadRef.current = true;
            const timer = setTimeout(async () => {
                if (isNearBottomRef.current) {
                    try {
                        await updateCommentReadStatus(currentKicker);
                        invalidateUnreadCount();
                        invalidateUnreadBadge();
                    } catch (error) {
                        console.error("Error marking comments as read:", error);
                    }
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [
        hasInitiallyScrolled,
        currentKicker,
        invalidateUnreadCount,
        invalidateUnreadBadge,
    ]);

    function handleJumpToLatest() {
        const container = commentsContainerRef.current;
        if (container) {
            container.scrollTop = 0;
        }
        setShowJumpToLatest(false);
        setNewCommentsCount(0);
    }

    function handleToggleReaction({ commentId, reactionType }) {
        if (!currentPlayerId) return;
        toggleReaction({
            commentId,
            playerId: currentPlayerId,
            reactionType,
        });
    }

    // Helper to determine if a comment should be grouped with the visually previous one
    // Conditions: same player, same match, within 10 minutes
    function shouldGroupWithPrevious(currentComment, prevComment) {
        // Must be from the same player
        if (currentComment.player_id !== prevComment.player_id) return false;

        // Must be from the same match
        if (currentComment.match_id !== prevComment.match_id) return false;

        // Check time difference - group if within 10 minutes
        const currentTime = new Date(currentComment.created_at);
        const prevTime = new Date(prevComment.created_at);
        const timeDiffMinutes = Math.abs(currentTime - prevTime) / (1000 * 60);

        return timeDiffMinutes <= 10;
    }

    if (isLoadingComments) {
        return (
            <ContentWrapper>
                <EmptyState>
                    <LoadingSpinner />
                </EmptyState>
            </ContentWrapper>
        );
    }

    return (
        <ContentWrapper>
            <CommentsContainer
                ref={commentsContainerRef}
                onScroll={handleScroll}
            >
                {comments?.length === 0 ? (
                    <EmptyState>
                        <HiChatBubbleLeftRight />
                        <EmptyText>
                            No match comments yet.
                            <br />
                            Comments from matches will appear here.
                        </EmptyText>
                    </EmptyState>
                ) : (
                    <>
                        {/* Comments - with column-reverse, first item appears at bottom */}
                        {comments?.map((comment, index) => {
                            // Check if this comment should be grouped with the one below it (visually previous)
                            // In column-reverse, index 0 is newest (bottom), index+1 is older (above)
                            const nextComment = comments[index + 1];
                            const isGrouped =
                                nextComment &&
                                shouldGroupWithPrevious(comment, nextComment);

                            // Comment is unread if:
                            // - Created after lastReadAt
                            // - Not from the current user
                            const isUnread =
                                comment.player_id !== currentPlayerId &&
                                lastReadAt &&
                                new Date(comment.created_at) >
                                    new Date(lastReadAt);

                            return (
                                <MatchCommentItem
                                    key={comment.id}
                                    comment={comment}
                                    currentPlayerId={currentPlayerId}
                                    commentReactions={
                                        commentReactionsMap[comment.id] || {}
                                    }
                                    onToggleReaction={handleToggleReaction}
                                    isTogglingReaction={isTogglingReaction}
                                    isGrouped={isGrouped}
                                    isUnread={isUnread}
                                />
                            );
                        })}
                        {/* Load more trigger - with column-reverse, last item appears at top */}
                        {hasNextPage && (
                            <LoadMoreTrigger ref={loadMoreRef}>
                                {isFetchingNextPage ? (
                                    <SpinnerMini />
                                ) : (
                                    "Scroll up for more comments"
                                )}
                            </LoadMoreTrigger>
                        )}
                    </>
                )}
            </CommentsContainer>

            {/* Jump to latest button */}
            {showJumpToLatest && (
                <JumpToLatestButton onClick={handleJumpToLatest}>
                    <HiChevronDoubleDown />
                    <CountBadge
                        count={newCommentsCount}
                        size="sm"
                        position="absolute"
                        top="-0.4rem"
                        right="-0.4rem"
                    />
                </JumpToLatestButton>
            )}
        </ContentWrapper>
    );
}

export default MatchCommentsTab;
