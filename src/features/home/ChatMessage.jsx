import styled, { css, keyframes } from "styled-components";
import { useState, useRef } from "react";
import { format } from "date-fns";
import {
    HiPencil,
    HiTrash,
    HiCheck,
    HiXMark,
    HiArrowUturnLeft,
    HiOutlineFaceSmile,
    HiPlus,
} from "react-icons/hi2";
import { Link } from "react-router-dom";
import Avatar from "../../ui/Avatar";
import MentionText from "../../ui/MentionText";
import SpinnerMini from "../../ui/SpinnerMini";
import EmojiPicker from "../../ui/EmojiPicker";
import { DEFAULT_AVATAR, MAX_CHAT_MESSAGE_LENGTH } from "../../utils/constants";

// Quick reaction emojis (Discord-style)
const QUICK_REACTIONS = ["❤️", "👍", "💩", "🤡"];

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
    padding: ${(props) =>
        props.$isGrouped ? "0.2rem 1rem 0.2rem 1rem" : "0.8rem 1rem"};
    padding-left: ${(props) => (props.$isGrouped ? "4.8rem" : "1rem")};
    border-radius: var(--border-radius-md);
    background-color: ${(props) =>
        props.$isWhisper
            ? "rgba(34, 197, 94, 0.1)"
            : "var(--secondary-background-color)"};
    transition: background-color 0.2s;
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
                ? "rgba(34, 197, 94, 0.2) !important"
                : "var(--tertiary-background-color) !important"};
    }

    &:hover {
        background-color: ${(props) =>
            props.$isWhisper
                ? "rgba(34, 197, 94, 0.2) !important"
                : "var(--tertiary-background-color) !important"};
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

// Discord-style hover toolbar - appears on message hover
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
    transition:
        opacity 0.15s,
        visibility 0.15s;
    z-index: 20;

    ${MessageContainer}:hover & {
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

const HoverTimestamp = styled.span`
    position: absolute;
    left: 0.5rem;
    font-size: 1rem;
    color: var(--tertiary-text-color);
    opacity: 0;
    transition: opacity 0.2s;

    ${MessageContainer}:hover & {
        opacity: 1;
    }
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

const EditActionButton = styled.button`
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
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.4rem;

    /* Prevent touch events from propagating to parent (swipe handler) */
    touch-action: auto;

    & * {
        touch-action: auto;
    }
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
    isGrouped = false,
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const touchStartX = useRef(null);
    const containerRef = useRef(null);
    const addReactionRef = useRef(null);

    const isAuthor = message.player_id === currentPlayerId;
    const canEdit = isAuthor;
    const canDelete = isAdmin;
    const isWhisper = message.recipient_id !== null;

    const isOverLimit = editContent.length > MAX_CHAT_MESSAGE_LENGTH;
    const reactionEntries = Object.values(messageReactions || {});
    const hasReactions = reactionEntries.length > 0;

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
            $isGrouped={isGrouped}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            data-message-id={message.id}
        >
            {/* Discord-style hover toolbar */}
            <HoverToolbar>
                {/* Quick reactions */}
                {QUICK_REACTIONS.map((emoji) => (
                    <QuickReactionButton
                        key={emoji}
                        onClick={() =>
                            onToggleReaction({
                                messageId: message.id,
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
                                    messageId: message.id,
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
                <ToolbarActionButton
                    onClick={handleReplyClick}
                    title="Reply"
                    disabled={isUpdating || isDeleting}
                >
                    <HiArrowUturnLeft />
                </ToolbarActionButton>
                {canEdit && !isEditing && (
                    <ToolbarActionButton
                        onClick={() => setIsEditing(true)}
                        title="Edit message"
                        disabled={isUpdating || isDeleting}
                    >
                        <HiPencil />
                    </ToolbarActionButton>
                )}
                {canDelete && (
                    <ToolbarActionButton
                        $danger
                        onClick={handleDelete}
                        title="Delete message"
                        disabled={isUpdating || isDeleting}
                    >
                        {isDeleting ? <SpinnerMini /> : <HiTrash />}
                    </ToolbarActionButton>
                )}
            </HoverToolbar>

            {swipeOffset > 0 && (
                <SwipeIndicator $offset={swipeOffset}>
                    <HiArrowUturnLeft />
                </SwipeIndicator>
            )}

            {/* Show hover timestamp for grouped messages */}
            {isGrouped && (
                <HoverTimestamp>
                    {format(new Date(message.created_at), "HH:mm")}
                </HoverTimestamp>
            )}

            {!isGrouped && (
                <Link to={`/user/${message.player?.name}/profile`}>
                    <Avatar
                        $size="small"
                        src={message.player?.avatar || DEFAULT_AVATAR}
                        alt={message.player?.name}
                        $cursor="pointer"
                    />
                </Link>
            )}

            <MessageContent>
                {!isGrouped && (
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
                        {message.edited_at && (
                            <EditedLabel>(edited)</EditedLabel>
                        )}
                    </MessageHeader>
                )}

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
                    <MessageBody $isWhisper={isWhisper}>
                        <MentionText content={message.content} />
                    </MessageBody>
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
                                            messageId: message.id,
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
            </MessageContent>
        </MessageContainer>
    );
}

export default ChatMessage;
