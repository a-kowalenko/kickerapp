import styled from "styled-components";
import { useState, useRef, useEffect, useCallback } from "react";
import { HiOutlineFaceSmile, HiPaperAirplane, HiPhoto } from "react-icons/hi2";
import { PiGifBold } from "react-icons/pi";
import { usePlayers } from "../../hooks/usePlayers";
import { useKicker } from "../../contexts/KickerContext";
import { MAX_COMMENT_LENGTH } from "../../utils/constants";
import Avatar from "../../ui/Avatar";
import { DEFAULT_AVATAR } from "../../utils/constants";
import EmojiPicker from "../../ui/EmojiPicker";
import GifPicker from "../../ui/GifPicker";
import MatchDropdown from "../../ui/MatchDropdown";
import SpinnerMini from "../../ui/SpinnerMini";
import MentionText from "../../ui/MentionText";
import RichTextInput from "../../ui/RichTextInput";
import { getMatch, formatMatchDisplay } from "../../services/apiMatches";
import { useCanUploadImages } from "../../hooks/useCanUploadImages";
import { useImageUpload } from "../../hooks/useImageUpload";
import toast from "react-hot-toast";

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
    const [showMatchDropdown, setShowMatchDropdown] = useState(false);
    const [mentionSearch, setMentionSearch] = useState("");
    const [matchSearch, setMatchSearch] = useState("");
    const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
    const [selectedMatchIndex, setSelectedMatchIndex] = useState(0);
    const inputRef = useRef(null);
    const emojiButtonRef = useRef(null);
    const gifButtonRef = useRef(null);
    const fileInputRef = useRef(null);
    const { players } = usePlayers();
    const { currentKicker: kicker } = useKicker();

    // Image upload permission and hook
    const { canUpload: canUploadImages } = useCanUploadImages();
    const { uploadImageFile, isUploading, progress } = useImageUpload();

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

    // Handle content change from RichTextInput
    function handleContentChange(newValue) {
        setContent(newValue);
    }

    // Handle @ mention trigger from RichTextInput
    function handleMentionTrigger(search, atIndex) {
        if (search !== null && atIndex !== -1) {
            setMentionSearch(search);
            setShowMentionDropdown(true);
            setShowMatchDropdown(false);
        } else {
            setShowMentionDropdown(false);
            setMentionSearch("");
        }
    }

    // Handle # match trigger from RichTextInput
    function handleMatchTrigger(search, hashIndex) {
        if (search !== null && hashIndex !== -1) {
            setMatchSearch(search);
            setShowMatchDropdown(true);
            setShowMentionDropdown(false);
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
        // Use RichTextInput's insertMention method
        inputRef.current?.insertMention(player);
        setShowMentionDropdown(false);
        setMentionSearch("");
    }

    function handleEmojiSelect(emoji) {
        inputRef.current?.insertText(emoji);
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

    function handleSubmit() {
        if (!canSubmit) return;

        onSubmit(content.trim());
        setContent("");
    }

    if (!currentPlayer) return null;

    return (
        <InputContainer>
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
                        placeholder="Write a comment... @ mention, # match"
                        disabled={isSubmitting}
                    />
                    {showMatchDropdown && (
                        <MatchDropdown
                            search={matchSearch}
                            selectedIndex={selectedMatchIndex}
                            onSelect={handleSelectMatch}
                        />
                    )}
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
                    {/* Hidden file input for image upload */}
                    <HiddenFileInput
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleImageSelect}
                    />
                    {canUploadImages && (
                        <IconButton
                            onClick={handleImageButtonClick}
                            disabled={isSubmitting || isUploading}
                            title="Upload image (max 1MB)"
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
                        disabled={!canSubmit || isUploading}
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
