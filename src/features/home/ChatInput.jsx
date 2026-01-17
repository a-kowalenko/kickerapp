import styled, { keyframes, css } from "styled-components";
import {
    useState,
    useRef,
    useEffect,
    useMemo,
    useCallback,
    forwardRef,
    useImperativeHandle,
} from "react";
import {
    HiOutlineFaceSmile,
    HiPaperAirplane,
    HiXMark,
    HiPhoto,
    HiChatBubbleLeftRight,
    HiPlus,
} from "react-icons/hi2";
import { PiGifBold } from "react-icons/pi";
import { usePlayers } from "../../hooks/usePlayers";
import { useKicker } from "../../contexts/KickerContext";
import { useKeyboard } from "../../contexts/KeyboardContext";
import {
    MAX_CHAT_MESSAGE_LENGTH,
    DEFAULT_AVATAR,
    media,
} from "../../utils/constants";
import Avatar from "../../ui/Avatar";
import EmojiPicker from "../../ui/EmojiPicker";
import GifPicker from "../../ui/GifPicker";
import MatchDropdown from "../../ui/MatchDropdown";
import SpinnerMini from "../../ui/SpinnerMini";
import MentionText from "../../ui/MentionText";
import RichTextInput from "../../ui/RichTextInput";
import { getMatch, formatMatchDisplay } from "../../services/apiMatches";
import { useCanUploadImages } from "../../hooks/useCanUploadImages";
import { useImageUpload } from "../../hooks/useImageUpload";
import useWindowWidth from "../../hooks/useWindowWidth";
import toast from "react-hot-toast";

// Helper function to format reply preview text
function formatReplyPreview(text, maxLength = 50) {
    if (!text) return "";

    let formatted = text
        // Convert @[Name](id) to @Name
        .replace(/@\[([^\]]+)\]\(\d+\)/g, "@$1")
        // Convert #[Display](id) to #Display
        .replace(/#\[([^\]]+)\]\(\d+\)/g, "#$1")
        // Convert [gif:url] to [GIF]
        .replace(/\[gif:[^\]]+\]/g, "[GIF]")
        // Convert [img:url] to [Image]
        .replace(/\[img:[^\]]+\]/g, "[Image]");

    // Truncate if needed
    if (formatted.length > maxLength) {
        formatted = formatted.substring(0, maxLength) + "...";
    }

    return formatted;
}

// Helper function to extract media URL from reply content
function getMediaPreviewUrl(text) {
    if (!text) return null;
    // Check for GIF
    const gifMatch = text.match(/\[gif:(https?:\/\/[^\]]+)\]/);
    if (gifMatch) return { type: "gif", url: gifMatch[1] };
    // Check for image
    const imgMatch = text.match(/\[img:(https?:\/\/[^\]]+)\]/);
    if (imgMatch) return { type: "img", url: imgMatch[1] };
    return null;
}

// Animations
const slideIn = keyframes`
    from {
        transform: scale(0);
        opacity: 0;
    }
    to {
        transform: scale(1);
        opacity: 1;
    }
`;

const slideOut = keyframes`
    from {
        transform: scale(1);
        opacity: 1;
    }
    to {
        transform: scale(0);
        opacity: 0;
    }
`;

const iconFlyIn = keyframes`
    0% {
        transform: translateX(-10px) rotate(-45deg);
        opacity: 0;
    }
    50% {
        transform: translateX(2px) rotate(0deg);
        opacity: 1;
    }
    100% {
        transform: translateX(0) rotate(0deg);
        opacity: 1;
    }
`;

const iconFlyOut = keyframes`
    0% {
        transform: translateX(0) rotate(0deg);
        opacity: 1;
    }
    100% {
        transform: translateX(10px) rotate(45deg);
        opacity: 0;
    }
`;

const InputContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    padding: 1rem;
    background-color: var(--secondary-background-color);
    border-top: 1px solid var(--primary-border-color);

    ${media.tablet} {
        padding: 0.6rem 0.8rem;
        gap: 0.4rem;
    }
`;

const ReplyBanner = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.6rem 1rem;
    background-color: var(--tertiary-background-color);
    border-radius: var(--border-radius-sm);
    border-left: 3px solid var(--primary-button-color);
`;

