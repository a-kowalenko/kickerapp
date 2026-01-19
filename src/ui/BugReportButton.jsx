import { useState } from "react";
import styled, { keyframes, css } from "styled-components";
import { HiOutlineBugAnt } from "react-icons/hi2";
import BugReportModal from "./BugReportModal";

const wiggle = keyframes`
    0%, 100% { transform: rotate(0deg); }
    20% { transform: rotate(-15deg); }
    40% { transform: rotate(15deg); }
    60% { transform: rotate(-10deg); }
    80% { transform: rotate(10deg); }
`;

// Desktop sidebar version - unified component with smooth label animation
const SidebarButton = styled.button`
    display: flex;
    align-items: center;
    width: 100%;
    padding: 1.2rem 0;
    margin-top: auto;
    border: none;
    border-top: 1px solid var(--secondary-border-color);
    background: transparent;
    color: var(--secondary-text-color);
    font-size: 1.4rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease;
    overflow: hidden;

    &:hover {
        background: var(--tertiary-background-color);
        color: var(--primary-text-color);
    }

    &:hover svg {
        animation: ${wiggle} 0.6s ease-in-out;
    }
`;

const IconWrapper = styled.span`
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    flex-shrink: 0;

    & svg {
        font-size: 2rem;
    }
`;

const LabelWrapper = styled.span`
    display: flex;
    align-items: center;
    overflow: hidden;
    transition: max-width 0.2s ease-out, opacity 0.15s ease-out;
    white-space: nowrap;

    ${(props) =>
        props.$isExpanded
            ? css`
                  max-width: 200px;
                  opacity: 1;
                  transition: max-width 0.2s ease-out,
                      opacity 0.2s ease-out 0.05s;
              `
            : css`
                  max-width: 0;
                  opacity: 0;
              `}
`;

// Tooltip for collapsed state
const CollapsedTooltip = styled.span`
    position: absolute;
    left: calc(100% + 0.8rem);
    white-space: nowrap;
    padding: 0.6rem 1rem;
    background: var(--secondary-background-color);
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-md);
    font-size: 1.2rem;
    font-weight: 500;
    color: var(--primary-text-color);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    pointer-events: none;
    opacity: 0;
    transform: translateX(-5px);
    transition: opacity 0.2s ease, transform 0.2s ease;
    z-index: 100;
`;

const SidebarButtonContainer = styled.div`
    position: relative;
    margin-top: auto;

    &:hover ${CollapsedTooltip} {
        ${(props) =>
            !props.$isExpanded &&
            css`
                opacity: 1;
                transform: translateX(0);
            `}
    }
`;

// Mobile/tablet footer version - subtle ghost button style
const FooterButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.8rem;
    padding: 0.8rem 1.4rem;
    border: 1px solid var(--color-red-700);
    border-radius: var(--border-radius-sm);
    background: transparent;
    color: var(--color-red-500);
    font-size: 1.3rem;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.15);
    transition: all 0.2s ease;

    /* Light mode adjustments */
    @media (prefers-color-scheme: light) {
        border-color: var(--color-red-400);
        color: var(--color-red-600);
        box-shadow: 0 2px 8px rgba(239, 68, 68, 0.12);
    }

    .light-mode & {
        border-color: var(--color-red-400);
        color: var(--color-red-600);
        box-shadow: 0 2px 8px rgba(239, 68, 68, 0.12);
    }

    &:hover {
        background: rgba(239, 68, 68, 0.1);
        border-color: var(--color-red-500);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
    }

    &:active {
        background: rgba(239, 68, 68, 0.15);
        box-shadow: 0 2px 6px rgba(239, 68, 68, 0.2);
    }

    &:hover svg {
        animation: ${wiggle} 0.6s ease-in-out;
    }

    & svg {
        font-size: 1.6rem;
    }
`;

// Wrapper for footer positioning
const FooterButtonWrapper = styled.div`
    display: flex;
    justify-content: flex-end;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--primary-border-color);
`;

/**
 * BugReportButton - Renders in different styles based on variant
 * @param {string} variant - "sidebar" or "footer"
 * @param {boolean} isExpanded - Whether sidebar is expanded (for sidebar variant)
 */
function BugReportButton({ variant = "footer", isExpanded }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            {variant === "sidebar" && (
                <SidebarButtonContainer $isExpanded={isExpanded}>
                    <SidebarButton
                        onClick={() => setIsModalOpen(true)}
                        aria-label="Report a bug"
                        title={isExpanded ? "Report a bug" : ""}
                    >
                        <IconWrapper>
                            <HiOutlineBugAnt />
                        </IconWrapper>
                        <LabelWrapper $isExpanded={isExpanded}>
                            Report a Bug
                        </LabelWrapper>
                    </SidebarButton>
                    <CollapsedTooltip>Report a Bug</CollapsedTooltip>
                </SidebarButtonContainer>
            )}

            {variant === "footer" && (
                <FooterButtonWrapper>
                    <FooterButton
                        onClick={() => setIsModalOpen(true)}
                        aria-label="Report a bug"
                    >
                        <HiOutlineBugAnt />
                        Report a Bug
                    </FooterButton>
                </FooterButtonWrapper>
            )}

            <BugReportModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}

export default BugReportButton;
