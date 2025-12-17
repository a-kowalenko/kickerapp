import styled from "styled-components";
import { useState, useRef, useEffect, useMemo } from "react";
import { HiOutlineFaceSmile, HiPaperAirplane, HiXMark } from "react-icons/hi2";
import { PiGifBold } from "react-icons/pi";
import { usePlayers } from "../../hooks/usePlayers";
import { MAX_CHAT_MESSAGE_LENGTH, DEFAULT_AVATAR } from "../../utils/constants";
import Avatar from "../../ui/Avatar";
import EmojiPicker from "../../ui/EmojiPicker";
import GifPicker from "../../ui/GifPicker";
import SpinnerMini from "../../ui/SpinnerMini";
import MentionText from "../../ui/MentionText";
import RichTextInput from "../../ui/RichTextInput";

const InputContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    padding: 1rem;
    background-color: var(--secondary-background-color);
    border-top: 1px solid var(--primary-border-color);
`;

const ReplyBanner = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 1rem;
    background-color: var(--tertiary-background-color);
    border-radius: var(--border-radius-sm);
    border-left: 3px solid var(--primary-button-color);
`;

const ReplyContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    flex: 1;
    min-width: 0;
`;

const ReplyLabel = styled.span`
    font-size: 1.1rem;
    color: var(--primary-button-color);
    font-weight: 600;
