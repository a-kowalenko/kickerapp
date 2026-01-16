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
    HiPlus,
} from "react-icons/hi2";
import { PiGifBold } from "react-icons/pi";
import { usePlayers } from "../../hooks/usePlayers";
import { useKicker } from "../../contexts/KickerContext";
import { useKeyboard } from "../../contexts/KeyboardContext";
import { MAX_CHAT_MESSAGE_LENGTH, DEFAULT_AVATAR } from "../../utils/constants";
import Avatar from "../../ui/Avatar";
import EmojiPicker from "../../ui/EmojiPicker";
import GifPicker from "../../ui/GifPicker";
import RichTextInput from "../../ui/RichTextInput";
import SpinnerMini from "../../ui/SpinnerMini";
import MentionText from "../../ui/MentionText";
import { useCanUploadImages } from "../../hooks/useCanUploadImages";
import { useImageUpload } from "../../hooks/useImageUpload";
import { useOwnPlayer } from "../../hooks/useOwnPlayer";

// Animations
const scaleIn = keyframes`
    0% { transform: scale(0) rotate(-180deg); opacity: 0; }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
`;

const scaleOut = keyframes`
    0% { transform: scale(1) rotate(0deg); opacity: 1; }
    100% { transform: scale(0) rotate(180deg); opacity: 0; }
`;

const Container = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    background-color: var(--secondary-background-color);
    border-top: 1px solid var(--primary-border-color);
    padding: 0.8rem;
    padding-bottom: calc(0.8rem + env(safe-area-inset-bottom, 0px));
    gap: 0.6rem;
    flex-shrink: 0;
    /* Prevent zoom on mobile */
    touch-action: manipulation;
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

const WhisperBanner = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.6rem 1rem;
    background-color: rgba(34, 197, 94, 0.15);
    border-radius: var(--border-radius-sm);
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
    font-size: 1.1rem;
    color: ${(props) =>
        props.$whisper
            ? "var(--color-green-500)"
            : "var(--primary-button-color)"};
    font-weight: 600;
`;

const BannerText = styled.span`
    font-size: 1.2rem;
    color: var(--secondary-text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const CloseButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.4rem;
    border: none;
    background: transparent;
    color: var(--tertiary-text-color);
    cursor: pointer;
    border-radius: var(--border-radius-sm);

    &:active {
        background-color: var(--quaternary-background-color);
    }

    & svg {
        font-size: 1.6rem;
    }
`;

/* WhatsApp-style input wrapper */
const InputWrapper = styled.div`
    display: flex;
    align-items: center;
    background-color: var(--tertiary-background-color);
    border-radius: 2.4rem;
    padding: 0.3rem 0.4rem;
    gap: 0.2rem;
    min-height: 4.4rem;
    position: relative;
`;

const TextInputArea = styled.div`
    flex: 1;
    min-width: 0;
    position: relative;

    /* Override RichTextInput styles for mobile */
    /* font-size 16px prevents iOS auto-zoom on focus */
    & > div {
        border: none !important;
        background: transparent !important;
        padding: 0.6rem 0.4rem !important;
        min-height: 3.2rem !important;
        font-size: 16px !important;
        border-radius: 0 !important;
    }
`;

const SendButtonWrapper = styled.div`
    width: 3.2rem;
    height: 3.2rem;
    position: relative;
    flex-shrink: 0;
`;

const SendButton = styled.button`
    position: absolute;
    top: 0;
    left: 0;
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
    transform-origin: center;

    ${(props) =>
        props.$visible
            ? css`
                  animation: ${scaleIn} 0.25s
                      cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
              `
            : css`
                  animation: ${scaleOut} 0.2s ease-in forwards;
                  pointer-events: none;
              `}

    &:active:not(:disabled) {
        transform: scale(0.9);
    }

    &:disabled {
        opacity: 0.5;
    }

    & svg {
        font-size: 1.6rem;
        margin-left: 2px;
    }
`;

/* Plus button inside input */
const PlusButton = styled.button`
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
    flex-shrink: 0;
    transition: all 0.2s ease;

    &:active {
        background-color: var(--quaternary-background-color);
    }

    & svg {
        font-size: 2.2rem;
        transition: transform 0.2s ease;
    }

    ${(props) =>
        props.$open &&
        css`
            color: var(--primary-button-color);

            & svg {
                transform: rotate(45deg);
            }
        `}
`;

/* Bottom Sheet styles - Discord mobile style */
const slideUp = keyframes`
    from {
        transform: translateY(100%);
    }
    to {
        transform: translateY(0);
    }
`;

const fadeIn = keyframes`
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
`;

const BottomSheetBackdrop = styled.div`
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999;
    animation: ${fadeIn} 0.2s ease;
`;

const BottomSheet = styled.div`
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: var(--secondary-background-color);
    border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
    z-index: 999;
    animation: ${slideUp} 0.25s cubic-bezier(0.32, 0.72, 0, 1);
    padding-bottom: calc(7rem + env(safe-area-inset-bottom, 0));
    touch-action: none;
    will-change: transform;
`;

const BottomSheetHandle = styled.div`
    display: flex;
    justify-content: center;
    padding: 1rem 0 0.6rem;

    &::after {
        content: "";
        width: 3.6rem;
        height: 0.4rem;
        background-color: var(--primary-border-color);
        border-radius: 0.2rem;
    }
`;

const BottomSheetContent = styled.div`
    padding: 0.8rem 1rem 2rem;
`;

const BottomSheetItem = styled.button`
    display: flex;
    align-items: center;
    gap: 1.4rem;
    width: 100%;
    padding: 1.4rem 1.2rem;
    border: none;
    background: transparent;
    color: var(--primary-text-color);
    font-size: 1.6rem;
    cursor: pointer;
    border-radius: var(--border-radius-md);
    transition: background-color 0.15s;

    &:active {
        background-color: var(--tertiary-background-color);
    }

    & svg {
        font-size: 2.4rem;
        color: var(--secondary-text-color);
    }
`;

const PlayerDropdown = styled.div`
    position: absolute;
    bottom: calc(100% + 0.4rem);
    left: 0;
    right: 0;
    max-height: 20rem;
    overflow-y: auto;
    background-color: var(--secondary-background-color);
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-md);
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
    z-index: 100;
