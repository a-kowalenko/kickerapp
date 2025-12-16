import styled from "styled-components";
import { useState } from "react";
import { format } from "date-fns";
import { HiPencil, HiTrash, HiCheck, HiXMark } from "react-icons/hi2";
import { Link } from "react-router-dom";
import Avatar from "../../ui/Avatar";
import MentionText from "../../ui/MentionText";
import ReactionBar from "./ReactionBar";
import SpinnerMini from "../../ui/SpinnerMini";
import { DEFAULT_AVATAR, MAX_COMMENT_LENGTH } from "../../utils/constants";

const CommentContainer = styled.div`
    display: flex;
    gap: 1rem;
    padding: 1rem;
    border-radius: var(--border-radius-md);
    background-color: var(--secondary-background-color);
    transition: background-color 0.2s;

    &:hover {
        background-color: var(--tertiary-background-color);
    }
`;

const CommentContent = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 0;
`;

const CommentHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-wrap: wrap;
`;

const AuthorName = styled(Link)`
    font-weight: 600;
    font-size: 1.4rem;
    color: var(--primary-text-color);
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

const Timestamp = styled.span`
    font-size: 1.2rem;
    color: var(--tertiary-text-color);
`;

const EditedLabel = styled.span`
    font-size: 1.1rem;
    color: var(--tertiary-text-color);
    font-style: italic;
`;

const CommentBody = styled.div`
    font-size: 1.4rem;
    color: var(--primary-text-color);
    line-height: 1.5;
    word-break: break-word;
    white-space: pre-wrap;
`;

const CommentActions = styled.div`
    display: flex;
    gap: 0.4rem;
    margin-left: auto;
`;

const ActionButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.4rem;
    border: none;
    background-color: transparent;
    color: var(--tertiary-text-color);
    cursor: pointer;
    border-radius: var(--border-radius-sm);
    transition: all 0.2s;

    &:hover:not(:disabled) {
        color: ${(props) =>
            props.$danger
                ? "var(--color-red-700)"
                : "var(--primary-button-color)"};
        background-color: var(--tertiary-background-color);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    & svg {
        font-size: 1.4rem;
    }
`;

const EditTextArea = styled.textarea`
    width: 100%;
    min-height: 6rem;
    padding: 0.8rem;
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--primary-input-border-color);
    background-color: var(--primary-input-background-color);
    color: var(--primary-text-color);
    font-family: inherit;
    font-size: 1.4rem;
    resize: vertical;
    outline: none;

    &:focus {
        border-color: var(--primary-input-border-color-active);
    }
`;

const EditActions = styled.div`
    display: flex;
    gap: 0.6rem;
    margin-top: 0.6rem;
`;

const EditCharCount = styled.span`
    font-size: 1.2rem;
    color: ${(props) =>
        props.$isOverLimit
            ? "var(--color-red-700)"
            : "var(--tertiary-text-color)"};
    margin-right: auto;
`;

const ReactionsRow = styled.div`
    margin-top: 0.6rem;
`;

function Comment({
    comment,
    currentPlayerId,
    isAdmin,
    onUpdate,
    onDelete,
    isUpdating,
    isDeleting,
    commentReactions,
    onToggleReaction,
    isTogglingReaction,
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);

    const isAuthor = comment.player_id === currentPlayerId;
    const canEdit = isAuthor;
    const canDelete = isAdmin;

    const isOverLimit = editContent.length > MAX_COMMENT_LENGTH;

    function handleSaveEdit() {
        if (!editContent.trim() || editContent.length > MAX_COMMENT_LENGTH)
            return;
        onUpdate({ commentId: comment.id, content: editContent.trim() });
        setIsEditing(false);
    }

    function handleCancelEdit() {
        setEditContent(comment.content);
        setIsEditing(false);
    }

    function handleDelete() {
        onDelete(comment.id);
    }

    return (
        <CommentContainer>
            <Link to={`/players/${comment.player_id}`}>
                <Avatar
                    $size="small"
                    src={comment.player?.avatar || DEFAULT_AVATAR}
                    alt={comment.player?.name}
                    $cursor="pointer"
                />
            </Link>
            <CommentContent>
                <CommentHeader>
                    <AuthorName to={`/players/${comment.player_id}`}>
                        {comment.player?.name}
                    </AuthorName>
                    <Timestamp>
                        {format(
                            new Date(comment.created_at),
                            "dd.MM.yyyy HH:mm"
                        )}
                    </Timestamp>
                    {comment.edited_at && (
                        <EditedLabel>
                            (edited{" "}
                            {format(
                                new Date(comment.edited_at),
                                "dd.MM.yyyy HH:mm"
                            )}
                            )
                        </EditedLabel>
                    )}
                    <CommentActions>
                        {canEdit && !isEditing && (
                            <ActionButton
                                onClick={() => setIsEditing(true)}
                                title="Edit comment"
                                disabled={isUpdating || isDeleting}
                            >
                                <HiPencil />
                            </ActionButton>
                        )}
                        {canDelete && (
                            <ActionButton
                                $danger
                                onClick={handleDelete}
                                title="Delete comment"
                                disabled={isUpdating || isDeleting}
                            >
                                {isDeleting ? <SpinnerMini /> : <HiTrash />}
                            </ActionButton>
                        )}
                    </CommentActions>
                </CommentHeader>

                {isEditing ? (
                    <>
                        <EditTextArea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            autoFocus
                        />
                        <EditActions>
                            <EditCharCount $isOverLimit={isOverLimit}>
                                {editContent.length} / {MAX_COMMENT_LENGTH}
                            </EditCharCount>
                            <ActionButton
                                onClick={handleCancelEdit}
                                title="Cancel"
                                disabled={isUpdating}
                            >
                                <HiXMark />
                            </ActionButton>
                            <ActionButton
                                onClick={handleSaveEdit}
                                title="Save"
                                disabled={
                                    isUpdating ||
                                    !editContent.trim() ||
                                    isOverLimit
                                }
                            >
                                {isUpdating ? <SpinnerMini /> : <HiCheck />}
                            </ActionButton>
                        </EditActions>
                    </>
                ) : (
                    <CommentBody>
                        <MentionText content={comment.content} />
                    </CommentBody>
                )}

                <ReactionsRow>
                    <ReactionBar
                        groupedReactions={commentReactions}
                        currentPlayerId={currentPlayerId}
                        onToggleReaction={(reactionType) =>
                            onToggleReaction({
                                commentId: comment.id,
                                reactionType,
                            })
                        }
                        disabled={
                            isUpdating || isDeleting || isTogglingReaction
                        }
                    />
                </ReactionsRow>
            </CommentContent>
        </CommentContainer>
    );
}

export default Comment;
