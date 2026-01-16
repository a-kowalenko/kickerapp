import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import styled, { keyframes } from "styled-components";
import { HiOutlineBugAnt, HiXMark, HiCheck } from "react-icons/hi2";
import { media } from "../utils/constants";
import { useUser } from "../features/authentication/useUser";
import supabase from "../services/supabase";
import toast from "react-hot-toast";

const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
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

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 9999;
    animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContainer = styled.div`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10000;
    width: 90%;
    max-width: 48rem;
    max-height: 90vh;
    overflow-y: auto;
    animation: ${scaleIn} 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;

    ${media.mobile} {
        width: 95%;
        max-height: 85vh;
    }
`;

const ModalContent = styled.div`
    background: var(--secondary-background-color);
    border: 1px solid var(--primary-border-color);
    border-radius: 1.6rem;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
`;

const ModalHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2rem 2.4rem;
    background: linear-gradient(
        135deg,
        var(--color-red-100) 0%,
        var(--color-orange-100) 100%
    );
    border-bottom: 1px solid var(--primary-border-color);

    .dark-mode & {
        background: linear-gradient(
            135deg,
            rgba(239, 68, 68, 0.15) 0%,
            rgba(249, 115, 22, 0.15) 100%
        );
    }
`;

const HeaderTitle = styled.div`
    display: flex;
    align-items: center;
    gap: 1.2rem;

    & svg {
        font-size: 2.8rem;
        color: var(--color-red-600);
    }
`;

const Title = styled.h2`
    font-size: 2rem;
    font-weight: 600;
    color: var(--primary-text-color);
    margin: 0;

    ${media.mobile} {
        font-size: 1.8rem;
    }
`;

const CloseButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.6rem;
    height: 3.6rem;
    border: none;
    background: var(--tertiary-background-color);
    color: var(--secondary-text-color);
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: var(--quaternary-background-color);
        color: var(--primary-text-color);
    }

    & svg {
        font-size: 2rem;
    }
`;

const ModalBody = styled.div`
    padding: 2.4rem;

    ${media.mobile} {
        padding: 1.6rem;
    }
`;

const UserInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding: 1.2rem 1.6rem;
    background: var(--tertiary-background-color);
    border-radius: var(--border-radius-md);
    margin-bottom: 2rem;
`;

const UserAvatar = styled.div`
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    background: linear-gradient(
        135deg,
        var(--primary-button-color) 0%,
        var(--primary-button-color-hover) 100%
    );
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 1.6rem;
`;

const UserDetails = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
`;

const UserName = styled.span`
    font-size: 1.4rem;
    font-weight: 500;
    color: var(--primary-text-color);
`;

const UserEmail = styled.span`
    font-size: 1.2rem;
    color: var(--tertiary-text-color);
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
`;

const FormGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
`;

const Label = styled.label`
    font-size: 1.4rem;
    font-weight: 500;
    color: var(--primary-text-color);
`;

const Textarea = styled.textarea`
    padding: 1.4rem 1.6rem;
    font-size: 1.4rem;
    font-family: inherit;
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-md);
    background-color: var(--primary-background-color);
    color: var(--primary-text-color);
    min-height: 14rem;
    resize: vertical;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:focus {
        outline: none;
        border-color: var(--color-red-500);
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
    }

    &::placeholder {
        color: var(--color-grey-400);
    }
`;

const CharCount = styled.span`
    font-size: 1.2rem;
    color: ${(props) =>
        props.$over ? "var(--color-red-500)" : "var(--tertiary-text-color)"};
    text-align: right;
`;

const HelpText = styled.p`
    font-size: 1.2rem;
    color: var(--tertiary-text-color);
    line-height: 1.6;
    margin: 0;
`;

const ButtonRow = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 1.2rem;
    margin-top: 0.8rem;

    ${media.mobile} {
        flex-direction: column-reverse;
    }
`;

const Button = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.8rem;
    padding: 1.2rem 2rem;
    font-size: 1.4rem;
    font-weight: 600;
    border: none;
    border-radius: var(--border-radius-md);
    cursor: pointer;
    transition: all 0.2s ease;

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    ${media.mobile} {
        width: 100%;
        padding: 1.4rem 2rem;
    }
`;

const CancelButton = styled(Button)`
    background: var(--tertiary-background-color);
    color: var(--secondary-text-color);

    &:hover:not(:disabled) {
        background: var(--quaternary-background-color);
        color: var(--primary-text-color);
    }
`;

const SubmitButton = styled(Button)`
    background: linear-gradient(
        135deg,
        var(--color-red-500) 0%,
        var(--color-orange-500) 100%
    );
    color: white;

    &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }

    &:active:not(:disabled) {
        transform: translateY(0);
    }
`;

// Success State
const SuccessContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    text-align: center;
    gap: 1.6rem;
    animation: ${fadeIn} 0.3s ease-out;
`;

const SuccessIcon = styled.div`
    width: 7rem;
    height: 7rem;
    border-radius: 50%;
    background: linear-gradient(
        135deg,
        var(--color-green-100) 0%,
        var(--color-green-200) 100%
    );
    display: flex;
    align-items: center;
    justify-content: center;

    .dark-mode & {
        background: linear-gradient(
            135deg,
            rgba(34, 197, 94, 0.2) 0%,
            rgba(34, 197, 94, 0.3) 100%
        );
    }

    & svg {
        font-size: 3.5rem;
        color: var(--color-green-600);
    }
`;