`;

const PlayerItem = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 1rem 1.2rem;
    cursor: pointer;
    transition: background-color 0.15s;

    &:active,
    &[data-selected="true"] {
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
    width: ${(props) => props.$progress}%;
    transition: width 0.2s;
`;

const PickerWrapper = styled.div`
    position: relative;
`;

const ChatInputMobile = forwardRef(function ChatInputMobile(
    {
        onSubmit,
        isSubmitting,
        replyTo,
        onCancelReply,
        lastWhisperFrom,
        onTyping,
        stopTyping,
    },
    ref
) {
    const [content, setContent] = useState("");
    const [showPlusMenu, setShowPlusMenu] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);
    const [playerSearch, setPlayerSearch] = useState("");
    const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(0);
    const [dropdownMode, setDropdownMode] = useState(null);
    const [whisperRecipient, setWhisperRecipient] = useState(null);
    const [hasContent, setHasContent] = useState(false);

    // Bottom sheet swipe state
    const [sheetTranslateY, setSheetTranslateY] = useState(0);
    const sheetRef = useRef(null);
    const dragStartY = useRef(0);
    const isDragging = useRef(false);

    const inputRef = useRef(null);
    const inputWrapperRef = useRef(null);
    const fileInputRef = useRef(null);
    const { players } = usePlayers();
    const { currentKicker: kicker } = useKicker();
    const { setInputFocused, setInputBlurred } = useKeyboard();
    const { data: currentPlayer } = useOwnPlayer();

    const { canUpload: canUploadImages } = useCanUploadImages();
    const { uploadImageFile, isUploading, progress } = useImageUpload();

    // Expose methods to parent
    useImperativeHandle(
        ref,
        () => ({
            setWhisperRecipient: (player) => {
                setWhisperRecipient(player);
                inputRef.current?.focus?.();
            },
            insertMention: (player) => {
                inputRef.current?.insertMention?.(player.name, player.id);
                inputRef.current?.focus?.();
            },
            focus: () => inputRef.current?.focus?.(),
        }),
        []
    );

    // Track if there's content for send button visibility
    useEffect(() => {
        const trimmed = content.trim();
        setHasContent(trimmed.length > 0);
    }, [content]);

    // Filter players
    const availablePlayers = useMemo(
        () => players?.filter((p) => p.id !== currentPlayer?.id) || [],
        [players, currentPlayer?.id]
    );

    const EVERYONE_OPTION = useMemo(
        () => ({ id: "everyone", name: "everyone", isEveryone: true }),
        []
    );

    const filteredPlayers = useMemo(() => {
        if (!showPlayerDropdown || dropdownMode !== "mention") return [];
        const search = (playerSearch || "").toLowerCase();
        let filtered = availablePlayers.filter((p) =>
            p.name?.toLowerCase().includes(search)
        );
        // Add @everyone for mentions (not whispers)
        if ("everyone".includes(search)) {
            filtered = [EVERYONE_OPTION, ...filtered];
        }
        return filtered.slice(0, 8);
    }, [
        availablePlayers,
        playerSearch,
        showPlayerDropdown,
        dropdownMode,
        EVERYONE_OPTION,
    ]);

    useEffect(() => {
        setSelectedPlayerIndex(0);
    }, [filteredPlayers.length]);

    const isOverLimit = content.length > MAX_CHAT_MESSAGE_LENGTH;
    const canSubmit = hasContent && !isOverLimit && !isSubmitting;

    // Parse command from input
    function parseCommand(value) {
        const whisperMatch = value.match(/^\/(?:w|whisper)\s+(\S+)\s*/i);
        if (whisperMatch) {
            return {
                type: "whisper",
                name: whisperMatch[1],
                remaining: value.slice(whisperMatch[0].length),
            };
        }
        const replyMatch = value.match(/^\/(?:r|reply)\s*/i);
        if (replyMatch && lastWhisperFrom) {
            return {
                type: "reply",
                player: lastWhisperFrom,
                remaining: value.slice(replyMatch[0].length),
            };
        }
        return null;
    }

    function handleContentChange(newValue) {
        setContent(newValue);
        onTyping?.(whisperRecipient?.id);

        const command = parseCommand(newValue);
        if (command?.type === "whisper") {
            const matchedPlayer = availablePlayers.find(
                (p) => p.name?.toLowerCase() === command.name.toLowerCase()
            );
            if (matchedPlayer) {
                setWhisperRecipient(matchedPlayer);
                setContent(command.remaining);
                inputRef.current?.setContent?.(command.remaining);
            }
        } else if (command?.type === "reply") {
            setWhisperRecipient(command.player);
            setContent(command.remaining);
            inputRef.current?.setContent?.(command.remaining);
        }
    }

    // Only trigger mention dropdown when @ is typed followed by search text
    function handleMentionTrigger(search) {
        if (typeof search === "string") {
            setPlayerSearch(search);
            setDropdownMode("mention");
            setShowPlayerDropdown(true);
            // Close pickers when mentioning
            setShowEmojiPicker(false);
            setShowGifPicker(false);
        }
    }

    function handleMentionCancel() {
        setShowPlayerDropdown(false);
        setPlayerSearch("");
        setDropdownMode(null);
    }

    function handleSelectPlayer(player) {
        if (dropdownMode === "mention") {
            if (player.isEveryone) {
                inputRef.current?.insertEveryoneMention?.();
            } else {
                inputRef.current?.insertMention?.(player.name, player.id);
            }
        }
        handleMentionCancel();
    }

    function handleKeyDown(e) {
        if (showPlayerDropdown && filteredPlayers.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedPlayerIndex((i) =>
                    Math.min(i + 1, filteredPlayers.length - 1)
                );
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedPlayerIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                handleSelectPlayer(filteredPlayers[selectedPlayerIndex]);
            } else if (e.key === "Escape") {
                handleMentionCancel();
            }
            return;
        }

        if (e.key === "Escape") {
            setShowPlusMenu(false);
            setShowEmojiPicker(false);
            setShowGifPicker(false);
        }
    }

    function handleTogglePlusMenu() {
        const newState = !showPlusMenu;
        setShowPlusMenu(newState);
        if (newState) {
            setSheetTranslateY(0); // Reset position when opening
        }
        setShowEmojiPicker(false);
        setShowGifPicker(false);
    }

    function closePlusMenu() {
        setShowPlusMenu(false);
        setSheetTranslateY(0);
    }

    // Bottom sheet swipe handlers
    function handleSheetTouchStart(e) {
        dragStartY.current = e.touches[0].clientY;
        isDragging.current = true;
        // Remove animation during drag
        if (sheetRef.current) {
            sheetRef.current.style.animation = "none";
        }
    }

    function handleSheetTouchMove(e) {
        if (!isDragging.current) return;
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - dragStartY.current;
        // Only allow dragging down (positive deltaY)
        if (deltaY > 0) {
            setSheetTranslateY(deltaY);
        }
    }

    function handleSheetTouchEnd() {
        isDragging.current = false;
        // If dragged more than 100px or 30% of sheet height, close it
        const threshold = sheetRef.current?.offsetHeight * 0.3 || 100;
        if (sheetTranslateY > threshold) {
            closePlusMenu();
        } else {
            // Snap back
            setSheetTranslateY(0);
        }
    }

    function handlePlusMenuEmoji() {
        closePlusMenu();
        setShowEmojiPicker(true);
        setShowGifPicker(false);
    }

    function handlePlusMenuGif() {
        closePlusMenu();
        setShowGifPicker(true);
        setShowEmojiPicker(false);
    }

    function handlePlusMenuImage() {
        closePlusMenu();
        fileInputRef.current?.click();
    }

    function handleEmojiSelect(emoji) {
        inputRef.current?.insertText?.(emoji);
        inputRef.current?.focus?.();
    }

    function handleGifSelect(gifUrl) {
        inputRef.current?.insertGif?.(gifUrl);
        setShowGifPicker(false);
        inputRef.current?.focus?.();
    }

    async function handleImageSelect(e) {
        const file = e.target.files?.[0];
        if (!file || !canUploadImages) return;
        e.target.value = "";

        const url = await uploadImageFile(file);
        if (url) {
            inputRef.current?.appendImageTag?.(url);
            inputRef.current?.focus?.();
        }
    }

    const handleImagePaste = useCallback(
        async (file) => {
            if (!canUploadImages) return;
            const url = await uploadImageFile(file);
            if (url) {
                inputRef.current?.appendImageTag?.(url);
            }
        },
        [canUploadImages, uploadImageFile]
    );

    function handleSubmit() {
        if (!canSubmit) return;

        const messageData = {
            playerId: currentPlayer.id,
            content: content.trim(),
            kicker_id: kicker,
        };

        if (replyTo) {
            messageData.reply_to_id = replyTo.id;
        }
        if (whisperRecipient) {
            messageData.recipient_id = whisperRecipient.id;
        }

        onSubmit(messageData);
        setContent("");
        inputRef.current?.clear?.();
        setWhisperRecipient(null);
        onCancelReply?.();
        stopTyping?.();
    }

    function handleCancelWhisper() {
        setWhisperRecipient(null);
    }

    const placeholder = useMemo(() => {
        if (replyTo) return `Reply to ${replyTo.player?.name}...`;
        if (whisperRecipient) return `Whisper to ${whisperRecipient.name}...`;
        return "Message...";
    }, [replyTo, whisperRecipient]);

    if (!currentPlayer) return null;

    return (
        <Container>
            {/* Upload progress */}
            {isUploading && (
                <UploadProgress>
                    <SpinnerMini />
                    <ProgressBar>
                        <ProgressFill $progress={progress} />
                    </ProgressBar>
                    <span>{progress}%</span>
                </UploadProgress>
            )}

            {/* Reply banner */}
            {replyTo && (
                <ReplyBanner>
                    <BannerContent>
                        <BannerLabel>
                            Replying to {replyTo.player?.name}
                        </BannerLabel>
                        <BannerText>
                            <MentionText
                                text={replyTo.content}
                                maxLength={50}
                            />
                        </BannerText>
                    </BannerContent>
                    <CloseButton onClick={onCancelReply}>
                        <HiXMark />
                    </CloseButton>
                </ReplyBanner>
            )}

            {/* Whisper banner */}
            {whisperRecipient && !replyTo && (
                <WhisperBanner>
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

            {/* Player dropdown - positioned above the whole container */}
            {showPlayerDropdown && filteredPlayers.length > 0 && (
                <PlayerDropdown>
                    {filteredPlayers.map((player, index) => (
                        <PlayerItem
                            key={player.id}
                            data-selected={index === selectedPlayerIndex}
                            onClick={() => handleSelectPlayer(player)}
                        >
                            {player.isEveryone ? (
                                <>
                                    <span>@everyone</span>
                                    <EveryoneLabel>
                                        Notify all players
                                    </EveryoneLabel>
                                </>
                            ) : (
                                <>
                                    <Avatar
                                        src={player.avatar || DEFAULT_AVATAR}
                                        alt={player.name}
                                        size="small"
                                    />
                                    <PlayerName>{player.name}</PlayerName>
                                </>
                            )}
                        </PlayerItem>
                    ))}
                </PlayerDropdown>
            )}

            {/* Main input row: [+] [input] [send] - all inside one rounded container */}
            <InputWrapper ref={inputWrapperRef}>
                {/* Plus button */}
                <PlusButton
                    onClick={handleTogglePlusMenu}
                    $open={showPlusMenu}
                    type="button"
                >
                    <HiPlus />
                </PlusButton>

                <TextInputArea>
                    <RichTextInput
                        ref={inputRef}
                        value={content}
                        onChange={handleContentChange}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        onMentionTrigger={handleMentionTrigger}
                        onMentionCancel={handleMentionCancel}
                        onImagePaste={handleImagePaste}
                        onFocus={() => setInputFocused(inputRef)}
                        onBlur={() => setInputBlurred()}
                        maxHeight="120px"
                        minHeight="32px"
                    />
                </TextInputArea>

                <SendButtonWrapper>
                    <SendButton
                        $visible={hasContent}
                        onClick={handleSubmit}
                        disabled={!canSubmit || isSubmitting}
                        type="button"
                    >
                        {isSubmitting ? <SpinnerMini /> : <HiPaperAirplane />}
                    </SendButton>
                </SendButtonWrapper>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: "none" }}
                />
            </InputWrapper>

            {/* Bottom Sheet Menu - Discord mobile style */}
            {showPlusMenu && (
                <>
                    <BottomSheetBackdrop onClick={closePlusMenu} />
                    <BottomSheet
                        ref={sheetRef}
                        style={{
                            transform: `translateY(${sheetTranslateY}px)`,
                            transition: isDragging.current
                                ? "none"
                                : "transform 0.2s ease-out",
                        }}
                        onTouchStart={handleSheetTouchStart}
                        onTouchMove={handleSheetTouchMove}
                        onTouchEnd={handleSheetTouchEnd}
                    >
                        <BottomSheetHandle />
                        <BottomSheetContent>
                            <BottomSheetItem
                                onClick={handlePlusMenuEmoji}
                                type="button"
                            >
                                <HiOutlineFaceSmile />
                                Emoji
                            </BottomSheetItem>
                            <BottomSheetItem
                                onClick={handlePlusMenuGif}
                                type="button"
                            >
                                <PiGifBold />
                                GIF
                            </BottomSheetItem>
                            {canUploadImages && (
                                <BottomSheetItem
                                    onClick={handlePlusMenuImage}
                                    type="button"
                                >
                                    <HiPhoto />
                                    Upload Image
                                </BottomSheetItem>
                            )}
                        </BottomSheetContent>
                    </BottomSheet>
                </>
            )}

            {/* Emoji picker */}
            <PickerWrapper>
                {showEmojiPicker && (
                    <EmojiPicker
                        onSelect={handleEmojiSelect}
                        onClose={() => setShowEmojiPicker(false)}
                        position="top"
                        align="left"
                        triggerRef={inputWrapperRef}
                    />
                )}
            </PickerWrapper>

            {/* GIF picker */}
            <PickerWrapper>
                {showGifPicker && (
                    <GifPicker
                        onSelect={handleGifSelect}
                        onClose={() => setShowGifPicker(false)}
                        position="top"
                        align="left"
                        triggerRef={inputWrapperRef}
                    />
                )}
            </PickerWrapper>
        </Container>
    );
});

export default ChatInputMobile;
