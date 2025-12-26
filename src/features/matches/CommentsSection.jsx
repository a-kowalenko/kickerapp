import styled from "styled-components";
import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useParams } from "react-router-dom";
import { HiChatBubbleLeftRight } from "react-icons/hi2";
import { useComments } from "./useComments";
import { useCreateComment } from "./useCreateComment";
import { useUpdateComment } from "./useUpdateComment";
import { useDeleteComment } from "./useDeleteComment";
import { useMatchReactions } from "./useMatchReactions";
import { useCommentReactions } from "./useCommentReactions";
import {
    useToggleMatchReaction,
    useToggleCommentReaction,
} from "./useToggleReaction";
import { useOwnPlayer } from "../../hooks/useOwnPlayer";
import { useKickerInfo } from "../../hooks/useKickerInfo";
import { useUser } from "../authentication/useUser";
import { updateMatchCommentReadStatus } from "../../services/apiComments";
import useUnreadBadge from "../../hooks/useUnreadBadge";
import Comment from "./Comment";
import CommentInput from "./CommentInput";
import ReactionBar from "./ReactionBar";
import LoadingSpinner from "../../ui/LoadingSpinner";
import Divider from "../../ui/Divider";

const SectionContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    height: 100%;
    min-width: 30rem;
`;

const SectionHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    font-weight: 600;
    font-size: 1.6rem;
    color: var(--primary-text-color);
    text-transform: uppercase;

    & svg {
        font-size: 2rem;
    }
`;

const MatchReactionsContainer = styled.div`
    padding: 1rem;
    background-color: var(--secondary-background-color);
    border-radius: var(--border-radius-md);
    border: 1px solid var(--primary-border-color);
`;

const MatchReactionsLabel = styled.span`
    font-size: 1.2rem;
    color: var(--tertiary-text-color);
    margin-bottom: 0.6rem;
    display: block;
`;

const CommentsContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    overflow-y: auto;
    flex: 1;
    max-height: ${(props) => props.$maxHeight || "40rem"};
    padding-right: 0.4rem;

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

    /* Highlight animation for deep-linked comments */
    & [data-comment-id].highlight {
        animation: highlightPulse 2s ease-out;
    }

    @keyframes highlightPulse {
        0% {
            background-color: var(--primary-button-color-light);
        }
        100% {
            background-color: transparent;
        }
    }
