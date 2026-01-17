import styled, { css, keyframes } from "styled-components";
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
} from "react-icons/hi2";
import { PiGifBold, PiStickerBold } from "react-icons/pi";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { usePlayers } from "../../hooks/usePlayers";
import { useKicker } from "../../contexts/KickerContext";
import { useKeyboard } from "../../contexts/KeyboardContext";
import { useDarkMode } from "../../contexts/DarkModeContext";
import { MAX_CHAT_MESSAGE_LENGTH, DEFAULT_AVATAR } from "../../utils/constants";
import Avatar from "../../ui/Avatar";
import GifPickerInline from "./GifPickerInline";
import MatchDropdown from "../../ui/MatchDropdown";
import SpinnerMini from "../../ui/SpinnerMini";
import MentionText from "../../ui/MentionText";
import RichTextInput from "../../ui/RichTextInput";
import { getMatch, formatMatchDisplay } from "../../services/apiMatches";
import { useCanUploadImages } from "../../hooks/useCanUploadImages";
import { useImageUpload } from "../../hooks/useImageUpload";
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
const scaleIn = keyframes`
    0% { transform: scale(0); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
`;

const scaleOut = keyframes`
    0% { transform: scale(1); opacity: 1; }
    100% { transform: scale(0); opacity: 0; }
`;

const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
`;

const fadeOut = keyframes`
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(10px); }
`;

// Main Container
const InputContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    padding: 1rem 1.5rem;
    background-color: var(--secondary-background-color);
    border-top: 1px solid var(--primary-border-color);
`;

// Banners
const ReplyBanner = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.8rem 1.2rem;
    background-color: var(--tertiary-background-color);
    border-radius: var(--border-radius-md);
    border-left: 3px solid var(--primary-button-color);
`;

const ReplyMediaPreview = styled.img`
    width: 4rem;
    height: 4rem;
    object-fit: cover;
    border-radius: var(--border-radius-sm);
    flex-shrink: 0;
`;

const WhisperBanner = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.8rem 1.2rem;
    background-color: rgba(34, 197, 94, 0.12);
    border-radius: var(--border-radius-md);
    border-left: 3px solid var(--color-green-500);
`;

const BannerContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    flex: 1;
    min-width: 0;
`;

const BannerLabel = styled.span`
    font-size: 1.2rem;
    color: ${(props) =>
        props.$whisper
            ? "var(--color-green-500)"
            : "var(--primary-button-color)"};
    font-weight: 600;
