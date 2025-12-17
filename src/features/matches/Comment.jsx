import styled from "styled-components";
import { useState, useRef } from "react";
import { format } from "date-fns";
import {
    HiPencil,
    HiTrash,
    HiCheck,
    HiXMark,
    HiOutlineFaceSmile,
    HiPlus,
} from "react-icons/hi2";
import { Link } from "react-router-dom";
import Avatar from "../../ui/Avatar";
import MentionText from "../../ui/MentionText";
import SpinnerMini from "../../ui/SpinnerMini";
import EmojiPicker from "../../ui/EmojiPicker";
import { DEFAULT_AVATAR, MAX_COMMENT_LENGTH } from "../../utils/constants";

// Quick reaction emojis (Discord-style)
const QUICK_REACTIONS = ["❤️", "👍", "💩", "🤡"];

const CommentContainer = styled.div`
    display: flex;
    gap: 1rem;
    padding: ${(props) => (props.$isGrouped ? "0.2rem 1rem" : "1rem")};
    padding-left: ${(props) => (props.$isGrouped ? "5.4rem" : "1rem")};
    border-radius: var(--border-radius-md);
    background-color: ${(props) =>
        props.$disableHover
            ? "transparent"
            : "var(--secondary-background-color)"};
    transition: background-color 0.2s;
    position: relative;

    &:hover {
        background-color: ${(props) =>
            props.$disableHover
                ? "transparent"
                : "var(--tertiary-background-color)"};
    }
`;

const CommentContent = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 0;
`;

// Discord-style hover toolbar
const HoverToolbar = styled.div`
    position: absolute;
    top: -1.2rem;
    right: 1rem;
    display: flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.3rem;
    background-color: var(--secondary-background-color);
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-md);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.15s, visibility 0.15s;
    z-index: 20;

    ${CommentContainer}:hover & {
        opacity: 1;
        visibility: visible;
    }
`;

const ToolbarDivider = styled.div`
    width: 1px;
    height: 1.6rem;
    background-color: var(--primary-border-color);
    margin: 0 0.2rem;
`;

const QuickReactionButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.8rem;
    height: 2.8rem;
    border: none;
    background-color: transparent;
    cursor: pointer;
    border-radius: var(--border-radius-sm);
    font-size: 1.4rem;
    transition: all 0.15s;

    &:hover:not(:disabled) {
        background-color: var(--tertiary-background-color);
        transform: scale(1.15);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const ToolbarActionButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.8rem;
    height: 2.8rem;
    border: none;
    background-color: transparent;
    color: var(--secondary-text-color);
    cursor: pointer;
    border-radius: var(--border-radius-sm);
    transition: all 0.15s;

    &:hover:not(:disabled) {
        background-color: var(--tertiary-background-color);
        color: ${(props) =>
            props.$danger
                ? "var(--color-red-700)"
                : "var(--primary-button-color)"};
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    & svg {
        font-size: 1.6rem;
    }
`;

const AddReactionWrapper = styled.div`
    position: relative;
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

const HoverTimestamp = styled.span`
    position: absolute;
    left: 1.5rem;
    top: 0.4rem;
    font-size: 1rem;
    color: var(--tertiary-text-color);
    opacity: 0;
    transition: opacity 0.2s;

    ${CommentContainer}:hover & {
        opacity: 1;
    }
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

const EditActionButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.4rem;
    border: 1px solid var(--primary-border-color);
    background-color: var(--secondary-background-color);
    color: var(--secondary-text-color);
    cursor: pointer;
    border-radius: var(--border-radius-sm);
    transition: all 0.2s;

    &:hover:not(:disabled) {
        color: var(--primary-button-color);
        background-color: var(--tertiary-background-color);
        border-color: var(--primary-button-color);
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
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.4rem;
`;

const ReactionBadge = styled.button`
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.2rem 0.6rem;
    border-radius: var(--border-radius-sm);
    border: 1px solid
        ${(props) =>
            props.$isActive
                ? "var(--primary-button-color)"
                : "var(--primary-border-color)"};
    background-color: ${(props) =>
        props.$isActive
            ? "var(--primary-button-color-light)"
            : "var(--secondary-background-color)"};
    cursor: pointer;
    font-size: 1.3rem;
    transition: all 0.2s;

    &:hover:not(:disabled) {
        border-color: var(--primary-button-color);
        background-color: var(--primary-button-color-light);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const ReactionEmoji = styled.span`
    font-size: 1.4rem;
`;

const ReactionCount = styled.span`
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--primary-text-color);
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
    isGrouped = false,
    disableHover = false,
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const addReactionRef = useRef(null);

    const isAuthor = comment.player_id === currentPlayerId;
    const canEdit = isAuthor;
    const canDelete = isAdmin;

    const isOverLimit = editContent.length > MAX_COMMENT_LENGTH;
    const reactionEntries = Object.values(commentReactions || {});
    const hasReactions = reactionEntries.length > 0;

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
        <CommentContainer $isGrouped={isGrouped} $disableHover={disableHover}>
            {/* Discord-style hover toolbar */}
            <HoverToolbar>
                {/* Quick reactions */}
                {QUICK_REACTIONS.map((emoji) => (
                    <QuickReactionButton
                        key={emoji}
                        onClick={() =>
                            onToggleReaction({
                                commentId: comment.id,
                                reactionType: emoji,
                            })
                        }
                        disabled={
                            isUpdating || isDeleting || isTogglingReaction
                        }
                        title={`React with ${emoji}`}
                    >
                        {emoji}
                    </QuickReactionButton>
                ))}
                <AddReactionWrapper>
                    <QuickReactionButton
                        ref={addReactionRef}
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        disabled={
                            isUpdating || isDeleting || isTogglingReaction
                        }
                        title="Add reaction"
                    >
                        <HiOutlineFaceSmile />
                        <HiPlus
                            style={{
                                fontSize: "0.8rem",
                                marginLeft: "-0.2rem",
                            }}
                        />
                    </QuickReactionButton>
                    {showEmojiPicker && (
                        <EmojiPicker
                            onSelect={(emoji) => {
                                onToggleReaction({
                                    commentId: comment.id,
                                    reactionType: emoji,
                                });
                                setShowEmojiPicker(false);
                            }}
                            onClose={() => setShowEmojiPicker(false)}
                            position="bottom"
                            align="right"
                            triggerRef={addReactionRef}
                        />
                    )}
                </AddReactionWrapper>

                <ToolbarDivider />

                {/* Action buttons */}
                {canEdit && !isEditing && (
                    <ToolbarActionButton
                        onClick={() => setIsEditing(true)}
                        title="Edit comment"
                        disabled={isUpdating || isDeleting}
                    >
                        <HiPencil />
                    </ToolbarActionButton>
                )}
                {canDelete && (
                    <ToolbarActionButton
                        $danger
                        onClick={handleDelete}
                        title="Delete comment"
                        disabled={isUpdating || isDeleting}
                    >
                        {isDeleting ? <SpinnerMini /> : <HiTrash />}
                    </ToolbarActionButton>
                )}
            </HoverToolbar>

            {/* Show hover timestamp for grouped comments */}
            {isGrouped && (
                <HoverTimestamp>
                    {format(new Date(comment.created_at), "HH:mm")}
                </HoverTimestamp>
            )}

            {!isGrouped && (
                <Link to={`/players/${comment.player_id}`}>
                    <Avatar
                        $size="small"
                        src={comment.player?.avatar || DEFAULT_AVATAR}
                        alt={comment.player?.name}
                        $cursor="pointer"
                    />
                </Link>
            )}
            <CommentContent>
                {!isGrouped && (
                    <CommentHeader>
                        <AuthorName to={`/players/${comment.player_id}`}>
                            {comment.player?.name}
                        </AuthorName>
                        <Timestamp>
                            {format(
                                new Date(comment.created_at),
                                new Date(comment.created_at).getDate() ===
                                    new Date().getDate()
                                    ? "HH:mm"
                                    : "dd.MM.yyyy - HH:mm"
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
                    </CommentHeader>
                )}

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
                            <EditActionButton
                                onClick={handleCancelEdit}
                                title="Cancel"
                                disabled={isUpdating}
                            >
                                <HiXMark />
                            </EditActionButton>
                            <EditActionButton
                                onClick={handleSaveEdit}
                                title="Save"
                                disabled={
                                    isUpdating ||
                                    !editContent.trim() ||
                                    isOverLimit
                                }
                            >
                                {isUpdating ? <SpinnerMini /> : <HiCheck />}
                            </EditActionButton>
                        </EditActions>
                    </>
                ) : (
                    <CommentBody>
                        <MentionText content={comment.content} />
                    </CommentBody>
                )}

                {/* Only show existing reactions (no add button) */}
                {hasReactions && (
                    <ReactionsRow>
                        {reactionEntries.map((reaction) => {
                            const isActive =
                                reaction.playerIds.includes(currentPlayerId);
                            const playerNames = reaction.players
                                .map((p) => p.name)
                                .join(", ");

                            return (
                                <ReactionBadge
                                    key={reaction.type}
                                    $isActive={isActive}
                                    onClick={() =>
                                        onToggleReaction({
                                            commentId: comment.id,
                                            reactionType: reaction.type,
                                        })
                                    }
                                    title={playerNames}
                                    disabled={
                                        isUpdating ||
                                        isDeleting ||
                                        isTogglingReaction
                                    }
                                >
                                    <ReactionEmoji>
                                        {reaction.type}
                                    </ReactionEmoji>
                                    <ReactionCount>
                                        {reaction.count}
                                    </ReactionCount>
                                </ReactionBadge>
                            );
                        })}
                    </ReactionsRow>
                )}
            </CommentContent>
        </CommentContainer>
    );
}

export default Comment;