const SuccessTitle = styled.h3`
    font-size: 2rem;
    color: var(--primary-text-color);
    margin: 0;
`;

const SuccessText = styled.p`
    font-size: 1.4rem;
    color: var(--secondary-text-color);
    margin: 0;
    max-width: 32rem;
    line-height: 1.6;
`;

const MAX_MESSAGE_LENGTH = 2000;
const MIN_MESSAGE_LENGTH = 10;

function BugReportModal({ isOpen, onClose }) {
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const formLoadTime = useRef(Date.now());
    const { user } = useUser();

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setMessage("");
            setIsSubmitted(false);
            formLoadTime.current = Date.now();
        }
    }, [isOpen]);

    // Close on escape key
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === "Escape") {
                onClose();
            }
        }

        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const userName =
        user?.user_metadata?.name ||
        user?.user_metadata?.username ||
        user?.email?.split("@")[0] ||
        "User";
    const userEmail = user?.email || "";
    const userInitial = userName.charAt(0).toUpperCase();

    const isOverLimit = message.length > MAX_MESSAGE_LENGTH;
    const canSubmit =
        message.trim().length >= MIN_MESSAGE_LENGTH && !isOverLimit;

    async function handleSubmit(e) {
        e.preventDefault();

        if (!canSubmit || isSubmitting) return;

        // Spam check: Form submitted too quickly
        const timeTaken = Date.now() - formLoadTime.current;
        if (timeTaken < 2000) {
            toast.error("Please take your time describing the bug");
            return;
        }

        setIsSubmitting(true);

        try {
            const { data, error } = await supabase.functions.invoke(
                "create-github-issue",
                {
                    body: {
                        userName,
                        userEmail,
                        message: message.trim(),
                        userAgent: navigator.userAgent,
                        url: window.location.href,
                    },
                }
            );

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            setIsSubmitted(true);
            toast.success("Bug report submitted!");
        } catch (error) {
            console.error("Bug report error:", error);
            toast.error(
                error.message ||
                    "Failed to submit bug report. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleOverlayClick(e) {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }

    return createPortal(
        <>
            <Overlay onClick={handleOverlayClick} />
            <ModalContainer>
                <ModalContent>
                    <ModalHeader>
                        <HeaderTitle>
                            <HiOutlineBugAnt />
                            <Title>Report a Bug</Title>
                        </HeaderTitle>
                        <CloseButton onClick={onClose} aria-label="Close">
                            <HiXMark />
                        </CloseButton>
                    </ModalHeader>

                    <ModalBody>
                        {isSubmitted ? (
                            <SuccessContainer>
                                <SuccessIcon>
                                    <HiCheck />
                                </SuccessIcon>
                                <SuccessTitle>
                                    Thanks for reporting!
                                </SuccessTitle>
                                <SuccessText>
                                    We&apos;ve received your bug report and will
                                    investigate it as soon as possible.
                                    You&apos;ll receive a confirmation at{" "}
                                    <strong>{userEmail}</strong>.
                                </SuccessText>
                                <CancelButton type="button" onClick={onClose}>
                                    Close
                                </CancelButton>
                            </SuccessContainer>
                        ) : (
                            <>
                                <UserInfo>
                                    <UserAvatar>{userInitial}</UserAvatar>
                                    <UserDetails>
                                        <UserName>{userName}</UserName>
                                        <UserEmail>{userEmail}</UserEmail>
                                    </UserDetails>
                                </UserInfo>

                                <Form onSubmit={handleSubmit}>
                                    <FormGroup>
                                        <Label htmlFor="bug-message">
                                            Describe the bug
                                        </Label>
                                        <Textarea
                                            id="bug-message"
                                            value={message}
                                            onChange={(e) =>
                                                setMessage(e.target.value)
                                            }
                                            placeholder="What happened? What did you expect to happen? How can we reproduce it?"
                                            autoFocus
                                        />
                                        <CharCount $over={isOverLimit}>
                                            {message.length} /{" "}
                                            {MAX_MESSAGE_LENGTH}
                                        </CharCount>
                                        <HelpText>
                                            Include steps to reproduce, what you
                                            expected, and what actually
                                            happened. Screenshots can be shared
                                            via email reply.
                                        </HelpText>
                                    </FormGroup>

                                    <ButtonRow>
                                        <CancelButton
                                            type="button"
                                            onClick={onClose}
                                        >
                                            Cancel
                                        </CancelButton>
                                        <SubmitButton
                                            type="submit"
                                            disabled={
                                                !canSubmit || isSubmitting
                                            }
                                        >
                                            {isSubmitting
                                                ? "Submitting..."
                                                : "Submit Bug Report"}
                                        </SubmitButton>
                                    </ButtonRow>
                                </Form>
                            </>
                        )}
                    </ModalBody>
                </ModalContent>
            </ModalContainer>
        </>,
        document.body
    );
}

export default BugReportModal;
