import styled, { css, keyframes } from "styled-components";
import { useState, useRef } from "react";
import { format } from "date-fns";
import {
    HiPencil,
    HiTrash,
    HiCheck,
    HiXMark,
    HiArrowUturnLeft,
} from "react-icons/hi2";
import { Link } from "react-router-dom";
import Avatar from "../../ui/Avatar";
import MentionText from "../../ui/MentionText";
import ReactionBar from "../matches/ReactionBar";
import SpinnerMini from "../../ui/SpinnerMini";
import { DEFAULT_AVATAR, MAX_CHAT_MESSAGE_LENGTH } from "../../utils/constants";

const highlightPulse = keyframes`
    0% {
        background-color: var(--primary-button-color-light);
        box-shadow: 0 0 0 0 var(--primary-button-color);
    }
    50% {
        background-color: var(--primary-button-color-light);
        box-shadow: 0 0 8px 2px var(--primary-button-color);
    }
    100% {
        background-color: transparent;
        box-shadow: 0 0 0 0 transparent;
    }
`;

const MessageContainer = styled.div`
    display: flex;
    gap: 1rem;
    padding: 0.8rem 1rem;
    border-radius: var(--border-radius-md);
    background-color: ${(props) =>
        props.$isWhisper
            ? "rgba(34, 197, 94, 0.1)"
            : "var(--secondary-background-color)"};
    transition: all 0.2s;
    position: relative;
    touch-action: pan-y;

    ${(props) =>
        props.$swipeOffset &&
        css`
            transform: translateX(${props.$swipeOffset}px);
        `}

    &:hover {
        background-color: ${(props) =>
            props.$isWhisper
                ? "rgba(34, 197, 94, 0.15)"
                : "var(--tertiary-background-color)"};
    }

    &.highlight {
        animation: ${highlightPulse} 2s ease-out;
    }
`;

const SwipeIndicator = styled.div`
    position: absolute;
    left: -4rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--primary-button-color);
    opacity: ${(props) => Math.min(props.$offset / 60, 1)};
    font-size: 2rem;
`;

const MessageContent = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
`;

const MessageHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
`;

const AuthorName = styled(Link)`
    font-weight: 600;
    font-size: 1.3rem;
    color: ${(props) =>
        props.$isWhisper
            ? "var(--color-green-500)"
            : "var(--primary-text-color)"};
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

const WhisperLabel = styled.span`
    font-size: 1.2rem;
    color: var(--color-green-500);
    font-style: italic;
`;

const Timestamp = styled.span`
    font-size: 1.1rem;
    color: var(--tertiary-text-color);
`;

const EditedLabel = styled.span`
    font-size: 1rem;
    color: var(--tertiary-text-color);
    font-style: italic;
`;

const ReplyPreview = styled.div`
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.4rem 0.8rem;
    margin-bottom: 0.4rem;
    background-color: var(--tertiary-background-color);
    border-left: 3px solid var(--primary-button-color);
    border-radius: 0 var(--border-radius-sm) var(--border-radius-sm) 0;
    font-size: 1.2rem;
    color: var(--secondary-text-color);
    cursor: pointer;

    &:hover {
        background-color: var(--primary-border-color);
    }
`;

const ReplyAuthor = styled.span`
    font-weight: 600;
    color: var(--primary-button-color);
`;

const ReplyContent = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 20rem;
`;

const MessageBody = styled.div`
    font-size: 1.4rem;
    color: ${(props) =>
        props.$isWhisper
            ? "var(--color-green-500)"
            : "var(--primary-text-color)"};
    line-height: 1.4;
    word-break: break-word;
    white-space: pre-wrap;
`;

const MessageActions = styled.div`
    display: flex;
    gap: 0.4rem;
    margin-left: auto;
    opacity: 0.3;
    transition: opacity 0.2s;

    ${MessageContainer}:hover & {
        opacity: 1;
    }
`;

const ActionButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    border: 1px solid var(--primary-border-color);
    background-color: var(--secondary-background-color);
    color: var(--secondary-text-color);
    cursor: pointer;
    border-radius: var(--border-radius-sm);
    transition: all 0.2s;

    &:hover:not(:disabled) {
        color: ${(props) =>
            props.$danger
                ? "var(--color-red-700)"
                : "var(--primary-button-color)"};
        background-color: var(--tertiary-background-color);
        border-color: ${(props) =>
            props.$danger
                ? "var(--color-red-700)"
                : "var(--primary-button-color)"};
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
    min-height: 4rem;
    padding: 0.6rem;
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--primary-input-border-color);
    background-color: var(--primary-input-background-color);
    color: var(--primary-text-color);
    font-family: inherit;
    font-size: 1.3rem;
    resize: vertical;
    outline: none;

    &:focus {
        border-color: var(--primary-input-border-color-active);
    }
`;

const EditActions = styled.div`
    display: flex;
    gap: 0.4rem;
    margin-top: 0.4rem;
`;

const EditCharCount = styled.span`
    font-size: 1.1rem;
    color: ${(props) =>
        props.$isOverLimit
            ? "var(--color-red-700)"
            : "var(--tertiary-text-color)"};
    margin-right: auto;
`;

const ReactionsRow = styled.div`
    margin-top: 0.4rem;
    position: relative;
    z-index: 10;

    /* Prevent touch events from propagating to parent (swipe handler) */
    touch-action: auto;

    & * {
        touch-action: auto;
    }
