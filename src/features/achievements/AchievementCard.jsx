import styled from "styled-components";
import { HiOutlineTrophy, HiLockClosed, HiCheck } from "react-icons/hi2";
import { format } from "date-fns";
import { media } from "../../utils/constants";
import { useAchievementReward } from "./usePlayerRewards";
import RewardBadge from "./RewardBadge";
import { useOwnPlayer } from "../../hooks/useOwnPlayer";

const Card = styled.div`
    display: flex;
    gap: ${(props) => (props.$compact ? "1rem" : "1.6rem")};
    padding: ${(props) => (props.$compact ? "1rem" : "1.6rem")};
    background-color: ${(props) =>
        props.$isUnlocked
            ? "var(--achievement-unlocked-bg, var(--color-grey-50))"
            : props.$isAvailable
            ? "var(--color-grey-0)"
            : "var(--color-grey-100)"};
    border: ${(props) => (props.$compact ? "none" : "1px solid")};
    border-color: ${(props) =>
        props.$isUnlocked
            ? "var(--achievement-unlocked-border, var(--color-brand-500))"
            : "var(--secondary-border-color)"};
    border-radius: ${(props) =>
        props.$compact ? "0" : "var(--border-radius-md)"};
    opacity: ${(props) =>
        props.$compact
            ? 0.7
            : props.$isAvailable || props.$isUnlocked
            ? 1
            : 0.6};
    transition: all 0.2s ease;

    &:hover {
        transform: ${(props) =>
            !props.$compact && (props.$isAvailable || props.$isUnlocked)
                ? "translateY(-2px)"
                : "none"};
        box-shadow: ${(props) =>
            !props.$compact && (props.$isAvailable || props.$isUnlocked)
                ? "0 4px 12px rgba(0, 0, 0, 0.15)"
                : "none"};
    }

    ${media.mobile} {
        padding: ${(props) => (props.$compact ? "0.8rem" : "1.2rem")};
        gap: ${(props) => (props.$compact ? "0.8rem" : "1.2rem")};
    }
`;

const IconContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: ${(props) => (props.$compact ? "4rem" : "6rem")};
    height: ${(props) => (props.$compact ? "4rem" : "6rem")};
    min-width: ${(props) => (props.$compact ? "4rem" : "6rem")};
    border-radius: 50%;
    background: ${(props) =>
        props.$isUnlocked
            ? "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700))"
            : props.$isAvailable
            ? "var(--color-grey-200)"
            : "var(--color-grey-300)"};
    color: ${(props) =>
        props.$isUnlocked ? "white" : "var(--color-grey-500)"};
    font-size: ${(props) => (props.$compact ? "1.6rem" : "2.4rem")};
    position: relative;

    ${media.mobile} {
        width: ${(props) => (props.$compact ? "3.2rem" : "4.8rem")};
        height: ${(props) => (props.$compact ? "3.2rem" : "4.8rem")};
        min-width: ${(props) => (props.$compact ? "3.2rem" : "4.8rem")};
        font-size: ${(props) => (props.$compact ? "1.4rem" : "2rem")};
    }
`;

const CheckBadge = styled.div`
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

const Content = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 0.4rem;
`;

const Name = styled.h3`
    font-size: ${(props) => (props.$compact ? "1.4rem" : "1.6rem")};
    font-weight: 600;
    color: ${(props) =>
        props.$isUnlocked
            ? "var(--color-brand-700)"
            : "var(--primary-text-color)"};
    margin: 0;

    ${media.mobile} {
        font-size: ${(props) => (props.$compact ? "1.2rem" : "1.4rem")};
    }
`;

const Points = styled.span`
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 1.4rem;
    font-weight: 600;
    color: ${(props) =>
        props.$isUnlocked ? "var(--color-brand-600)" : "var(--color-grey-500)"};
    white-space: nowrap;

    & svg {
        width: 1.6rem;
        height: 1.6rem;
    }

    ${media.mobile} {
        font-size: 1.2rem;
    }
`;

const Description = styled.p`
    font-size: 1.4rem;
    color: var(--secondary-text-color);
    margin: 0 0 0.8rem 0;
    line-height: 1.4;

    ${media.mobile} {
        font-size: 1.2rem;
    }