`;

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
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

function CommentsSection({ maxHeight }) {
    const commentsContainerRef = useRef(null);
    const [hasInitiallyScrolled, setHasInitiallyScrolled] = useState(false);
    const [hasScrolledToDeepLink, setHasScrolledToDeepLink] = useState(false);
    const hasMarkedAsReadRef = useRef(false);
    const location = useLocation();
    const { matchId } = useParams();
    const { user } = useUser();
    const { invalidateUnreadBadge } = useUnreadBadge(user?.id);

    // Hooks
    const { comments, isLoading: isLoadingComments } = useComments();
    const { createComment, isCreating } = useCreateComment();
    const { updateComment, isUpdating } = useUpdateComment();
    const { deleteComment, isDeleting } = useDeleteComment();
    const { groupedReactions: matchReactions } = useMatchReactions();
    const {
        toggleReaction: toggleMatchReaction,
        isToggling: isTogglingMatchReaction,
    } = useToggleMatchReaction();
    const {
        toggleReaction: toggleCommentReaction,
        isToggling: isTogglingCommentReaction,
    } = useToggleCommentReaction();

    // Get comment IDs for fetching comment reactions
    const commentIds = useMemo(
        () => comments?.map((c) => c.id) || [],
        [comments]
    );
    const {
        groupedByComment: commentReactionsMap,
        isLoading: isLoadingCommentReactions,
    } = useCommentReactions(commentIds);

    // User/Player info
    const { data: currentPlayer } = useOwnPlayer();
    const { data: kickerData } = useKickerInfo();

    const isAdmin = kickerData?.admin === user?.id;
    const currentPlayerId = currentPlayer?.id;

    // Parse deep link from URL hash (e.g., #comment-123)
    const deepLinkCommentId = useMemo(() => {
        const hash = location.hash;
        if (hash && hash.startsWith("#comment-")) {
            return hash.replace("#comment-", "");
        }
        return null;
    }, [location.hash]);

    // Scroll to deep-linked comment
    const scrollToComment = useCallback((commentId) => {
        const container = commentsContainerRef.current;
        if (!container) return;

        const commentElement = container.querySelector(
            `[data-comment-id="${commentId}"]`
        );
        if (commentElement) {
            commentElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
            // Add highlight effect
            commentElement.classList.add("highlight");
            setTimeout(() => {
                commentElement.classList.remove("highlight");
            }, 2000);
        }
    }, []);

    // Mark comments as read when viewing this section (match-specific)
    const markCommentsAsRead = useCallback(async () => {
        if (!matchId || hasMarkedAsReadRef.current) return;
        hasMarkedAsReadRef.current = true;
        try {
            await updateMatchCommentReadStatus(Number(matchId));
            // Invalidate global badge to update browser tab title and PWA badge
            invalidateUnreadBadge();
        } catch (error) {
            console.error("Error marking match comments as read:", error);
            hasMarkedAsReadRef.current = false; // Allow retry on error
        }
    }, [matchId, invalidateUnreadBadge]);

    // Handle scroll - mark as read when scrolling to bottom
    const handleScroll = useCallback(() => {
        const container = commentsContainerRef.current;
        if (!container || hasMarkedAsReadRef.current) return;

        const threshold = 100;
        // Check if near bottom (scrollTop + clientHeight >= scrollHeight - threshold)
        const nearBottom =
            container.scrollTop + container.clientHeight >=
            container.scrollHeight - threshold;

        if (nearBottom) {
            markCommentsAsRead();
        }
    }, [markCommentsAsRead]);

    // Mark as read when comments are loaded and user is viewing
    useEffect(() => {
        if (
            !isLoadingComments &&
            comments?.length > 0 &&
            hasInitiallyScrolled
        ) {
            // Small delay to ensure user is actually viewing
            const timer = setTimeout(() => {
                markCommentsAsRead();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [
        isLoadingComments,
        comments?.length,
        hasInitiallyScrolled,
        markCommentsAsRead,
    ]);

    // Scroll to bottom on initial load and when new comments are added
    useEffect(() => {
        if (!commentsContainerRef.current || !comments?.length) return;
        // Wait for comment reactions to load before initial scroll
        if (!hasInitiallyScrolled && isLoadingCommentReactions) return;

        const container = commentsContainerRef.current;

        // Initial scroll (without animation)
        if (!hasInitiallyScrolled && !isLoadingComments) {
            // If there's a deep link, scroll to that comment instead
            if (deepLinkCommentId && !hasScrolledToDeepLink) {
                setHasInitiallyScrolled(true);
                setHasScrolledToDeepLink(true);
                // Small delay to ensure DOM is ready
                setTimeout(() => {
                    scrollToComment(deepLinkCommentId);
                }, 100);
            } else {
                container.scrollTop = container.scrollHeight;
                setHasInitiallyScrolled(true);
            }
            return;
        }

        // Scroll for new comments (with smooth animation)
        if (hasInitiallyScrolled && !deepLinkCommentId) {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [
        comments?.length,
        isLoadingComments,
        isLoadingCommentReactions,
        hasInitiallyScrolled,
        deepLinkCommentId,
        hasScrolledToDeepLink,
        scrollToComment,
    ]);

    function handleCreateComment(content) {
        if (!currentPlayerId) return;
        createComment({ playerId: currentPlayerId, content });
    }

    function handleToggleMatchReaction(reactionType) {
        if (!currentPlayerId) return;
        toggleMatchReaction({ playerId: currentPlayerId, reactionType });
    }

    function handleToggleCommentReaction({ commentId, reactionType }) {
        if (!currentPlayerId) return;
        toggleCommentReaction({
            commentId,
            playerId: currentPlayerId,
            reactionType,
        });
    }

    // Helper to determine if a comment should be grouped with the previous one
    // (i.e., hide avatar/name/timestamp for consecutive comments from same user)
    function shouldGroupWithPrevious(currentComment, prevComment) {
        // Must be from the same player
        if (currentComment.player_id !== prevComment.player_id) return false;

        // Check time difference - group if within 10 minutes
        const currentTime = new Date(currentComment.created_at);
        const prevTime = new Date(prevComment.created_at);
        const timeDiffMinutes = Math.abs(currentTime - prevTime) / (1000 * 60);

        return timeDiffMinutes <= 10;
    }

    if (isLoadingComments) {
        return (
            <SectionContainer>
                <SectionHeader>
                    <HiChatBubbleLeftRight />
                    Comments
                </SectionHeader>
                <LoadingSpinner />
            </SectionContainer>
        );
    }

    return (
        <SectionContainer>
            <SectionHeader>
                <HiChatBubbleLeftRight />
                Comments ({comments?.length || 0})
            </SectionHeader>

            {/* Match Reactions */}
            <MatchReactionsContainer>
                <MatchReactionsLabel>React to this match</MatchReactionsLabel>
                <ReactionBar
                    groupedReactions={matchReactions}
                    currentPlayerId={currentPlayerId}
                    onToggleReaction={handleToggleMatchReaction}
                    disabled={!currentPlayerId || isTogglingMatchReaction}
                />
            </MatchReactionsContainer>

            <Divider $variation="horizontal" />

            {/* Comments List */}
            <CommentsContainer
                ref={commentsContainerRef}
                $maxHeight={maxHeight}
                onScroll={handleScroll}
            >
                {comments?.length === 0 ? (
                    <EmptyState>
                        <HiChatBubbleLeftRight />
                        <EmptyText>
                            No comments yet.
                            <br />
                            Be the first to comment!
                        </EmptyText>
                    </EmptyState>
                ) : (
                    comments?.map((comment, index) => {
                        // Check if this comment should be grouped with the one above it
                        const prevComment = comments[index - 1];
                        const isGrouped =
                            prevComment &&
                            shouldGroupWithPrevious(comment, prevComment);

                        return (
                            <div key={comment.id} data-comment-id={comment.id}>
                                <Comment
                                    comment={comment}
                                    currentPlayerId={currentPlayerId}
                                    isAdmin={isAdmin}
                                    onUpdate={updateComment}
                                    onDelete={deleteComment}
                                    isUpdating={isUpdating}
                                    isDeleting={isDeleting}
                                    commentReactions={
                                        commentReactionsMap[comment.id] || {}
                                    }
                                    onToggleReaction={
                                        handleToggleCommentReaction
                                    }
                                    isTogglingReaction={
                                        isTogglingCommentReaction
                                    }
                                    isGrouped={isGrouped}
                                />
                            </div>
                        );
                    })
                )}
            </CommentsContainer>

            {/* Comment Input */}
            {currentPlayer && (
                <CommentInput
                    onSubmit={handleCreateComment}
                    isSubmitting={isCreating}
                    currentPlayer={currentPlayer}
                />
            )}
        </SectionContainer>
    );
}

export default CommentsSection;
