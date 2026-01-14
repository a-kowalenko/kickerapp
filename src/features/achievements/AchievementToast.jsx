import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { HiOutlineTrophy, HiXMark } from "react-icons/hi2";
import { media, MAX_MOBILE_WIDTH } from "../../utils/constants";
import {
    TOAST_DURATION,
    TOAST_DURATION_MOBILE,
} from "./useAchievementNotifications.js";

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

const slideInTop = keyframes`
    from {
        transform: translateY(100%);
        opacity: 0;
    }
    to {
        transform: translateY(0);
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

    ${media.mobile} {
        bottom: 1rem;
        right: 1rem;
        left: 1rem;
        animation: ${slideInTop} 0.4s ease-out;
    }
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

    ${media.mobile} {
        min-width: unset;
        max-width: unset;
        width: 100%;
        gap: 0.8rem;
        padding: 0.8rem 1rem;
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

    ${media.mobile} {
        width: 2.8rem;
        height: 2.8rem;
        min-width: 2.8rem;
        font-size: 1.4rem;
    }
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

    ${media.mobile} {
        display: none;
    }
`;

const AchievementName = styled.div`
    font-size: 1.8rem;
    font-weight: 700;

    ${media.mobile} {
        font-size: 1.3rem;
    }
`;

const PlayerNamePrefix = styled.span`
    display: none;
    font-weight: 400;
    opacity: 0.85;

    ${media.mobile} {
        display: inline;
    }
`;

const AchievementDescription = styled.div`
    font-size: 1.4rem;
    opacity: 0.85;

    ${media.mobile} {
        display: none;
    }
`;

const Points = styled.div`
    font-size: 1.4rem;
    opacity: 0.9;

    ${media.mobile} {
        display: none;
    }
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

    ${media.mobile} {
        position: static;
        padding: 0.2rem;
        opacity: 0.8;
        margin-left: auto;

        & svg {
            width: 1.6rem;
            height: 1.6rem;
        }
    }
`;

const TimerBar = styled.div.attrs((props) => ({
    style: {
        width: `${props.$progress}%`,
    },
}))`
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    background: rgba(255, 255, 255, 0.8);
    transition: width 0.1s linear;
    z-index: 3;

    ${media.mobile} {
        height: 2px;
    }
`;

function AchievementToast({ achievement, onClose }) {
    const { name, points, icon, description, playerName, isOwnAchievement } =
        achievement;

    const isMobile = window.innerWidth <= MAX_MOBILE_WIDTH;
    const duration = isMobile ? TOAST_DURATION_MOBILE : TOAST_DURATION;
    const [progress, setProgress] = useState(100);

    // Visual timer countdown
    useEffect(() => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);

            if (remaining <= 0) {
                clearInterval(interval);
                onClose();
            }
        }, 50);

        return () => clearInterval(interval);
    }, [duration, onClose]);

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
                    <AchievementName>
                        <PlayerNamePrefix>{playerName}: </PlayerNamePrefix>
                        {name}
                    </AchievementName>
                    <AchievementDescription>
                        {description}
                    </AchievementDescription>
                    <Points>+{points} points</Points>
                </Content>

                <TimerBar $progress={progress} />
            </ToastCard>
        </Container>
    );
}

export default AchievementToast;