`;

function ChatMessage({
    message,
    currentPlayerId,
    isAdmin,
    onUpdate,
    onDelete,
    onReply,
    isUpdating,
    isDeleting,
    messageReactions,
    onToggleReaction,
    isTogglingReaction,
    onScrollToMessage,
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);
    const [swipeOffset, setSwipeOffset] = useState(0);
    const touchStartX = useRef(null);
    const containerRef = useRef(null);

    const isAuthor = message.player_id === currentPlayerId;
    const canEdit = isAuthor;
    const canDelete = isAdmin;
    const isWhisper = message.recipient_id !== null;

    const isOverLimit = editContent.length > MAX_CHAT_MESSAGE_LENGTH;

    function handleSaveEdit() {
        if (!editContent.trim() || editContent.length > MAX_CHAT_MESSAGE_LENGTH)
            return;
        onUpdate({ messageId: message.id, content: editContent.trim() });
        setIsEditing(false);
    }

    function handleCancelEdit() {
        setEditContent(message.content);
        setIsEditing(false);
    }

    function handleDelete() {
        onDelete(message.id);
    }

    function handleReplyClick() {
        onReply(message);
    }

    // Swipe to reply (mobile)
    function handleTouchStart(e) {
        // Don't start swipe if touching a button or interactive element
        const target = e.target;
        if (
            target.closest("button") ||
            target.closest("a") ||
            target.closest('[role="button"]') ||
            target.closest(".emoji-mart")
        ) {
            return;
        }
        touchStartX.current = e.touches[0].clientX;
    }

    function handleTouchMove(e) {
        if (touchStartX.current === null) return;
        const diff = e.touches[0].clientX - touchStartX.current;
        // Only allow swiping right
        if (diff > 0 && diff < 100) {
            setSwipeOffset(diff);
        }
    }

    function handleTouchEnd() {
        if (swipeOffset > 60) {
            // Trigger reply
            onReply(message);
        }
        setSwipeOffset(0);
        touchStartX.current = null;
    }

    function handleReplyPreviewClick() {
        if (message.reply_to?.id && onScrollToMessage) {
            onScrollToMessage(message.reply_to.id);
        }
    }

    // Strip @[name](id) pattern for preview
    function stripMentions(text) {
        return text?.replace(/@\[([^\]]+)\]\(\d+\)/g, "@$1") || "";
    }

    return (
        <MessageContainer
            ref={containerRef}
            $isWhisper={isWhisper}
            $swipeOffset={swipeOffset}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            data-message-id={message.id}
        >
            {swipeOffset > 0 && (
                <SwipeIndicator $offset={swipeOffset}>
                    <HiArrowUturnLeft />
                </SwipeIndicator>
            )}

            <Link to={`/user/${message.player?.name}/profile`}>
                <Avatar
                    $size="small"
                    src={message.player?.avatar || DEFAULT_AVATAR}
                    alt={message.player?.name}
                    $cursor="pointer"
                />
            </Link>

            <MessageContent>
                <MessageHeader>
                    <AuthorName
                        to={`/user/${message.player?.name}/profile`}
                        $isWhisper={isWhisper}
                    >
                        {message.player?.name}
                    </AuthorName>
                    {isWhisper && (
                        <WhisperLabel>
                            whispers to {message.recipient?.name}
                        </WhisperLabel>
                    )}
                    <Timestamp>
                        {format(new Date(message.created_at), "HH:mm")}
                    </Timestamp>
                    {message.edited_at && <EditedLabel>(edited)</EditedLabel>}

                    <MessageActions>
                        <ActionButton
                            onClick={handleReplyClick}
                            title="Reply"
                            disabled={isUpdating || isDeleting}
                        >
                            <HiArrowUturnLeft />
                        </ActionButton>
                        {canEdit && !isEditing && (
                            <ActionButton
                                onClick={() => setIsEditing(true)}
                                title="Edit message"
                                disabled={isUpdating || isDeleting}
                            >
                                <HiPencil />
                            </ActionButton>
                        )}
                        {canDelete && (
                            <ActionButton
                                $danger
                                onClick={handleDelete}
                                title="Delete message"
                                disabled={isUpdating || isDeleting}
                            >
                                {isDeleting ? <SpinnerMini /> : <HiTrash />}
                            </ActionButton>
                        )}
                    </MessageActions>
                </MessageHeader>

                {/* Reply preview */}
                {message.reply_to && (
                    <ReplyPreview onClick={handleReplyPreviewClick}>
                        <HiArrowUturnLeft style={{ fontSize: "1rem" }} />
                        <ReplyAuthor>
                            {message.reply_to.player?.name}
                        </ReplyAuthor>
                        <ReplyContent>
                            {stripMentions(message.reply_to.content)}
                        </ReplyContent>
                    </ReplyPreview>
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
                                {editContent.length} / {MAX_CHAT_MESSAGE_LENGTH}
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
                    <MessageBody $isWhisper={isWhisper}>
                        <MentionText content={message.content} />
                    </MessageBody>
                )}

                <ReactionsRow>
                    <ReactionBar
                        groupedReactions={messageReactions}
                        currentPlayerId={currentPlayerId}
                        onToggleReaction={(reactionType) =>
                            onToggleReaction({
                                messageId: message.id,
                                reactionType,
                            })
                        }
                        disabled={
                            isUpdating || isDeleting || isTogglingReaction
                        }
                    />
                </ReactionsRow>
            </MessageContent>
        </MessageContainer>
    );
}

export default ChatMessage;