`;

const BannerText = styled.span`
    font-size: 1.3rem;
    color: var(--secondary-text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const CloseButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    border: none;
    background: transparent;
    color: var(--tertiary-text-color);
    cursor: pointer;
    border-radius: var(--border-radius-sm);
    transition: all 0.15s;

    &:hover {
        color: var(--primary-text-color);
        background-color: var(--quaternary-background-color);
    }

    & svg {
        font-size: 1.8rem;
    }
`;

// WhatsApp/Discord-style Input Wrapper
const InputWrapper = styled.div`
    display: flex;
    align-items: center;
    background-color: var(--tertiary-background-color);
    border-radius: 2.4rem;
    padding: 0.4rem 0.6rem 0.4rem 0.4rem;
    gap: 0.4rem;
    min-height: 4.8rem;
    position: relative;
    border: 1px solid var(--primary-border-color);
    transition: border-color 0.2s, box-shadow 0.2s;

    &:focus-within {
        border-color: var(--color-brand-500);
        box-shadow: 0 0 0 2px rgba(var(--color-brand-500-rgb), 0.1);
    }
`;

const AvatarWrapper = styled.div`
    flex-shrink: 0;
    padding: 0.4rem 0 0.4rem 0.4rem;
    align-self: center;
`;

const TextInputArea = styled.div`
    flex: 1;
    min-width: 0;
    position: relative;
    padding: 0.2rem 0;

    /* Override RichTextInput styles for modern look - only target the RichTextInput, not dropdowns */
    & > div:first-child {
        border: none !important;
        background: transparent !important;
        padding: 0.6rem 0.8rem !important;
        min-height: 3.2rem !important;
        font-size: 1.5rem !important;
        border-radius: 0 !important;
        line-height: 1.5 !important;
    }

    & > div:first-child:focus {
        box-shadow: none !important;
    }
`;

const ActionsWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 0.2rem;
    flex-shrink: 0;
    align-self: flex-end;
    padding-bottom: 0.4rem;
`;

// Sticker/Media Button
const StickerButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.6rem;
    height: 3.6rem;
    border: none;
    background: transparent;
    color: var(--secondary-text-color);
    cursor: pointer;
    border-radius: 50%;
    transition: all 0.15s;
    position: relative;

    &:hover:not(:disabled) {
        color: var(--primary-button-color);
        background-color: var(--quaternary-background-color);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    & svg {
        font-size: 2.2rem;
    }

    ${(props) =>
        props.$active &&
        css`
            color: var(--primary-button-color);
            background-color: var(--quaternary-background-color);
        `}
`;

// Send Button with Animation
const SendButtonWrapper = styled.div`
    width: ${(props) => (props.$visible ? "3.6rem" : "0")};
    height: 3.6rem;
    position: relative;
    overflow: hidden;
    transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
`;

const SendButton = styled.button`
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.6rem;
    height: 3.6rem;
    border: none;
    background-color: var(--primary-button-color);
    color: var(--primary-button-color-text);
    cursor: pointer;
    border-radius: 50%;
    transform-origin: center;
    transition: background-color 0.15s;

    ${(props) =>
        props.$visible
            ? css`
                  animation: ${scaleIn} 0.2s
                      cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
              `
            : css`
                  animation: ${scaleOut} 0.15s ease-in forwards;
                  pointer-events: none;
              `}

    &:hover:not(:disabled) {
        background-color: var(--primary-button-color-hover);
    }

    &:active:not(:disabled) {
        transform: scale(0.92);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    & svg {
        font-size: 1.8rem;
        margin-left: 2px;
    }
`;

// Media Picker Overlay (Discord-style popup)
const MediaPickerOverlay = styled.div`
    position: absolute;
    bottom: calc(100% + 0.8rem);
    right: 0;
    background-color: var(--secondary-background-color);
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-lg);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    overflow: hidden;
    width: 35.2rem;

    ${(props) =>
        props.$visible
            ? css`
                  animation: ${fadeIn} 0.2s ease-out forwards;
              `
            : css`
                  animation: ${fadeOut} 0.15s ease-in forwards;
                  pointer-events: none;
              `}
`;

const MediaPickerHeader = styled.div`
    display: flex;
    border-bottom: 1px solid var(--primary-border-color);
    background-color: var(--tertiary-background-color);
`;

const MediaTab = styled.button`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    padding: 1rem 1.2rem;
    border: none;
    background: transparent;
    color: ${(props) =>
        props.$active
            ? "var(--primary-button-color)"
            : "var(--secondary-text-color)"};
    font-size: 1.3rem;
    font-weight: ${(props) => (props.$active ? "600" : "500")};
    cursor: pointer;
    transition: all 0.15s;
    border-bottom: 2px solid
        ${(props) =>
            props.$active ? "var(--primary-button-color)" : "transparent"};

    &:hover:not(:disabled) {
        color: var(--primary-button-color);
        background-color: var(--quaternary-background-color);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    & svg {
        font-size: 1.8rem;
    }
`;

const MediaPickerContent = styled.div`
    height: 40rem;
    overflow: hidden;
    position: relative;
`;

const MediaGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    padding: 1.5rem;
    height: 100%;
    align-content: start;
`;

const MediaOption = styled.button`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 2.5rem 1.5rem;
    border: 2px dashed var(--primary-border-color);
    background: var(--tertiary-background-color);
    color: var(--secondary-text-color);
    font-size: 1.4rem;
    font-weight: 500;
    cursor: pointer;
    border-radius: var(--border-radius-md);
    transition: all 0.15s;

    &:hover:not(:disabled) {
        border-color: var(--primary-button-color);
        color: var(--primary-button-color);
        background-color: var(--quaternary-background-color);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    & svg {
        font-size: 3.2rem;
    }
`;

// Embedded Picker Wrapper (for inline pickers)
const EmbeddedPickerWrapper = styled.div`
    height: 100%;
    overflow: hidden;

    // gib nur dem allerersten div children height: -webkit-fill-available;
    & > div:first-child {
        height: -webkit-fill-available;
    }

    /* Override emoji-mart picker styles for embedded use */
    & em-emoji-picker {
        width: 100% !important;
        height: 100% !important;
        --em-rgb-background: var(--secondary-background-color);

        // gib direkt parent div element height: -webkit-fill-available;
    }
`;

// Player Dropdown
const PlayerDropdown = styled.div`
    position: absolute;
    bottom: calc(100% + 0.4rem);
    left: 0;
    right: 0;
    max-height: 24rem;
    overflow-y: auto;
    background-color: var(--secondary-background-color);
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-md);
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.15);
    z-index: 9999;
`;

const PlayerItem = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.2rem;
    cursor: pointer;
    transition: background-color 0.15s;

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

// Upload Progress
const UploadProgress = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.8rem 1.2rem;
    background-color: var(--tertiary-background-color);
    border-radius: var(--border-radius-md);
    font-size: 1.3rem;
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
    width: ${(props) => props.$progress}%;
    transition: width 0.2s;
`;

// Content Preview
const ContentPreview = styled.div`
    padding: 1rem 1.2rem;
    background-color: var(--tertiary-background-color);
    border-radius: var(--border-radius-md);
    border: 1px solid var(--primary-border-color);
    font-size: 1.4rem;
    line-height: 1.5;
    color: var(--primary-text-color);
    word-break: break-word;
    white-space: pre-wrap;
`;

const PreviewLabel = styled.span`
    font-size: 1.2rem;
    color: var(--tertiary-text-color);
    display: block;
    margin-bottom: 0.6rem;
`;

// Bottom Info Row
const InfoRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0.8rem;
`;

const CharacterCount = styled.span`
    font-size: 1.2rem;
    color: ${(props) =>
        props.$isOverLimit
            ? "var(--color-red-700)"
            : "var(--tertiary-text-color)"};
`;

const HintText = styled.span`
    font-size: 1.2rem;
    color: var(--tertiary-text-color);
`;

const HiddenFileInput = styled.input`
    display: none;
`;

const ChatInputDesktop = forwardRef(function ChatInputDesktop(
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
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [mediaTab, setMediaTab] = useState("emoji"); // "emoji" | "gif" | "media"
    const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);
    const [showMatchDropdown, setShowMatchDropdown] = useState(false);
    const [playerSearch, setPlayerSearch] = useState("");
    const [matchSearch, setMatchSearch] = useState("");
    const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(0);
    const [selectedMatchIndex, setSelectedMatchIndex] = useState(0);
    const [dropdownMode, setDropdownMode] = useState(null);
    const [whisperRecipient, setWhisperRecipient] = useState(null);
    const [shouldRefocusAfterSubmit, setShouldRefocusAfterSubmit] =
        useState(false);
    const [showSendButton, setShowSendButton] = useState(false);

    const inputRef = useRef(null);
    const mediaPickerRef = useRef(null);
    const stickerButtonRef = useRef(null);
    const fileInputRef = useRef(null);

    const { players } = usePlayers();
    const { currentKicker: kicker } = useKicker();
    const { setInputFocused, setInputBlurred } = useKeyboard();
    const { isDarkMode } = useDarkMode();

    // Image upload permission and hook
    const { canUpload: canUploadImages } = useCanUploadImages();
    const { uploadImageFile, isUploading, progress } = useImageUpload();

    // Expose methods to parent via ref
    useImperativeHandle(
        ref,
        () => ({
            setWhisperRecipient: (player) => {
                setWhisperRecipient(player);
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
                let mentionText;
                if (player.isEveryone) {
                    mentionText = "@everyone ";
                } else {
                    mentionText = `@[${player.name}](${player.id}) `;
                }
                const currentContent = contentRef.current;
                const trimmed = currentContent.trimEnd();
                const newContent = trimmed
                    ? `${trimmed} ${mentionText}`
                    : mentionText;
                setContent(newContent);
                setTimeout(() => {
                    inputRef.current?.focus();
                    inputRef.current?.setCursorPosition(newContent.length);
                }, 50);
            },
        }),
        []
    );

    // Refocus input after submission
    useEffect(() => {
        if (shouldRefocusAfterSubmit && !isSubmitting) {
            inputRef.current?.focus();
            setShouldRefocusAfterSubmit(false);
        }
    }, [isSubmitting, shouldRefocusAfterSubmit]);

    // Track current content for focus function
    const contentRef = useRef(content);
    useEffect(() => {
        contentRef.current = content;
    }, [content]);

    // Track send button visibility
    useEffect(() => {
        setShowSendButton(content.trim().length > 0);
    }, [content]);

    // Close media picker when clicking outside
    useEffect(() => {
        if (!showMediaPicker) return;

        function handleClickOutside(e) {
            if (
                mediaPickerRef.current &&
                !mediaPickerRef.current.contains(e.target) &&
                stickerButtonRef.current &&
                !stickerButtonRef.current.contains(e.target)
            ) {
                setShowMediaPicker(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [showMediaPicker]);

    // Expose focus function to parent
    useEffect(() => {
        if (onFocusInput) {
            onFocusInput(() => {
                inputRef.current?.focus();
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

    // Filter players by search term
    const filteredPlayers = useMemo(() => {
        let filtered;
        if (!playerSearch) {
            filtered = availablePlayers;
        } else {
            filtered = availablePlayers.filter((player) =>
                player.name.toLowerCase().includes(playerSearch.toLowerCase())
            );
        }

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
        const whisperMatch = value.match(/^\/(?:w|whisper)\s+(\S*)/i);
        if (whisperMatch) {
            return { command: "whisper", search: whisperMatch[1] || "" };
        }

        const replyMatch = value.match(/^\/(?:r|reply)(?:\s|$)/i);
        if (replyMatch && lastWhisperFrom) {
            return { command: "reply", recipient: lastWhisperFrom };
        }

        return null;
    }

    // Handle content change
    function handleContentChange(newValue) {
        setContent(newValue);

        if (onTyping) {
            onTyping(whisperRecipient?.id || null);
        }

        if (whisperRecipient) return;

        const parsed = parseCommand(newValue);
        if (parsed) {
            if (parsed.command === "whisper") {
                setPlayerSearch(parsed.search);
                setDropdownMode("whisper");
                setShowPlayerDropdown(true);
                return;
            }
            if (parsed.command === "reply" && parsed.recipient) {
                setWhisperRecipient(parsed.recipient);
                setContent("");
                setShowPlayerDropdown(false);
                setDropdownMode(null);
                setTimeout(() => inputRef.current?.focus(), 0);
                return;
            }
        }
    }

    // Handle @ mention trigger
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

    // Handle # match trigger
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

    // Handle match selection
    function handleSelectMatch(match, display) {
        inputRef.current?.insertMatch(match, display);
        setShowMatchDropdown(false);
        setMatchSearch("");
        setSelectedMatchIndex(0);
    }

    // Handle pasted match URLs
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
                        inputRef.current?.replaceMatchPlaceholder(
                            matchId,
                            `Match ${matchId}`
                        );
                    }
                } catch (error) {
                    console.error("Failed to load match:", error);
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
        } else if (e.key === "Escape") {
            if (showMediaPicker) {
                setShowMediaPicker(false);
            } else if (whisperRecipient) {
                setWhisperRecipient(null);
            } else if (replyTo) {
                onCancelReply?.();
            }
        }
    }

    function handleSelectPlayer(player) {
        if (dropdownMode === "whisper") {
            setWhisperRecipient(player);
            setContent("");
            setShowPlayerDropdown(false);
            setDropdownMode(null);
            setPlayerSearch("");
            setTimeout(() => inputRef.current?.focus(), 0);
        } else if (dropdownMode === "mention") {
            inputRef.current?.insertMention(player);
            setShowPlayerDropdown(false);
            setDropdownMode(null);
            setPlayerSearch("");
        }
    }

    function handleEmojiSelect(emoji) {
        inputRef.current?.insertText(emoji);
        // Keep picker open for multiple selections
    }

    function handleSubmit() {
        if (!canSubmit) return;

        const input = inputRef.current;

        onSubmit({
            content: content.trim(),
            recipientId: whisperRecipient?.id || null,
            replyToId: replyTo?.id || null,
        });

        setContent("");
        setWhisperRecipient(null);
        setShowMediaPicker(false);
        setShouldRefocusAfterSubmit(true);

        if (input) {
            input.focus();
            requestAnimationFrame(() => input.focus());
        }
    }

    function handleCancelWhisper() {
        if (stopTyping) stopTyping();
        setWhisperRecipient(null);
        if (content.trim() && onTyping) onTyping(null);
        inputRef.current?.focus();
    }

    function handleGifSelect(gifUrl) {
        inputRef.current?.insertGif(gifUrl);
        setShowMediaPicker(false);
    }

    // Handle image file selection
    async function handleImageSelect(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = "";

        try {
            const imageTag = await uploadImageFile(file);
            setContent((prev) => {
                if (prev && !prev.endsWith(" ") && !prev.endsWith("\n")) {
                    return prev + " " + imageTag;
                }
                return prev + imageTag;
            });
            inputRef.current?.focus();
            setShowMediaPicker(false);
        } catch (err) {
            toast.error(err.message || "Failed to upload image");
        }
    }

    // Handle pasted images
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

    function toggleMediaPicker() {
        setShowMediaPicker(!showMediaPicker);
    }

    // Check if content has GIFs or images
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
        return "Type a message...";
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
                    <BannerContent>
                        <BannerLabel>
                            Replying to {replyTo.player?.name}
                        </BannerLabel>
                        <BannerText>
                            {formatReplyPreview(replyTo.content, 60)}
                        </BannerText>
                    </BannerContent>
                    <CloseButton onClick={onCancelReply}>
                        <HiXMark />
                    </CloseButton>
                </ReplyBanner>
            )}

            {/* Whisper Banner */}
            {whisperRecipient && (
                <WhisperBanner>
                    <HiChatBubbleLeftRight
                        style={{
                            fontSize: "1.8rem",
                            color: "var(--color-green-500)",
                        }}
                    />
                    <Avatar
                        src={whisperRecipient.avatar || DEFAULT_AVATAR}
                        $size="small"
                    />
                    <BannerContent>
                        <BannerLabel $whisper>
                            Whispering to {whisperRecipient.name}
                        </BannerLabel>
                    </BannerContent>
                    <CloseButton onClick={handleCancelWhisper}>
                        <HiXMark />
                    </CloseButton>
                </WhisperBanner>
            )}

            {/* Content Preview */}
            {needsPreview && (
                <ContentPreview>
                    <PreviewLabel>Preview:</PreviewLabel>
                    <MentionText content={content} />
                </ContentPreview>
            )}

            {/* Upload Progress */}
            {isUploading && (
                <UploadProgress>
                    <HiPhoto style={{ fontSize: "1.8rem" }} />
                    <span>Uploading image...</span>
                    <ProgressBar>
                        <ProgressFill $progress={progress} />
                    </ProgressBar>
                    <span>{progress}%</span>
                </UploadProgress>
            )}

            {/* Hidden file input */}
            <HiddenFileInput
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageSelect}
            />

            {/* Main Input Wrapper */}
            <InputWrapper>
                <AvatarWrapper>
                    <Avatar
                        $size="xs"
                        src={currentPlayer.avatar || DEFAULT_AVATAR}
                        alt={currentPlayer.name}
                    />
                </AvatarWrapper>

                <TextInputArea>
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

                    {/* Match Dropdown */}
                    {showMatchDropdown && (
                        <MatchDropdown
                            search={matchSearch}
                            selectedIndex={selectedMatchIndex}
                            onSelect={handleSelectMatch}
                        />
                    )}

                    {/* Player Dropdown */}
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
                                    <PlayerName>No players found</PlayerName>
                                </PlayerItem>
                            )}
                        </PlayerDropdown>
                    )}
                </TextInputArea>

                <ActionsWrapper>
                    {/* Sticker/Media Button */}
                    <StickerButton
                        ref={stickerButtonRef}
                        onClick={toggleMediaPicker}
                        disabled={isSubmitting}
                        $active={showMediaPicker}
                        title="Add media, GIF, or emoji"
                    >
                        <PiStickerBold />
                    </StickerButton>

                    {/* Send Button */}
                    <SendButtonWrapper
                        $visible={showSendButton || isSubmitting}
                    >
                        <SendButton
                            $visible={showSendButton || isSubmitting}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={handleSubmit}
                            disabled={!canSubmit || isUploading}
                            title="Send message (Enter)"
                        >
                            {isSubmitting ? (
                                <SpinnerMini />
                            ) : (
                                <HiPaperAirplane />
                            )}
                        </SendButton>
                    </SendButtonWrapper>
                </ActionsWrapper>

                {/* Media Picker Overlay */}
                {showMediaPicker && (
                    <MediaPickerOverlay
                        ref={mediaPickerRef}
                        $visible={showMediaPicker}
                    >
                        <MediaPickerHeader>
                            <MediaTab
                                $active={mediaTab === "emoji"}
                                onClick={() => setMediaTab("emoji")}
                            >
                                <HiOutlineFaceSmile />
                                Emoji
                            </MediaTab>
                            <MediaTab
                                $active={mediaTab === "gif"}
                                onClick={() => setMediaTab("gif")}
                            >
                                <PiGifBold />
                                GIF
                            </MediaTab>
                            <MediaTab
                                $active={mediaTab === "media"}
                                onClick={() => setMediaTab("media")}
                                disabled={!canUploadImages}
                            >
                                <HiPhoto />
                                Media
                            </MediaTab>
                        </MediaPickerHeader>
                        <MediaPickerContent>
                            {mediaTab === "emoji" && (
                                <EmbeddedPickerWrapper>
                                    <Picker
                                        data={data}
                                        onEmojiSelect={(emoji) =>
                                            handleEmojiSelect(emoji.native)
                                        }
                                        theme={isDarkMode ? "dark" : "light"}
                                        previewPosition="none"
                                        skinTonePosition="none"
                                        maxFrequentRows={2}
                                    />
                                </EmbeddedPickerWrapper>
                            )}
                            {mediaTab === "gif" && (
                                <GifPickerInline onSelect={handleGifSelect} />
                            )}
                            {mediaTab === "media" && (
                                <MediaGrid>
                                    <MediaOption
                                        onClick={handleImageButtonClick}
                                        disabled={isUploading}
                                    >
                                        <HiPhoto />
                                        Upload Image
                                    </MediaOption>
                                </MediaGrid>
                            )}
                        </MediaPickerContent>
                    </MediaPickerOverlay>
                )}
            </InputWrapper>

            {/* Info Row */}
            <InfoRow>
                <CharacterCount $isOverLimit={isOverLimit}>
                    {content.length} / {MAX_CHAT_MESSAGE_LENGTH}
                </CharacterCount>
                {!whisperRecipient && !replyTo && (
                    <HintText>
                        @ mention • # match • /w whisper • /r reply
                    </HintText>
                )}
            </InfoRow>
        </InputContainer>
    );
});

export default ChatInputDesktop;
