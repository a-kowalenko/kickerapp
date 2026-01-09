import styled from "styled-components";
import { HiOutlineArrowRight } from "react-icons/hi2";
import AchievementCard from "./AchievementCard";
import { media } from "../../utils/constants";

const ChainContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
`;

const ChainWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 1.2rem;

    ${media.tablet} {
        flex-direction: column;
        align-items: stretch;
    }
`;

const ArrowContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-grey-400);

    & svg {
        width: 2.4rem;
        height: 2.4rem;
    }

    ${media.tablet} {
        transform: rotate(90deg);
    }
`;

const NextAchievementWrapper = styled.div`
    flex: 1;
    opacity: 0.5;
    position: relative;

    &::before {
        content: "Next in chain";
        position: absolute;
        top: -1.8rem;
        left: 0;
        font-size: 1rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--tertiary-text-color);
    }
`;

const CurrentAchievementWrapper = styled.div`
    flex: 1;
`;

function AchievementChain({ currentAchievement, nextAchievement }) {
    if (!nextAchievement) {
        return <AchievementCard achievement={currentAchievement} />;
    }

    return (
        <ChainContainer>
            <ChainWrapper>
                <CurrentAchievementWrapper>
                    <AchievementCard achievement={currentAchievement} />
                </CurrentAchievementWrapper>

                <ArrowContainer>
                    <HiOutlineArrowRight />
                </ArrowContainer>

                <NextAchievementWrapper>
                    <AchievementCard
                        achievement={{
                            ...nextAchievement,
                            isAvailable: false,
                            isUnlocked: false,
                            currentProgress: 0,
                            progressPercent: 0,
                        }}
                    />
                </NextAchievementWrapper>
            </ChainWrapper>
        </ChainContainer>
    );
}

export default AchievementChain;