`;

const ReplyText = styled.span`
    font-size: 1.2rem;
    color: var(--secondary-text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const CloseReplyButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.4rem;
    border: none;
    background: transparent;
    color: var(--tertiary-text-color);
    cursor: pointer;
    border-radius: var(--border-radius-sm);

    &:hover {
        color: var(--primary-text-color);
        background-color: var(--secondary-background-color);
    }

    & svg {
        font-size: 1.6rem;
    }
`;

const WhisperBanner = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.6rem 1rem;
    background-color: rgba(34, 197, 94, 0.1);
    border-radius: var(--border-radius-sm);
    border-left: 3px solid var(--color-green-500);
`;

const WhisperLabel = styled.span`
    font-size: 1.2rem;
    color: var(--color-green-500);
`;

const WhisperRecipient = styled.span`
    font-weight: 600;
    color: var(--color-green-500);
`;

const InputRow = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 1rem;
`;

const TextAreaWrapper = styled.div`
    flex: 1;
    position: relative;
`;

const BottomRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const CharacterCount = styled.span`
    font-size: 1.2rem;
    color: ${(props) =>
        props.$isOverLimit
            ? "var(--color-red-700)"
            : "var(--tertiary-text-color)"};
`;

const ButtonsRow = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
`;

const IconButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.6rem;
    border: none;
    background-color: transparent;
    color: var(--tertiary-text-color);
    cursor: pointer;
    border-radius: var(--border-radius-sm);
    transition: all 0.2s;
    position: relative;

    &:hover:not(:disabled) {
        color: var(--primary-button-color);
        background-color: var(--tertiary-background-color);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    & svg {
        font-size: 2rem;
    }
`;

const SubmitButton = styled(IconButton)`
    background-color: var(--primary-button-color);
    color: var(--primary-button-color-text);
    padding: 0.6rem 1.2rem;

    &:hover:not(:disabled) {
        background-color: var(--primary-button-color-hover);
        color: var(--primary-button-color-text);
    }
`;

const PlayerDropdown = styled.div`
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    max-height: 20rem;
    overflow-y: auto;
    background-color: var(--secondary-background-color);
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-sm);
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
    z-index: 9999;
`;

const PlayerItem = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.8rem 1rem;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover,
    &.active {
        background-color: var(--tertiary-background-color);
    }
`;

const PlayerName = styled.span`
    font-size: 1.4rem;
    color: var(--primary-text-color);
`;

const EveryoneLabel = styled.span`
    font-size: 1.2rem;
    color: var(--tertiary-text-color);
    margin-left: 0.4rem;
`;

const HintText = styled.div`
    font-size: 1.1rem;
    color: var(--tertiary-text-color);
    padding: 0.4rem 0;
`;

const ContentPreview = styled.div`
    padding: 0.8rem 1rem;
    background-color: var(--tertiary-background-color);
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--primary-border-color);
    font-size: 1.4rem;
    line-height: 1.4;
    color: var(--primary-text-color);
    word-break: break-word;
    white-space: pre-wrap;
`;

const PreviewLabel = styled.span`
    font-size: 1.1rem;
    color: var(--tertiary-text-color);
    display: block;
    margin-bottom: 0.4rem;
`;

function ChatInput({
    onSubmit,
    isSubmitting,
    currentPlayer,
    replyTo,
    onCancelReply,
    lastWhisperFrom,
    onTyping,
    onFocusInput,
}) {
    const [content, setContent] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);
    const [playerSearch, setPlayerSearch] = useState("");
    const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(0);
    const [dropdownMode, setDropdownMode] = useState(null); // "whisper" | "mention" | "reply"
    const [whisperRecipient, setWhisperRecipient] = useState(null);
    const [shouldRefocusAfterSubmit, setShouldRefocusAfterSubmit] =
        useState(false);
    const inputRef = useRef(null);
    const emojiButtonRef = useRef(null);
    const gifButtonRef = useRef(null);
    const { players } = usePlayers();

    // Refocus input after submission completes (when isSubmitting goes from true to false)
    useEffect(() => {
        if (shouldRefocusAfterSubmit && !isSubmitting) {
            inputRef.current?.focus();
            setShouldRefocusAfterSubmit(false);
        }
    }, [isSubmitting, shouldRefocusAfterSubmit]);

    // Expose focus function to parent
    useEffect(() => {
        if (onFocusInput) {
            onFocusInput(() => {
                inputRef.current?.focus();
            });
        }
    }, [onFocusInput]);

    // Filter out current player from dropdown
    const availablePlayers = useMemo(() => {
        return players?.filter((p) => p.id !== currentPlayer?.id) || [];
    }, [players, currentPlayer]);

    // Special @everyone option
    const EVERYONE_OPTION = useMemo(
        () => ({
            id: "everyone",
            name: "everyone",
            isEveryone: true,
        }),
        []
    );

    // Filter players by search term (only for mentions, not whispers)
    const filteredPlayers = useMemo(() => {
        let filtered;
        if (!playerSearch) {
            filtered = availablePlayers;
        } else {
            filtered = availablePlayers.filter((player) =>
                player.name.toLowerCase().includes(playerSearch.toLowerCase())
            );
        }

        // Add @everyone option for mentions (not whispers)
        if (dropdownMode === "mention") {
            const everyoneMatches =
                "everyone".includes(playerSearch.toLowerCase()) ||
                playerSearch === "";

            if (everyoneMatches) {
                return [EVERYONE_OPTION, ...filtered];
            }
        }

        return filtered;
    }, [availablePlayers, playerSearch, dropdownMode, EVERYONE_OPTION]);

    const isOverLimit = content.length > MAX_CHAT_MESSAGE_LENGTH;
    const canSubmit =
        content.trim().length > 0 && !isOverLimit && !isSubmitting;

    useEffect(() => {
        if (showPlayerDropdown) {
            setSelectedPlayerIndex(0);
        }
    }, [showPlayerDropdown, playerSearch]);

    // Parse command from input
    function parseCommand(value) {
        // Check for whisper commands: /w username, /whisper username
        const whisperMatch = value.match(/^\/(?:w|whisper)\s+(\S*)/i);
        if (whisperMatch) {
            return { command: "whisper", search: whisperMatch[1] || "" };
        }

        // Check for reply commands: /r, /reply
        const replyMatch = value.match(/^\/(?:r|reply)(?:\s|$)/i);
        if (replyMatch && lastWhisperFrom) {
            return { command: "reply", recipient: lastWhisperFrom };
        }

        return null;
    }

    // Handle content change from RichTextInput
    function handleContentChange(newValue) {
        setContent(newValue);

        // Trigger typing indicator
        if (onTyping) {
            onTyping();
        }

        // If we already have a whisper recipient set, don't parse commands anymore
        if (whisperRecipient) {
            return;
        }

        // Parse commands from beginning of input
        const parsed = parseCommand(newValue);
        if (parsed) {
            if (parsed.command === "whisper") {
                setPlayerSearch(parsed.search);
                setDropdownMode("whisper");
                setShowPlayerDropdown(true);
                return;
            }
            if (parsed.command === "reply" && parsed.recipient) {
                // Auto-select the last whisper sender
                setWhisperRecipient(parsed.recipient);
                setContent("");
                setShowPlayerDropdown(false);
                setDropdownMode(null);
                setTimeout(() => inputRef.current?.focus(), 0);
                return;
            }
        }
    }

    // Handle @ mention trigger from RichTextInput
    function handleMentionTrigger(search, atIndex) {
        if (search !== null && atIndex !== -1) {
            setPlayerSearch(search);
            setDropdownMode("mention");
            setShowPlayerDropdown(true);
        } else {
            if (dropdownMode === "mention") {
                setShowPlayerDropdown(false);
                setDropdownMode(null);
                setPlayerSearch("");
            }
        }
    }

    function handleKeyDown(e) {
        if (showPlayerDropdown && filteredPlayers?.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedPlayerIndex((prev) =>
                    prev < filteredPlayers.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedPlayerIndex((prev) =>
                    prev > 0 ? prev - 1 : filteredPlayers.length - 1
                );
            } else if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                handleSelectPlayer(filteredPlayers[selectedPlayerIndex]);
            } else if (e.key === "Escape") {
                setShowPlayerDropdown(false);
                setDropdownMode(null);
            }
        } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        } else if (e.key === "Escape" && (replyTo || whisperRecipient)) {
            // Cancel reply or whisper mode
            if (whisperRecipient) {
                setWhisperRecipient(null);
            }
            if (replyTo) {
                onCancelReply?.();
            }
        }
    }

    function handleSelectPlayer(player) {
        if (dropdownMode === "whisper") {
            // Set whisper recipient and clear input
            setWhisperRecipient(player);
            setContent("");
            setShowPlayerDropdown(false);
            setDropdownMode(null);
            setPlayerSearch("");
            setTimeout(() => inputRef.current?.focus(), 0);
        } else if (dropdownMode === "mention") {
            // Use RichTextInput's insertMention method
            inputRef.current?.insertMention(player);
            setShowPlayerDropdown(false);
            setDropdownMode(null);
            setPlayerSearch("");
        }
    }

    function handleEmojiSelect(emoji) {
        inputRef.current?.insertText(emoji);
    }

    function handleSubmit() {
        if (!canSubmit) return;

        // Store ref before state changes
        const input = inputRef.current;

        onSubmit({
            content: content.trim(),
            recipientId: whisperRecipient?.id || null,
            replyToId: replyTo?.id || null,
        });

        setContent("");
        setWhisperRecipient(null);

        // Mark that we should refocus after the submission completes
        setShouldRefocusAfterSubmit(true);

        // Keep focus on input - use multiple strategies for reliable focus retention
        // This ensures focus works on both desktop and mobile
        if (input) {
            // Immediate focus attempt
            input.focus();
            // Backup with requestAnimationFrame
            requestAnimationFrame(() => {
                input.focus();
            });
            // Additional backup with setTimeout for mobile browsers
            setTimeout(() => {
                input.focus();
            }, 0);
            // Extra delay for async operations
            setTimeout(() => {
                input.focus();
            }, 100);
        }
    }

    function handleCancelWhisper() {
        setWhisperRecipient(null);
        inputRef.current?.focus();
    }

    function handleGifSelect(gifUrl) {
        // Use RichTextInput's insertGif method
        inputRef.current?.insertGif(gifUrl);
        setShowGifPicker(false);
    }

    // Check if content has GIFs that need preview (mentions handled inline)
    const hasGifs = /\[gif:[^\]]+\]/.test(content);
    const needsPreview = hasGifs;

    // Build placeholder text
    const placeholder = useMemo(() => {
        if (replyTo) {
            return `Reply to ${replyTo.player?.name}...`;
        }
        if (whisperRecipient) {
            return `Whisper to ${whisperRecipient.name}...`;
        }
        return "Type a message... Use @ to mention, /w to whisper";
    }, [replyTo, whisperRecipient]);

    if (!currentPlayer) return null;

    return (
        <InputContainer>
            {/* Reply Banner */}
            {replyTo && (
                <ReplyBanner>
                    <ReplyContent>
                        <ReplyLabel>
                            Replying to {replyTo.player?.name}
                        </ReplyLabel>
                        <ReplyText>{replyTo.content}</ReplyText>
                    </ReplyContent>
                    <CloseReplyButton onClick={onCancelReply}>
                        <HiXMark />
                    </CloseReplyButton>
                </ReplyBanner>
            )}

            {/* Whisper Banner */}
            {whisperRecipient && !replyTo && (
                <WhisperBanner>
                    <WhisperLabel>
                        Whispering to{" "}
                        <WhisperRecipient>
                            {whisperRecipient.name}
                        </WhisperRecipient>
                    </WhisperLabel>
                    <CloseReplyButton onClick={handleCancelWhisper}>
                        <HiXMark />
                    </CloseReplyButton>
                </WhisperBanner>
            )}

            {/* Content Preview - shows how mentions and GIFs will appear */}
            {needsPreview && (
                <ContentPreview>
                    <PreviewLabel>Preview:</PreviewLabel>
                    <MentionText content={content} />
                </ContentPreview>
            )}

            <InputRow>
                <Avatar
                    $size="small"
                    src={currentPlayer.avatar || DEFAULT_AVATAR}
                    alt={currentPlayer.name}
                />
                <TextAreaWrapper>
                    <RichTextInput
                        ref={inputRef}
                        value={content}
                        onChange={handleContentChange}
                        onKeyDown={handleKeyDown}
                        onMentionTrigger={handleMentionTrigger}
                        placeholder={placeholder}
                        disabled={isSubmitting}
                    />
                    {showPlayerDropdown && (
                        <PlayerDropdown>
                            {filteredPlayers?.length > 0 ? (
                                filteredPlayers.map((player, index) => (
                                    <PlayerItem
                                        key={player.id}
                                        className={
                                            index === selectedPlayerIndex
                                                ? "active"
                                                : ""
                                        }
                                        onClick={() =>
                                            handleSelectPlayer(player)
                                        }
                                    >
                                        {player.isEveryone ? (
                                            <>
                                                <Avatar
                                                    $size="xs"
                                                    src={DEFAULT_AVATAR}
                                                    alt="everyone"
                                                />
                                                <PlayerName>
                                                    @everyone
                                                    <EveryoneLabel>
                                                        (notify all players)
                                                    </EveryoneLabel>
                                                </PlayerName>
                                            </>
                                        ) : (
                                            <>
                                                <Avatar
                                                    $size="xs"
                                                    src={
                                                        player.avatar ||
                                                        DEFAULT_AVATAR
                                                    }
                                                    alt={player.name}
                                                />
                                                <PlayerName>
                                                    {player.name}
                                                </PlayerName>
                                            </>
                                        )}
                                    </PlayerItem>
                                ))
                            ) : (
                                <PlayerItem>
                                    <PlayerName>No players found</PlayerName>
                                </PlayerItem>
                            )}
                        </PlayerDropdown>
                    )}
                </TextAreaWrapper>
            </InputRow>

            <BottomRow>
                <div>
                    <CharacterCount $isOverLimit={isOverLimit}>
                        {content.length} / {MAX_CHAT_MESSAGE_LENGTH}
                    </CharacterCount>
                    {!whisperRecipient && !replyTo && (
                        <HintText>
                            /w or /whisper &lt;name&gt; • /r to reply to last
                            whisper
                        </HintText>
                    )}
                </div>
                <ButtonsRow>
                    <IconButton
                        ref={gifButtonRef}
                        onClick={() => setShowGifPicker(!showGifPicker)}
                        disabled={isSubmitting}
                        title="Add GIF"
                    >
                        <PiGifBold />
                    </IconButton>
                    {showGifPicker && (
                        <GifPicker
                            onSelect={handleGifSelect}
                            onClose={() => setShowGifPicker(false)}
                            position="top"
                            align="right"
                            triggerRef={gifButtonRef}
                        />
                    )}
                    <IconButton
                        ref={emojiButtonRef}
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        disabled={isSubmitting}
                        title="Add emoji"
                    >
                        <HiOutlineFaceSmile />
                    </IconButton>
                    {showEmojiPicker && (
                        <EmojiPicker
                            onSelect={handleEmojiSelect}
                            onClose={() => setShowEmojiPicker(false)}
                            position="top"
                            align="right"
                            triggerRef={emojiButtonRef}
                        />
                    )}
                    <SubmitButton
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        title="Send message"
                    >
                        {isSubmitting ? <SpinnerMini /> : <HiPaperAirplane />}
                    </SubmitButton>
                </ButtonsRow>
            </BottomRow>
        </InputContainer>
    );
}

export default ChatInput;
