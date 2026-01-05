import styled from "styled-components";
import { HiOutlineSparkles, HiOutlinePhoto, HiCheck } from "react-icons/hi2";
import { useOwnPlayer } from "../../hooks/useOwnPlayer";
import {
    usePlayerUnlockedRewards,
    useUpdateSelectedReward,
} from "./usePlayerRewards";
import Spinner from "../../ui/Spinner";
import { media } from "../../utils/constants";

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 3.2rem;

    ${media.tablet} {
        padding: 0 1.2rem;
        gap: 2.4rem;
    }
`;

const Section = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
`;

const SectionHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
`;

const SectionIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    background: linear-gradient(
        135deg,
        var(--color-brand-500),
        var(--color-brand-700)
    );
    color: white;
    font-size: 2rem;

    ${media.mobile} {
        width: 3.2rem;
        height: 3.2rem;
        font-size: 1.6rem;
    }
`;

const SectionTitle = styled.h2`
    font-size: 2rem;
    font-weight: 600;
    color: var(--primary-text-color);
    margin: 0;

    ${media.mobile} {
        font-size: 1.6rem;
    }
`;

const SectionDescription = styled.p`
    font-size: 1.4rem;
    color: var(--secondary-text-color);
    margin: 0;
`;

const RewardGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(28rem, 1fr));
    gap: 1.6rem;

    ${media.mobile} {
        grid-template-columns: 1fr;
        gap: 1.2rem;
    }
`;

const RewardCard = styled.button`
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding: 1.6rem;
    background-color: ${(props) =>
        props.$isSelected
            ? "var(--achievement-unlocked-bg, var(--color-grey-50))"
            : "var(--color-grey-0)"};
    border: 1px solid
        ${(props) =>
            props.$isSelected
                ? "var(--achievement-unlocked-border, var(--color-brand-500))"
                : "var(--secondary-border-color)"};
    border-radius: var(--border-radius-md);
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    width: 100%;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &:disabled {
        cursor: default;
        opacity: 0.7;
        transform: none;
        box-shadow: none;
    }
`;

const RewardIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4.8rem;
    height: 4.8rem;
    border-radius: 50%;
    background: ${(props) =>
        props.$isSelected
            ? "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700))"
            : "var(--color-grey-200)"};
    color: ${(props) => (props.$isSelected ? "white" : "inherit")};
    font-size: 2rem;
    flex-shrink: 0;
    position: relative;
`;

const RewardContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    flex: 1;
    min-width: 0;
`;

const RewardName = styled.span`
    font-size: 1.6rem;
    font-weight: 600;
    color: ${(props) =>
        props.$isSelected
            ? "var(--color-brand-700)"
            : "var(--primary-text-color)"};
`;

const RewardDescription = styled.span`
    font-size: 1.2rem;
    color: var(--tertiary-text-color);
`;

const RewardPreview = styled.span`
    font-size: 1.3rem;
    color: var(--secondary-text-color);
    font-style: italic;
`;

const SelectedBadge = styled.div`
    position: absolute;
    bottom: -4px;
    right: -4px;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background-color: var(--color-green-700);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
`;

const EmptyMessage = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    background-color: var(--color-grey-50);
    border-radius: var(--border-radius-md);
    border: 1px dashed var(--secondary-border-color);
`;

const EmptyTitle = styled.h3`
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--primary-text-color);
    margin: 0 0 0.8rem 0;
`;

const EmptyText = styled.p`
    font-size: 1.4rem;
    color: var(--secondary-text-color);
    margin: 0;
`;