`;

const ProgressContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
`;

const ProgressBar = styled.div`
    width: 100%;
    height: 0.8rem;
    background-color: var(--color-grey-200);
    border-radius: 9999px;
    overflow: hidden;
`;

const ProgressFill = styled.div`
    height: 100%;
    width: ${(props) => props.$percent}%;
    background: ${(props) =>
        props.$isComplete
            ? "var(--color-green-500)"
            : "linear-gradient(90deg, var(--color-brand-500), var(--color-brand-600))"};
    border-radius: 9999px;
    transition: width 0.3s ease;
`;

const ProgressText = styled.span`
    font-size: 1.2rem;
    color: var(--tertiary-text-color);
    text-align: right;
`;

const HiddenBadge = styled.span`
    font-size: 1rem;
    padding: 0.2rem 0.6rem;
    background-color: var(--color-grey-200);
    color: var(--color-grey-600);
    border-radius: var(--border-radius-sm);
    text-transform: uppercase;
    font-weight: 500;
`;

const ScopeBadge = styled.span`
    font-size: 1rem;
    padding: 0.2rem 0.6rem;
    background-color: ${(props) =>
        props.$isGlobal ? "var(--color-yellow-100)" : "var(--color-brand-100)"};
    color: ${(props) =>
        props.$isGlobal ? "var(--color-yellow-700)" : "var(--color-brand-700)"};
    border-radius: var(--border-radius-sm);
    text-transform: uppercase;
    font-weight: 500;
`;

const UnlockedDate = styled.span`
    font-size: 1.2rem;
    color: var(--tertiary-text-color);
    margin-top: 0.4rem;
`;

function AchievementCard({ achievement, compact = false }) {
    const {
        key,
        name,
        description,
        points,
        icon,
        is_hidden: isHidden,
        is_season_specific: isSeasonSpecific,
        max_progress: maxProgress,
        currentProgress,
        isUnlocked,
        isAvailable,
        unlockedAt,
        progressPercent,
    } = achievement;

    // Fetch reward linked to this achievement
    const { reward } = useAchievementReward(key);

    const showProgress = maxProgress > 1 && !isUnlocked && !compact;
    const displayIcon = icon || "🏆";

    return (
        <Card
            $isUnlocked={isUnlocked}
            $isAvailable={isAvailable}
            $compact={compact}
        >
            <IconContainer
                $isUnlocked={isUnlocked}
                $isAvailable={isAvailable}
                $compact={compact}
            >
                {!isAvailable && !isUnlocked ? (
                    <HiLockClosed />
                ) : (
                    <span>{displayIcon}</span>
                )}
                {isUnlocked && !compact && (
                    <CheckBadge>
                        <HiCheck />
                    </CheckBadge>
                )}
            </IconContainer>

            <Content>
                <Header>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.8rem",
                            flexWrap: "wrap",
                        }}
                    >
                        <Name $isUnlocked={isUnlocked} $compact={compact}>
                            {name}
                        </Name>
                        {isHidden && !isUnlocked && (
                            <HiddenBadge>Secret</HiddenBadge>
                        )}
                        {!compact && isSeasonSpecific === false && (
                            <ScopeBadge $isGlobal={true}>All-Time</ScopeBadge>
                        )}
                        {!compact && reward && <RewardBadge reward={reward} />}
                    </div>
                    <Points $isUnlocked={isUnlocked}>
                        <HiOutlineTrophy />
                        {points}
                    </Points>
                </Header>

                {!compact && <Description>{description}</Description>}

                {showProgress && isAvailable && (
                    <ProgressContainer>
                        <ProgressBar>
                            <ProgressFill
                                $percent={progressPercent}
                                $isComplete={isUnlocked}
                            />
                        </ProgressBar>
                        <ProgressText>
                            {currentProgress} / {maxProgress}
                        </ProgressText>
                    </ProgressContainer>
                )}

                {isUnlocked && unlockedAt && !compact && (
                    <UnlockedDate>
                        Unlocked:{" "}
                        {format(new Date(unlockedAt), "dd.MM.yyyy - HH:mm")}
                    </UnlockedDate>
                )}
            </Content>
        </Card>
    );
}

export default AchievementCard;
