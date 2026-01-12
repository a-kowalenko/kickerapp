import styled, { keyframes } from "styled-components";
import { useState } from "react";
import { createPortal } from "react-dom";
import { HiOutlineArrowsRightLeft } from "react-icons/hi2";
import Button from "../../ui/Button";

const fadeIn = keyframes`
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
`;

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContent = styled.div`
    background: var(--secondary-background-color);
    border: 1px solid var(--primary-border-color);
    border-radius: 1.2rem;
    padding: 2.5rem;
    max-width: 40rem;
    width: 90%;
    box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
`;

const ModalHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    color: var(--primary-button-color);
`;

const ModalTitle = styled.h3`
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--primary-text-color);
`;

const ModalText = styled.p`
    font-size: 1.4rem;
    color: var(--primary-text-color);
    opacity: 0.8;
    margin-bottom: 2rem;
    line-height: 1.6;
`;

const KickerNameHighlight = styled.span`
    font-weight: 600;
    color: var(--primary-button-color);
`;

const CheckboxWrapper = styled.label`
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
    cursor: pointer;
    font-size: 1.3rem;
    color: var(--secondary-text-color);

    &:hover {
        color: var(--primary-text-color);
    }
`;

const Checkbox = styled.input`
    width: 1.6rem;
    height: 1.6rem;
    accent-color: var(--primary-button-color);
    cursor: pointer;
`;

const ModalButtons = styled.div`
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
`;

const ModalButton = styled(Button)`
    padding: 1rem 2rem;
    font-size: 1.4rem;
`;

function KickerSwitchConfirmModal({
    kickerName,
    onConfirm,
    onCancel,
    onDontAskAgain,
}) {
    const [dontAskAgain, setDontAskAgain] = useState(false);

    function handleConfirm() {
        if (dontAskAgain) {
            onDontAskAgain?.();
        }
        onConfirm();
    }

    function handleOverlayClick(e) {
        e.stopPropagation();
        if (e.target === e.currentTarget) {
            onCancel();
        }
    }

    function handleContentClick(e) {
        e.stopPropagation();
    }

    function handleCheckboxChange(e) {
        e.stopPropagation();
        setDontAskAgain(e.target.checked);
    }

    return createPortal(
        <ModalOverlay onClick={handleOverlayClick} data-modal-overlay>
            <ModalContent onClick={handleContentClick}>
                <ModalHeader>
                    <HiOutlineArrowsRightLeft size={28} />
                    <ModalTitle>Switch Kicker?</ModalTitle>
                </ModalHeader>
                <ModalText>
                    This notification is from{" "}
                    <KickerNameHighlight>{kickerName}</KickerNameHighlight>.
                    Do you want to switch to this kicker?
                </ModalText>
                <CheckboxWrapper onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                        type="checkbox"
                        checked={dontAskAgain}
                        onChange={handleCheckboxChange}
                    />
                    Don&apos;t ask again
                </CheckboxWrapper>
                <ModalButtons>
                    <ModalButton $variation="secondary" onClick={onCancel}>
                        Cancel
                    </ModalButton>
                    <ModalButton $variation="primary" onClick={handleConfirm}>
                        Switch & View
                    </ModalButton>
                </ModalButtons>
            </ModalContent>
        </ModalOverlay>,
        document.body
    );
}

export default KickerSwitchConfirmModal;