function RewardsOverview() {
    const { data: player, isLoading: isLoadingPlayer } = useOwnPlayer();
    const {
        titles,
        frames,
        isLoading: isLoadingRewards,
    } = usePlayerUnlockedRewards(player?.id);
    const { updateReward, isUpdating } = useUpdateSelectedReward();

    const isLoading = isLoadingPlayer || isLoadingRewards;

    if (isLoading) {
        return <Spinner />;
    }

    const handleSelectReward = (rewardType, rewardId) => {
        if (!player?.id) return;
        updateReward({
            playerId: player.id,
            rewardType,
            rewardId,
        });
    };

    const selectedTitleId = titles?.find((t) => t.is_selected)?.reward_id;
    const selectedFrameId = frames?.find((f) => f.is_selected)?.reward_id;

    return (
        <Container>
            {/* Titles Section */}
            <Section>
                <SectionHeader>
                    <SectionIcon>
                        <HiOutlineSparkles />
                    </SectionIcon>
                    <div>
                        <SectionTitle>Titles</SectionTitle>
                        <SectionDescription>
                            Show off your achievements with a title next to your
                            name
                        </SectionDescription>
                    </div>
                </SectionHeader>

                <RewardGrid>
                    {/* No Title option */}
                    <RewardCard
                        $isSelected={!selectedTitleId}
                        onClick={() => handleSelectReward("title", null)}
                        disabled={isUpdating}
                    >
                        <RewardIcon $isSelected={!selectedTitleId}>
                            🚫
                            {!selectedTitleId && (
                                <SelectedBadge>
                                    <HiCheck />
                                </SelectedBadge>
                            )}
                        </RewardIcon>
                        <RewardContent>
                            <RewardName $isSelected={!selectedTitleId}>
                                No Title
                            </RewardName>
                            <RewardDescription>
                                Display your name without a title
                            </RewardDescription>
                        </RewardContent>
                    </RewardCard>

                    {/* Unlocked Titles */}
                    {titles?.map((title) => (
                        <RewardCard
                            key={title.reward_id}
                            $isSelected={title.is_selected}
                            onClick={() =>
                                handleSelectReward("title", title.reward_id)
                            }
                            disabled={isUpdating}
                        >
                            <RewardIcon $isSelected={title.is_selected}>
                                {title.icon || "🏷️"}
                                {title.is_selected && (
                                    <SelectedBadge>
                                        <HiCheck />
                                    </SelectedBadge>
                                )}
                            </RewardIcon>
                            <RewardContent>
                                <RewardName $isSelected={title.is_selected}>
                                    {title.reward_name}
                                </RewardName>
                                <RewardPreview>
                                    {title.display_position === "prefix"
                                        ? `"${title.display_value} ${player.name}"`
                                        : `"${player.name}, ${title.display_value}"`}
                                </RewardPreview>
                                {title.achievement_name && (
                                    <RewardDescription>
                                        From: {title.achievement_name}
                                    </RewardDescription>
                                )}
                            </RewardContent>
                        </RewardCard>
                    ))}
                </RewardGrid>

                {(!titles || titles.length === 0) && (
                    <EmptyMessage>
                        <EmptyTitle>No titles unlocked yet</EmptyTitle>
                        <EmptyText>
                            Complete achievements to unlock titles for your
                            profile
                        </EmptyText>
                    </EmptyMessage>
                )}
            </Section>

            {/* Frames Section */}
            <Section>
                <SectionHeader>
                    <SectionIcon>
                        <HiOutlinePhoto />
                    </SectionIcon>
                    <div>
                        <SectionTitle>Avatar Frames</SectionTitle>
                        <SectionDescription>
                            Customize your avatar with unique frames
                        </SectionDescription>
                    </div>
                </SectionHeader>

                <RewardGrid>
                    {/* No Frame option */}
                    <RewardCard
                        $isSelected={!selectedFrameId}
                        onClick={() => handleSelectReward("frame", null)}
                        disabled={isUpdating}
                    >
                        <RewardIcon $isSelected={!selectedFrameId}>
                            🚫
                            {!selectedFrameId && (
                                <SelectedBadge>
                                    <HiCheck />
                                </SelectedBadge>
                            )}
                        </RewardIcon>
                        <RewardContent>
                            <RewardName $isSelected={!selectedFrameId}>
                                No Frame
                            </RewardName>
                            <RewardDescription>
                                Display your avatar without a frame
                            </RewardDescription>
                        </RewardContent>
                    </RewardCard>

                    {/* Unlocked Frames */}
                    {frames?.map((frame) => (
                        <RewardCard
                            key={frame.reward_id}
                            $isSelected={frame.is_selected}
                            onClick={() =>
                                handleSelectReward("frame", frame.reward_id)
                            }
                            disabled={isUpdating}
                        >
                            <RewardIcon $isSelected={frame.is_selected}>
                                {frame.icon || "🖼️"}
                                {frame.is_selected && (
                                    <SelectedBadge>
                                        <HiCheck />
                                    </SelectedBadge>
                                )}
                            </RewardIcon>
                            <RewardContent>
                                <RewardName $isSelected={frame.is_selected}>
                                    {frame.reward_name}
                                </RewardName>
                                {frame.reward_description && (
                                    <RewardDescription>
                                        {frame.reward_description}
                                    </RewardDescription>
                                )}
                                {frame.achievement_name && (
                                    <RewardDescription>
                                        From: {frame.achievement_name}
                                    </RewardDescription>
                                )}
                            </RewardContent>
                        </RewardCard>
                    ))}
                </RewardGrid>

                {(!frames || frames.length === 0) && (
                    <EmptyMessage>
                        <EmptyTitle>No frames unlocked yet</EmptyTitle>
                        <EmptyText>
                            Complete achievements to unlock avatar frames
                        </EmptyText>
                    </EmptyMessage>
                )}
            </Section>
        </Container>
    );
}

export default RewardsOverview;
