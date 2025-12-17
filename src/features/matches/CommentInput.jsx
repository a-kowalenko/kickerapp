import styled from "styled-components";
import { useState, useRef, useEffect } from "react";
import { HiOutlineFaceSmile, HiPaperAirplane } from "react-icons/hi2";
import { PiGifBold } from "react-icons/pi";
import { usePlayers } from "../../hooks/usePlayers";
import { MAX_COMMENT_LENGTH } from "../../utils/constants";
import Avatar from "../../ui/Avatar";
import { DEFAULT_AVATAR } from "../../utils/constants";
import EmojiPicker from "../../ui/EmojiPicker";
import GifPicker from "../../ui/GifPicker";
import SpinnerMini from "../../ui/SpinnerMini";

const InputContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    padding: 1rem;
    background-color: var(--secondary-background-color);
    border-radius: var(--border-radius-md);
    border: 1px solid var(--primary-border-color);
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

const StyledTextArea = styled.textarea`
    width: 100%;
    min-height: 6rem;
    max-height: 15rem;
    padding: 1rem;
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

    &::placeholder {
        color: var(--tertiary-text-color);
    }
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

const MentionDropdown = styled.div`
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    max-height: 20rem;
    overflow-y: auto;
    background-color: var(--secondary-background-color);
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-sm);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 100;
`;

const MentionItem = styled.div`
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

const MentionName = styled.span`
    font-size: 1.4rem;
    color: var(--primary-text-color);
`;

const EveryoneLabel = styled.span`
    font-size: 1.2rem;
    color: var(--tertiary-text-color);
    margin-left: 0.4rem;
`;

// Special @everyone option
const EVERYONE_OPTION = {
    id: "everyone",
    name: "everyone",
    isEveryone: true,
};

function CommentInput({ onSubmit, isSubmitting, currentPlayer }) {
    const [content, setContent] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);
    const [mentionSearch, setMentionSearch] = useState("");
    const [mentionStartIndex, setMentionStartIndex] = useState(-1);
    const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
    const textareaRef = useRef(null);
    const emojiButtonRef = useRef(null);
    const gifButtonRef = useRef(null);
    const { players } = usePlayers();

    // Filter players and add @everyone option at the beginning
    const filteredPlayers = (() => {
        const filtered =
            players?.filter((player) =>
                player.name.toLowerCase().includes(mentionSearch.toLowerCase())
            ) || [];

        // Add @everyone if search matches "everyone" or is empty
        const everyoneMatches =
            "everyone".includes(mentionSearch.toLowerCase()) ||
            mentionSearch === "";

        if (everyoneMatches) {
            return [EVERYONE_OPTION, ...filtered];
        }
        return filtered;
    })();

    const isOverLimit = content.length > MAX_COMMENT_LENGTH;
    const canSubmit =
        content.trim().length > 0 && !isOverLimit && !isSubmitting;

    useEffect(() => {
        if (showMentionDropdown) {
            setSelectedMentionIndex(0);
        }
    }, [showMentionDropdown, mentionSearch]);

    function handleContentChange(e) {
        const value = e.target.value;
        const cursorPosition = e.target.selectionStart;
        setContent(value);

        // Check for @ mention
        const textBeforeCursor = value.slice(0, cursorPosition);
        const atIndex = textBeforeCursor.lastIndexOf("@");

        if (atIndex !== -1) {
            const textAfterAt = textBeforeCursor.slice(atIndex + 1);
            // Check if there's no space after @ (still typing mention)
            if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
                setMentionSearch(textAfterAt);
                setMentionStartIndex(atIndex);
                setShowMentionDropdown(true);
                return;
            }
        }

        setShowMentionDropdown(false);
        setMentionSearch("");
        setMentionStartIndex(-1);
    }

    function handleKeyDown(e) {
        if (showMentionDropdown && filteredPlayers?.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedMentionIndex((prev) =>
                    prev < filteredPlayers.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedMentionIndex((prev) =>
                    prev > 0 ? prev - 1 : filteredPlayers.length - 1
                );
            } else if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                handleSelectMention(filteredPlayers[selectedMentionIndex]);
            } else if (e.key === "Escape") {
                setShowMentionDropdown(false);
            }
        } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    }

    function handleSelectMention(player) {
        const beforeMention = content.slice(0, mentionStartIndex);
        const afterMention = content.slice(
            mentionStartIndex + 1 + mentionSearch.length
        );

        // Handle @everyone differently
        const mentionText = player.isEveryone
            ? "@everyone "
            : `@[${player.name}](${player.id}) `;

        setContent(beforeMention + mentionText + afterMention);
        setShowMentionDropdown(false);
        setMentionSearch("");
        setMentionStartIndex(-1);

        // Focus textarea and set cursor position
        setTimeout(() => {
            if (textareaRef.current) {
                const newPosition = beforeMention.length + mentionText.length;
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(newPosition, newPosition);
            }
        }, 0);
    }

    function handleEmojiSelect(emoji) {
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent = content.slice(0, start) + emoji + content.slice(end);
        setContent(newContent);

        // Set cursor position after emoji
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(
                start + emoji.length,
                start + emoji.length
            );
        }, 0);
    }

    function handleGifSelect(gifUrl) {
        // Send GIF immediately as a GIF-only message
        onSubmit(`[gif:${gifUrl}]`);
        setShowGifPicker(false);
    }

    function handleSubmit() {
        if (!canSubmit) return;

        onSubmit(content.trim());
        setContent("");
    }

    if (!currentPlayer) return null;

    return (
        <InputContainer>
            <InputRow>
                <Avatar
                    $size="small"
                    src={currentPlayer.avatar || DEFAULT_AVATAR}
                    alt={currentPlayer.name}
                />
                <TextAreaWrapper>
                    <StyledTextArea
                        ref={textareaRef}
                        value={content}
                        onChange={handleContentChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Write a comment... Use @ to mention players"
                        disabled={isSubmitting}
                    />
                    {showMentionDropdown && filteredPlayers?.length > 0 && (
                        <MentionDropdown>
                            {filteredPlayers.map((player, index) => (
                                <MentionItem
                                    key={player.id}
                                    className={
                                        index === selectedMentionIndex
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() => handleSelectMention(player)}
                                >
                                    {player.isEveryone ? (
                                        <>
                                            <Avatar
                                                $size="xs"
                                                src={DEFAULT_AVATAR}
                                                alt="everyone"
                                            />
                                            <MentionName>
                                                @everyone
                                                <EveryoneLabel>
                                                    (notify all players)
                                                </EveryoneLabel>
                                            </MentionName>
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
                                            <MentionName>
                                                {player.name}
                                            </MentionName>
                                        </>
                                    )}
                                </MentionItem>
                            ))}
                        </MentionDropdown>
                    )}
                </TextAreaWrapper>
            </InputRow>
            <BottomRow>
                <CharacterCount $isOverLimit={isOverLimit}>
                    {content.length} / {MAX_COMMENT_LENGTH}
                </CharacterCount>
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
                        title="Send comment"
                    >
                        {isSubmitting ? <SpinnerMini /> : <HiPaperAirplane />}
                    </SubmitButton>
                </ButtonsRow>
            </BottomRow>
        </InputContainer>
    );
}

export default CommentInput;
