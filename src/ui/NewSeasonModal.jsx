import styled, { keyframes } from "styled-components";
import Button from "./Button";
import { HiOutlineTrophy } from "react-icons/hi2";

const fadeIn = keyframes`
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
`;

const scaleIn = keyframes`
    from {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.9);
    }
    to {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }
`;

const shimmer = keyframes`
    0% {
        background-position: -200% center;
    }
    100% {
        background-position: 200% center;
    }
`;

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: 9999;
    animation: ${fadeIn} 0.3s ease-out;
`;

const ModalContainer = styled.div`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(
        135deg,
        var(--primary-background-color) 0%,
        var(--secondary-background-color) 100%
    );
    border-radius: 1.6rem;
    padding: 4rem 4.8rem;
    z-index: 10000;
    animation: ${scaleIn} 0.4s ease-out forwards;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5),
        0 0 0 1px rgba(255, 255, 255, 0.1);
    text-align: center;
    max-width: 90vw;
    width: 44rem;
`;

const TrophyIcon = styled(HiOutlineTrophy)`
    width: 6rem;
    height: 6rem;
    color: var(--color-brand-500);
    margin-bottom: 1.6rem;
    filter: drop-shadow(0 0 10px var(--color-brand-500));
`;

const SeasonTitle = styled.h1`
    font-size: 2.8rem;
    font-weight: 700;
    color: var(--primary-text-color);
    margin-bottom: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
`;

const SeasonName = styled.span`
    display: block;
    font-size: 3.6rem;
    font-weight: 800;
    background: linear-gradient(
        90deg,
        var(--color-brand-200),
        var(--color-brand-600),
        var(--color-brand-200)
    );

    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: ${shimmer} 3s linear infinite;
    margin-bottom: 2rem;
`;

const Subtitle = styled.p`
    font-size: 1.6rem;
    color: var(--secondary-text-color);
    margin-bottom: 3.2rem;
    line-height: 1.6;
`;

const StyledButton = styled(Button)`
    font-size: 1.8rem;
    padding: 1.4rem 3.2rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    transition: all 0.2s ease;
    justify-self: center;

    &:hover {
        transform: scale(1.05);
        box-shadow: 0 10px 30px -10px var(--color-brand-500),
            2px 2px 2px 1px rgba(0, 0, 0, 0.7);
    }

    &:active {
        transform: scale(0.98);
    }
`;

function NewSeasonModal({ seasonName, onClose }) {
    console.log("Rendering NewSeasonModal for season:", seasonName);

    return (
        <>
            <Overlay onClick={onClose} />
            <ModalContainer>
                <TrophyIcon />
                <SeasonTitle>New Season Has Arrived!</SeasonTitle>
                <SeasonName>{seasonName}</SeasonName>
                <Subtitle>
                    A new era begins. Time to make history and climb the ranks!
                </Subtitle>
                <StyledButton
                    $size="large"
                    $variation="primary"
                    onClick={onClose}
                >
                    For Honor and Glory!
                </StyledButton>
            </ModalContainer>
        </>
    );
}

export default NewSeasonModal;
