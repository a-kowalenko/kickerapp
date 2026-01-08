import styled, { keyframes } from "styled-components";
import { HiOutlineTrophy, HiXMark } from "react-icons/hi2";

const slideIn = keyframes`
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
`;

const shimmer = keyframes`
    0% {
        background-position: -200% 0;
    }
    100% {
        background-position: 200% 0;
    }
`;

const Container = styled.div`
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    z-index: 9999;
    animation: ${slideIn} 0.5s ease-out;
`;

const ToastCard = styled.div`
    display: flex;
    align-items: center;
    gap: 1.6rem;
    padding: 1.6rem 2rem;
    background: linear-gradient(
        135deg,
        var(--color-brand-600) 0%,
        var(--color-brand-700) 100%
    );
    border-radius: var(--border-radius-md);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    color: white;
    min-width: 32rem;
    max-width: 40rem;
    position: relative;
    overflow: hidden;

    &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
        );
        background-size: 200% 100%;
        animation: ${shimmer} 2s ease-in-out;
    }
`;

const IconContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 5rem;
    height: 5rem;
    min-width: 5rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    font-size: 2.4rem;
    position: relative;
    z-index: 1;
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    flex: 1;
    position: relative;
    z-index: 1;
`;

const Title = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    font-size: 1.2rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    opacity: 0.9;

    & svg {
        width: 1.6rem;
        height: 1.6rem;
    }
`;

const AchievementName = styled.div`
    font-size: 1.8rem;
    font-weight: 700;
`;

const AchievementDescription = styled.div`
    font-size: 1.4rem;
    opacity: 0.85;
`;

const Points = styled.div`
    font-size: 1.4rem;
    opacity: 0.9;
`;

const CloseButton = styled.button`
    position: absolute;
    top: 0.8rem;
    right: 0.8rem;
    background: none;
    border: none;
    color: white;
    opacity: 0.7;
    cursor: pointer;
    padding: 0.4rem;
    z-index: 2;

    &:hover {
        opacity: 1;
    }

    & svg {
        width: 2rem;
        height: 2rem;
    }
`;

function AchievementToast({ achievement, onClose }) {
    const { name, points, icon, description, playerName, isOwnAchievement } =
        achievement;

    return (
        <Container>
            <ToastCard>
                <CloseButton onClick={onClose}>
                    <HiXMark />
                </CloseButton>

                <IconContainer>{icon || "🏆"}</IconContainer>

                <Content>
                    <Title>
                        <HiOutlineTrophy />
                        {isOwnAchievement
                            ? "Achievement Unlocked!"
                            : `${playerName} unlocked:`}
                    </Title>
                    <AchievementName>{name}</AchievementName>
                    <AchievementDescription>
                        {description}
                    </AchievementDescription>
                    <Points>+{points} points</Points>
                </Content>
            </ToastCard>
        </Container>
    );
}

export default AchievementToast;
