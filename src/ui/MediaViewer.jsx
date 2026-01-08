import styled, { keyframes } from "styled-components";
import { createPortal } from "react-dom";
import { HiXMark, HiArrowTopRightOnSquare } from "react-icons/hi2";
import { useEffect, useCallback } from "react";

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
        transform: translate(-50%, -50%) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }
`;

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(4px);
    z-index: 9999;
    animation: ${fadeIn} 0.2s ease-out;
    cursor: pointer;
`;

const MediaContainer = styled.div`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10000;
    animation: ${scaleIn} 0.2s ease-out forwards;
    max-width: 90vw;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const StyledImage = styled.img`
    max-width: 90vw;
    max-height: 85vh;
    object-fit: contain;
    border-radius: var(--border-radius-md);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
`;

const Controls = styled.div`
    position: fixed;
    top: 1.6rem;
    right: 1.6rem;
    display: flex;
    gap: 0.8rem;
    z-index: 10001;
`;

const ControlButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4rem;
    height: 4rem;
    border: none;
    border-radius: var(--border-radius-sm);
    background-color: rgba(0, 0, 0, 0.6);
    color: white;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background-color: rgba(0, 0, 0, 0.8);
        transform: scale(1.05);
    }

    & svg {
        font-size: 2rem;
    }
`;

function MediaViewer({ src, alt = "Image", onClose }) {
    // Handle keyboard events
    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        },
        [onClose]
    );

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        // Prevent body scroll when modal is open
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [handleKeyDown]);

    function handleOpenInNewTab(e) {
        e.stopPropagation();
        window.open(src, "_blank");
    }

    function handleOverlayClick(e) {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }

    return createPortal(
        <>
            <Overlay onClick={handleOverlayClick} />
            <Controls>
                <ControlButton
                    onClick={handleOpenInNewTab}
                    title="Open in new tab"
                >
                    <HiArrowTopRightOnSquare />
                </ControlButton>
                <ControlButton onClick={onClose} title="Close (Esc)">
                    <HiXMark />
                </ControlButton>
            </Controls>
            <MediaContainer onClick={onClose}>
                <StyledImage
                    src={src}
                    alt={alt}
                    onClick={(e) => e.stopPropagation()}
                />
            </MediaContainer>
        </>,
        document.body
    );
}

export default MediaViewer;
