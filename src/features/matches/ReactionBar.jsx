import styled from "styled-components";
import { useState, useRef } from "react";
import { HiOutlineFaceSmile, HiPlus } from "react-icons/hi2";
import EmojiPicker from "../../ui/EmojiPicker";

const ReactionBarContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.6rem;
`;

const ReactionBadge = styled.button`
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0.8rem;
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
    font-size: 1.4rem;
    transition: all 0.2s;

    &:hover {
        border-color: var(--primary-button-color);
        background-color: var(--primary-button-color-light);
    }
`;

const ReactionEmoji = styled.span`
    font-size: 1.6rem;
`;

const ReactionCount = styled.span`
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--primary-text-color);
`;

const AddReactionButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.4rem;
    border-radius: var(--border-radius-sm);
    border: 1px dashed var(--primary-border-color);
    background-color: transparent;
    cursor: pointer;
    color: var(--tertiary-text-color);
    transition: all 0.2s;
    position: relative;

    &:hover {
        border-color: var(--primary-button-color);
        color: var(--primary-button-color);
        background-color: var(--secondary-background-color);
    }

    & svg {
        font-size: 1.6rem;
    }
`;

const PickerContainer = styled.div`
    position: relative;
    display: inline-block;
`;

function ReactionBar({
    groupedReactions,
    currentPlayerId,
    onToggleReaction,
    disabled = false,
}) {
    const [showPicker, setShowPicker] = useState(false);
    const addButtonRef = useRef(null);

    const reactionEntries = Object.values(groupedReactions || {});

    function handleReactionClick(reactionType) {
        if (disabled) return;
        onToggleReaction(reactionType);
    }

    function handleAddReaction(emoji) {
        if (disabled) return;
        onToggleReaction(emoji);
    }

    return (
        <ReactionBarContainer>
            {reactionEntries.map((reaction) => {
                const isActive = reaction.playerIds.includes(currentPlayerId);
                const playerNames = reaction.players
                    .map((p) => p.name)
                    .join(", ");

                return (
                    <ReactionBadge
                        key={reaction.type}
                        $isActive={isActive}
                        onClick={() => handleReactionClick(reaction.type)}
                        title={playerNames}
                        disabled={disabled}
                    >
                        <ReactionEmoji>{reaction.type}</ReactionEmoji>
                        <ReactionCount>{reaction.count}</ReactionCount>
                    </ReactionBadge>
                );
            })}

            <PickerContainer>
                <AddReactionButton
                    ref={addButtonRef}
                    onClick={() => setShowPicker(!showPicker)}
                    title="Add reaction"
                    disabled={disabled}
                >
                    <HiOutlineFaceSmile />
                    <HiPlus style={{ fontSize: "1rem" }} />
                </AddReactionButton>

                {showPicker && (
                    <EmojiPicker
                        onSelect={handleAddReaction}
                        onClose={() => setShowPicker(false)}
                        position="bottom"
                        align="left"
                        triggerRef={addButtonRef}
                    />
                )}
            </PickerContainer>
        </ReactionBarContainer>
    );
}

export default ReactionBar;