const ReplyMediaPreview = styled.img`
    width: 4rem;
    height: 4rem;
    object-fit: cover;
    border-radius: var(--border-radius-sm);
    flex-shrink: 0;
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
    padding: 0.8rem 1rem;
    background-color: rgba(34, 197, 94, 0.15);
    border-radius: var(--border-radius-sm);
    border-left: 3px solid var(--color-green-500);
`;

const WhisperIcon = styled(HiChatBubbleLeftRight)`
    font-size: 1.6rem;
    color: var(--color-green-500);
    flex-shrink: 0;
`;

const WhisperLabel = styled.span`
    font-size: 1.2rem;
    color: var(--color-green-500);
    font-weight: 500;
`;

const WhisperRecipient = styled.span`
    font-weight: 700;
    color: var(--color-green-400);
    font-size: 1.3rem;
`;

const InputRow = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 1rem;

    ${media.tablet} {
        gap: 0.8rem;
        align-items: center;
    }
`;

const TextAreaWrapper = styled.div`
    flex: 1;
    position: relative;
`;

const MobileInputRow = styled.div`
    display: flex;
    align-items: center;
    gap: 0.6rem;
`;

const AddButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.2rem;
    height: 3.2rem;
    border: none;
    background-color: var(--tertiary-background-color);
    color: var(--secondary-text-color);
    cursor: pointer;
    border-radius: 50%;
    transition: all 0.2s;
    flex-shrink: 0;

    &:hover:not(:disabled) {
        color: var(--primary-button-color);
        background-color: var(--primary-border-color);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    & svg {
        font-size: 2rem;
        transition: transform 0.2s;
    }

    &[data-open="true"] svg {
        transform: rotate(45deg);
    }
`;

const AddMenu = styled.div`
    position: absolute;
    bottom: 100%;
    left: 0;
    margin-bottom: 0.8rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    background-color: var(--secondary-background-color);
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-md);
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
    padding: 0.6rem;
    z-index: 100;
`;

const AddMenuItem = styled.button`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.8rem 1.2rem;
    border: none;
    background: transparent;
    color: var(--primary-text-color);
    font-size: 1.4rem;
    cursor: pointer;
    border-radius: var(--border-radius-sm);
    transition: background-color 0.2s;
    white-space: nowrap;

    &:hover {
        background-color: var(--tertiary-background-color);
    }

    & svg {
        font-size: 2rem;
        color: var(--secondary-text-color);
    }
`;

const MobileTextWrapper = styled.div`
    flex: 1;
    position: relative;
`;

const SendButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.2rem;
    height: 3.2rem;
    border: none;
    background-color: var(--primary-button-color);
    color: var(--primary-button-color-text);
    cursor: pointer;
    border-radius: 50%;
    flex-shrink: 0;
    transition: background-color 0.2s;
    overflow: hidden;

    ${(props) =>
        props.$visible
            ? css`
                  animation: ${slideIn} 0.2s ease-out forwards;
              `
            : css`
                  animation: ${slideOut} 0.15s ease-in forwards;
                  pointer-events: none;
              `}

    &:hover:not(:disabled) {
        background-color: var(--primary-button-color-hover);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    & svg {
        font-size: 1.6rem;
        ${(props) =>
            props.$visible
                ? css`
                      animation: ${iconFlyIn} 0.3s ease-out 0.1s both;
                  `
                : css`
                      animation: ${iconFlyOut} 0.15s ease-in forwards;
                  `}
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

const HiddenFileInput = styled.input`
    display: none;
`;

const UploadProgress = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.6rem 1rem;
    background-color: var(--tertiary-background-color);
    border-radius: var(--border-radius-sm);
    font-size: 1.2rem;
    color: var(--secondary-text-color);
`;

const ProgressBar = styled.div`
    flex: 1;
    height: 0.4rem;
    background-color: var(--primary-border-color);
    border-radius: 0.2rem;
    overflow: hidden;
`;

const ProgressFill = styled.div`
    height: 100%;
    background-color: var(--primary-button-color);
    transition: width 0.2s ease;
    width: ${(props) => props.$progress}%;
`;

const ChatInput = forwardRef(function ChatInput(
    {
        onSubmit,
        isSubmitting,
        currentPlayer,
        replyTo,
        onCancelReply,
        lastWhisperFrom,
        onTyping,
        stopTyping,
        onFocusInput,
    },
    ref
) {
    const [content, setContent] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);
    const [showMatchDropdown, setShowMatchDropdown] = useState(false);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [playerSearch, setPlayerSearch] = useState("");
    const [matchSearch, setMatchSearch] = useState("");
    const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(0);
    const [selectedMatchIndex, setSelectedMatchIndex] = useState(0);
    const [dropdownMode, setDropdownMode] = useState(null); // "whisper" | "mention" | "reply"
    const [whisperRecipient, setWhisperRecipient] = useState(null);
    const [shouldRefocusAfterSubmit, setShouldRefocusAfterSubmit] =
        useState(false);
    const [showSendButton, setShowSendButton] = useState(false);
    const inputRef = useRef(null);
    const emojiButtonRef = useRef(null);
    const gifButtonRef = useRef(null);
    const fileInputRef = useRef(null);
    const addMenuRef = useRef(null);
    const mobileTextWrapperRef = useRef(null);
    const { players } = usePlayers();
    const { currentKicker: kicker } = useKicker();
    const { isDesktop } = useWindowWidth();
    const { setInputFocused, setInputBlurred } = useKeyboard();

    // Image upload permission and hook
    const { canUpload: canUploadImages } = useCanUploadImages();
    const { uploadImageFile, isUploading, progress } = useImageUpload();

    // Expose methods to parent via ref (for context menu actions)
    useImperativeHandle(
        ref,
        () => ({
            setWhisperRecipient: (player) => {
                setWhisperRecipient(player);
                // Only clear content if starting fresh whisper, keep content if user typed something
                if (!contentRef.current.trim()) {
                    setContent("");
                }
                setTimeout(() => {
                    inputRef.current?.focus();
                    inputRef.current?.setCursorPosition(
                        contentRef.current.length
                    );
                }, 10);
            },
            insertMention: (player) => {
                // Directly append the mention to content (context menu action)
                // Don't use RichTextInput's insertMention as it looks for @ trigger
                let mentionText;
                if (player.isEveryone) {
                    mentionText = "@everyone ";
                } else {
                    mentionText = `@[${player.name}](${player.id}) `;
                }

                // Append to current content or start fresh
                const currentContent = contentRef.current;
                const trimmed = currentContent.trimEnd();
                const newContent = trimmed
                    ? `${trimmed} ${mentionText}`
                    : mentionText;
                setContent(newContent);

                // Focus and move cursor to end after state update
                setTimeout(() => {
                    inputRef.current?.focus();
                    inputRef.current?.setCursorPosition(newContent.length);
                }, 50);
            },
        }),
        []
    );

    // Refocus input after submission completes (when isSubmitting goes from true to false)
    useEffect(() => {
        if (shouldRefocusAfterSubmit && !isSubmitting) {
            inputRef.current?.focus();
            setShouldRefocusAfterSubmit(false);
        }
    }, [isSubmitting, shouldRefocusAfterSubmit]);

    // Use ref to track current content for focus function (avoids stale closure)
    const contentRef = useRef(content);
    useEffect(() => {
        contentRef.current = content;
    }, [content]);

    // Track send button visibility based on content
    useEffect(() => {
        setShowSendButton(content.trim().length > 0);
    }, [content]);

    // Close add menu when clicking outside
    useEffect(() => {
        if (!showAddMenu) return;

        function handleClickOutside(e) {
            if (addMenuRef.current && !addMenuRef.current.contains(e.target)) {
                setShowAddMenu(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [showAddMenu]);

    // Expose focus function to parent (with cursor at end)
    useEffect(() => {
        if (onFocusInput) {
            onFocusInput(() => {
                inputRef.current?.focus();
                // Move cursor to end after focus
                setTimeout(() => {
                    inputRef.current?.setCursorPosition(
                        contentRef.current.length
                    );
                }, 10);
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

        // Trigger typing indicator with whisper recipient if set
        if (onTyping) {
            onTyping(whisperRecipient?.id || null);
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
        } else {
            // No command detected - close whisper dropdown if it was open
            if (dropdownMode === "whisper") {
                setShowPlayerDropdown(false);
                setDropdownMode(null);
                setPlayerSearch("");
            }
        }
    }

    // Handle @ mention trigger from RichTextInput
    function handleMentionTrigger(search, atIndex) {
        if (search !== null && atIndex !== -1) {
            setPlayerSearch(search);
            setDropdownMode("mention");
            setShowPlayerDropdown(true);
            setShowMatchDropdown(false);
        } else {
            if (dropdownMode === "mention") {
                setShowPlayerDropdown(false);
                setDropdownMode(null);
                setPlayerSearch("");
            }
        }
    }

    // Handle # match trigger from RichTextInput
    function handleMatchTrigger(search, hashIndex) {
        if (search !== null && hashIndex !== -1) {
            setMatchSearch(search);
            setShowMatchDropdown(true);
            setShowPlayerDropdown(false);
            setDropdownMode(null);
        } else {
            setShowMatchDropdown(false);
            setMatchSearch("");
        }
    }

    // Handle match selection from dropdown
    function handleSelectMatch(match, display) {
        inputRef.current?.insertMatch(match, display);
        setShowMatchDropdown(false);
        setMatchSearch("");
        setSelectedMatchIndex(0);
    }

    // Handle pasted match URLs - async resolution
    const handleMatchPaste = useCallback(
        async (matchIds) => {
            for (const matchId of matchIds) {
                try {
                    const match = await getMatch({ matchId, kicker });
                    if (match) {
                        const display = formatMatchDisplay(match);
                        inputRef.current?.replaceMatchPlaceholder(
                            matchId,
                            display
                        );
                    } else {
                        // Match not found - show ID only
                        inputRef.current?.replaceMatchPlaceholder(
                            matchId,
                            `Match ${matchId}`
                        );
                    }
                } catch (error) {
                    console.error("Failed to load match:", error);
                    // Replace placeholder with just the match ID
                    inputRef.current?.replaceMatchPlaceholder(
                        matchId,
                        `Match ${matchId}`
                    );
                }
            }
        },
        [kicker]
    );

    function handleKeyDown(e) {
        // Handle match dropdown navigation
        if (showMatchDropdown) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedMatchIndex((prev) => prev + 1);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedMatchIndex((prev) => Math.max(0, prev - 1));
            } else if (e.key === "Escape") {
                setShowMatchDropdown(false);
                setMatchSearch("");
            }
            // Note: Enter/Tab handled by MatchDropdown's onSelect
            return;
        }

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
        // Stop whisper typing indicator
        if (stopTyping) {
            stopTyping();
        }
        setWhisperRecipient(null);
        // Re-trigger public typing if there's content
        if (content.trim() && onTyping) {
            onTyping(null);
        }
        inputRef.current?.focus();
    }

    function handleGifSelect(gifUrl) {
        // Use RichTextInput's insertGif method
        inputRef.current?.insertGif(gifUrl);
        setShowGifPicker(false);
    }

    // Handle image file selection
    async function handleImageSelect(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset file input for future selections
        e.target.value = "";

        try {
            const imageTag = await uploadImageFile(file);
            // Insert the image tag into the content
            setContent((prev) => {
                if (prev && !prev.endsWith(" ") && !prev.endsWith("\n")) {
                    return prev + " " + imageTag;
                }
                return prev + imageTag;
            });
            inputRef.current?.focus();
        } catch (err) {
            toast.error(err.message || "Failed to upload image");
        }
    }

    // Handle pasted images from clipboard
    const handleImagePaste = useCallback(
        async (file) => {
            if (!canUploadImages) {
                toast.error("You don't have permission to upload images");
                return;
            }

            try {
                const imageTag = await uploadImageFile(file);
                setContent((prev) => {
                    if (prev && !prev.endsWith(" ") && !prev.endsWith("\n")) {
                        return prev + " " + imageTag;
                    }
                    return prev + imageTag;
                });
                inputRef.current?.focus();
            } catch (err) {
                toast.error(err.message || "Failed to upload image");
            }
        },
        [canUploadImages, uploadImageFile]
    );

    function handleImageButtonClick() {
        fileInputRef.current?.click();
    }

    // Check if content has GIFs or images that need preview (mentions handled inline)
    const hasGifs = /\[gif:[^\]]+\]/.test(content);
    const hasImages = /\[img:[^\]]+\]/.test(content);
    const needsPreview = hasGifs || hasImages;

    // Build placeholder text
    const placeholder = useMemo(() => {
        if (replyTo) {
            return `Reply to ${replyTo.player?.name}...`;
        }
        if (whisperRecipient) {
            return `Whisper to ${whisperRecipient.name}...`;
        }
        return "Type a message... @ mention, # match, /w whisper";
    }, [replyTo, whisperRecipient]);

    if (!currentPlayer) return null;

    return (
        <InputContainer data-chat-input="true">
            {/* Reply Banner */}
            {replyTo && (
                <ReplyBanner>
                    {getMediaPreviewUrl(replyTo.content) && (
                        <ReplyMediaPreview
                            src={getMediaPreviewUrl(replyTo.content).url}
                            alt={
                                getMediaPreviewUrl(replyTo.content).type ===
                                "gif"
                                    ? "GIF"
                                    : "Image"
                            }
                        />
                    )}
                    <ReplyContent>
                        <ReplyLabel>
                            Replying to {replyTo.player?.name}
                        </ReplyLabel>
                        <ReplyText>
                            {formatReplyPreview(replyTo.content, 60)}
                        </ReplyText>
                    </ReplyContent>
                    <CloseReplyButton onClick={onCancelReply}>
                        <HiXMark />
                    </CloseReplyButton>
                </ReplyBanner>
            )}

            {/* Whisper Banner */}
            {whisperRecipient && (
                <WhisperBanner>
                    <WhisperIcon />
                    <Avatar
                        src={whisperRecipient.avatar || DEFAULT_AVATAR}
                        $size="small"
                    />
                    <WhisperLabel>
                        Whispering to{" "}
                        <WhisperRecipient>
                            {whisperRecipient.name}
                        </WhisperRecipient>
                    </WhisperLabel>
                    <CloseReplyButton
                        onClick={handleCancelWhisper}
                        style={{ marginLeft: "auto" }}
                    >
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

            {/* Upload Progress */}
            {isUploading && (
                <UploadProgress>
                    <HiPhoto />
                    <span>Uploading image...</span>
                    <ProgressBar>
                        <ProgressFill $progress={progress} />
                    </ProgressBar>
                    <span>{progress}%</span>
                </UploadProgress>
            )}

            {/* Hidden file input for image upload */}
            <HiddenFileInput
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageSelect}
            />

            {/* Mobile Layout */}
            {!isDesktop ? (
                <>
                    <MobileInputRow>
                        <div style={{ position: "relative" }} ref={addMenuRef}>
                            <AddButton
                                onClick={() => setShowAddMenu(!showAddMenu)}
                                disabled={isSubmitting || isUploading}
                                data-open={showAddMenu}
                                title="Add content"
                            >
                                <HiPlus />
                            </AddButton>
                            {showAddMenu && (
                                <AddMenu>
                                    {canUploadImages && (
                                        <AddMenuItem
                                            onClick={() => {
                                                handleImageButtonClick();
                                                setShowAddMenu(false);
                                            }}
                                        >
                                            <HiPhoto />
                                            Photo
                                        </AddMenuItem>
                                    )}
                                    <AddMenuItem
                                        onClick={() => {
                                            setShowGifPicker(true);
                                            setShowAddMenu(false);
                                        }}
                                    >
                                        <PiGifBold />
                                        GIF
                                    </AddMenuItem>
                                    <AddMenuItem
                                        onClick={() => {
                                            setShowEmojiPicker(true);
                                            setShowAddMenu(false);
                                        }}
                                    >
                                        <HiOutlineFaceSmile />
                                        Emoji
                                    </AddMenuItem>
                                </AddMenu>
                            )}
                        </div>
                        <MobileTextWrapper ref={mobileTextWrapperRef}>
                            <RichTextInput
                                ref={inputRef}
                                value={content}
                                onChange={handleContentChange}
                                onKeyDown={handleKeyDown}
                                onMentionTrigger={handleMentionTrigger}
                                onMatchTrigger={handleMatchTrigger}
                                onMatchPaste={handleMatchPaste}
                                onImagePaste={handleImagePaste}
                                placeholder=""
                                disabled={isSubmitting}
                                onFocus={() => setInputFocused(inputRef)}
                                onBlur={() => setInputBlurred()}
                            />
                            {showMatchDropdown && (
                                <MatchDropdown
                                    search={matchSearch}
                                    selectedIndex={selectedMatchIndex}
                                    onSelect={handleSelectMatch}
                                />
                            )}
                            {showPlayerDropdown && (
                                <PlayerDropdown>
                                    {filteredPlayers?.length > 0 ? (
                                        filteredPlayers.map((player, index) => (
                                            <PlayerItem
                                                key={player.id}
                                                className={
                                                    index ===
                                                    selectedPlayerIndex
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
                                                                (notify all)
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
                                            <PlayerName>
                                                No players found
                                            </PlayerName>
                                        </PlayerItem>
                                    )}
                                </PlayerDropdown>
                            )}
                            {showGifPicker && (
                                <GifPicker
                                    onSelect={handleGifSelect}
                                    onClose={() => setShowGifPicker(false)}
                                    position="top"
                                    align="center"
                                    triggerRef={mobileTextWrapperRef}
                                />
                            )}
                            {showEmojiPicker && (
                                <EmojiPicker
                                    onSelect={handleEmojiSelect}
                                    onClose={() => setShowEmojiPicker(false)}
                                    position="top"
                                    align="center"
                                    triggerRef={mobileTextWrapperRef}
                                />
                            )}
                        </MobileTextWrapper>
                        {(showSendButton || isSubmitting) && (
                            <SendButton
                                $visible={showSendButton || isSubmitting}
                                onMouseDown={(e) => {
                                    // Prevent blur of input when clicking send button
                                    e.preventDefault();
                                }}
                                onClick={handleSubmit}
                                disabled={!canSubmit || isUploading}
                                title="Send message"
                            >
                                {isSubmitting ? (
                                    <SpinnerMini />
                                ) : (
                                    <HiPaperAirplane />
                                )}
                            </SendButton>
                        )}
                    </MobileInputRow>
                </>
            ) : (
                /* Desktop Layout */
                <>
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
                                onMatchTrigger={handleMatchTrigger}
                                onMatchPaste={handleMatchPaste}
                                onImagePaste={handleImagePaste}
                                placeholder={placeholder}
                                disabled={isSubmitting}
                                onFocus={() => setInputFocused(inputRef)}
                                onBlur={() => setInputBlurred()}
                            />
                            {showMatchDropdown && (
                                <MatchDropdown
                                    search={matchSearch}
                                    selectedIndex={selectedMatchIndex}
                                    onSelect={handleSelectMatch}
                                />
                            )}
                            {showPlayerDropdown && (
                                <PlayerDropdown>
                                    {filteredPlayers?.length > 0 ? (
                                        filteredPlayers.map((player, index) => (
                                            <PlayerItem
                                                key={player.id}
                                                className={
                                                    index ===
                                                    selectedPlayerIndex
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
                                                                (notify all
                                                                players)
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
                                            <PlayerName>
                                                No players found
                                            </PlayerName>
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
                                    /w or /whisper &lt;name&gt; • /r to reply to
                                    last whisper
                                </HintText>
                            )}
                        </div>
                        <ButtonsRow>
                            {canUploadImages && (
                                <IconButton
                                    onClick={handleImageButtonClick}
                                    disabled={isSubmitting || isUploading}
                                    title="Upload image (max 5MB)"
                                >
                                    <HiPhoto />
                                </IconButton>
                            )}
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
                                onClick={() =>
                                    setShowEmojiPicker(!showEmojiPicker)
                                }
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
                                disabled={!canSubmit || isUploading}
                                title="Send message"
                            >
                                {isSubmitting ? (
                                    <SpinnerMini />
                                ) : (
                                    <HiPaperAirplane />
                                )}
                            </SubmitButton>
                        </ButtonsRow>
                    </BottomRow>
                </>
            )}
        </InputContainer>
    );
});

export default ChatInput;
