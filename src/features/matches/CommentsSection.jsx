import styled from "styled-components";
import { useRef, useEffect, useMemo, useState } from "react";
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
    const { user } = useUser();

    const isAdmin = kickerData?.admin === user?.id;
    const currentPlayerId = currentPlayer?.id;

    // Scroll to bottom on initial load and when new comments are added
    useEffect(() => {
        if (!commentsContainerRef.current || !comments?.length) return;
        // Wait for comment reactions to load before initial scroll
        if (!hasInitiallyScrolled && isLoadingCommentReactions) return;

        const container = commentsContainerRef.current;

        // Initial scroll (without animation)
        if (!hasInitiallyScrolled && !isLoadingComments) {
            container.scrollTop = container.scrollHeight;
            setHasInitiallyScrolled(true);
            return;
        }

        // Scroll for new comments (with smooth animation)
        if (hasInitiallyScrolled) {
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
                            <Comment
                                key={comment.id}
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
                                onToggleReaction={handleToggleCommentReaction}
                                isTogglingReaction={isTogglingCommentReaction}
                                isGrouped={isGrouped}
                            />
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
